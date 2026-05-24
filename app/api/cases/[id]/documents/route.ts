import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Ownership check: Verify case exists and belongs to current user
    const { data: caseRecord, error: caseError } = await supabase
      .from('cases')
      .select('id, user_id')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (caseError) {
      return NextResponse.json({ error: caseError.message }, { status: 500 });
    }
    if (!caseRecord) {
      return NextResponse.json({ error: 'Case container not found or unauthorized access' }, { status: 404 });
    }

    const body = await request.json();
    const { filePath, documentType, originalFilename, fileSizeBytes } = body;

    if (!filePath || !originalFilename) {
      return NextResponse.json({ error: 'File path and filename are required' }, { status: 400 });
    }

    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        case_id: caseId,
        file_path: filePath,
        document_type: documentType || 'other',
        original_filename: originalFilename,
        file_size_bytes: fileSizeBytes ? Number(fileSizeBytes) : null,
      })
      .select()
      .single();

    if (docError) {
      return NextResponse.json({ error: docError.message }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from('audit_logs').insert({
      case_id: caseId,
      user_id: user.id,
      action: 'DOCUMENT_UPLOADED',
      metadata: {
        document_id: docRecord.id,
        original_filename: originalFilename,
        document_type: documentType,
      },
    });

    return NextResponse.json(docRecord);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
