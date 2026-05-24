import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import pLimit from 'p-limit';
import { extractDocument } from '@/lib/ai/extract-document';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const caseId = resolvedParams.id;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Ownership & permission check
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .select('id, user_id, status')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (caseError) {
      return NextResponse.json({ error: caseError.message }, { status: 500 });
    }
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case not found or unauthorized' }, { status: 404 });
    }

    // 2. Fetch active documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId);

    if (docsError) {
      return NextResponse.json({ error: docsError.message }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents uploaded for this case.' }, { status: 400 });
    }

    // 3. Update case status to 'extracting'
    const { error: updateCaseError } = await supabase
      .from('cases')
      .update({ status: 'extracting', updated_at: new Date().toISOString() })
      .eq('id', caseId);

    if (updateCaseError) {
      return NextResponse.json({ error: updateCaseError.message }, { status: 500 });
    }

    // 4. Create an audit log entry for extraction start
    await supabase.from('audit_logs').insert({
      case_id: caseId,
      user_id: user.id,
      action: 'EXTRACTION_STARTED',
      metadata: {
        document_count: documents.length,
      },
    });

    // 5. Initialize concurrency limit (sequential for free-tier rate limits)
    const limit = pLimit(1);
    let successCount = 0;
    let failureCount = 0;
    let docIndex = 0;

    const extractionTasks = documents.map((doc) =>
      limit(async () => {
        // Small delay between sequential requests to respect free-tier rate limits
        if (docIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        docIndex++;
        let extId: string | null = null;
        
        try {
          // Check for existing extraction row
          const { data: existing } = await supabase
            .from('extractions')
            .select('id')
            .eq('document_id', doc.id)
            .maybeSingle();

          const nowIso = new Date().toISOString();

          if (existing) {
            extId = existing.id;
            await supabase
              .from('extractions')
              .update({
                status: 'processing',
                started_at: nowIso,
                raw_data: null,
                structured_data: null,
                confidence_score: null,
                error_message: null,
                tokens_input: null,
                tokens_output: null,
                cost_usd: null,
                completed_at: null,
              })
              .eq('id', extId);
          } else {
            const { data: inserted, error: insertErr } = await supabase
              .from('extractions')
              .insert({
                document_id: doc.id,
                case_id: caseId,
                status: 'processing',
                started_at: nowIso,
              })
              .select('id')
              .single();

            if (insertErr) {
              throw new Error(`Failed to initialize extraction log: ${insertErr.message}`);
            }
            extId = inserted.id;
          }

          // Download file buffer from storage
          const { data: fileData, error: downloadError } = await supabase
            .storage
            .from('case-documents')
            .download(doc.file_path);

          if (downloadError) {
            throw new Error(`Storage download failed: ${downloadError.message}`);
          }
          if (!fileData) {
            throw new Error('Storage returned empty file data.');
          }

          // Convert Blob/Buffer to base64
          const arrayBuffer = await fileData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64String = buffer.toString('base64');

          // Call Claude extraction service
          const result = await extractDocument(base64String, doc.original_filename);

          // Update extraction row as completed
          const { error: completeError } = await supabase
            .from('extractions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              raw_data: {
                provider: result.provider,
                model: result.model,
                raw_response: result.raw_data,
              },
              structured_data: result.structured_data,
              confidence_score: result.confidence_score,
              tokens_input: result.tokens_input,
              tokens_output: result.tokens_output,
              cost_usd: result.cost_usd,
            })
            .eq('id', extId);

          if (completeError) {
            throw new Error(`Failed to save completed extraction: ${completeError.message}`);
          }

          // Create document-level audit log
          await supabase.from('audit_logs').insert({
            case_id: caseId,
            user_id: user.id,
            action: 'DOCUMENT_EXTRACTED',
            metadata: {
              document_id: doc.id,
              original_filename: doc.original_filename,
              status: 'completed',
              cost_usd: result.cost_usd,
            },
          });

          successCount++;
        } catch (err) {
          console.error(`Extraction failed for document ${doc.id}:`, err);
          failureCount++;

          const errMessage = err instanceof Error ? err.message : String(err);

          if (extId) {
            await supabase
              .from('extractions')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: errMessage,
              })
              .eq('id', extId);
          }

          // Log failure to audit logs
          await supabase.from('audit_logs').insert({
            case_id: caseId,
            user_id: user.id,
            action: 'DOCUMENT_EXTRACTION_FAILED',
            metadata: {
              document_id: doc.id,
              original_filename: doc.original_filename,
              error: errMessage,
            },
          });
        }
      })
    );

    // Wait for all concurrency-limited extractions to finish
    await Promise.all(extractionTasks);

    // 6. Transition overall case status
    // If all succeeded: 'analyzing'
    // If any failed: keep case in 'pending' or mark as 'pending'
    const finalCaseStatus = failureCount === 0 ? 'analyzing' : 'pending';
    
    await supabase
      .from('cases')
      .update({ status: finalCaseStatus, updated_at: new Date().toISOString() })
      .eq('id', caseId);

    // Create final audit log for overall status
    await supabase.from('audit_logs').insert({
      case_id: caseId,
      user_id: user.id,
      action: 'EXTRACTION_BATCH_COMPLETED',
      metadata: {
        total_documents: documents.length,
        successes: successCount,
        failures: failureCount,
        final_case_status: finalCaseStatus,
      },
    });

    return NextResponse.json({
      success: true,
      successCount,
      failureCount,
      finalCaseStatus,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
