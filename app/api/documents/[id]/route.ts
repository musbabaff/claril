import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const docId = resolvedParams.id;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get document details and verify exist
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .select('*, cases(user_id)')
      .eq('id', docId)
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // docRecord.cases is the related case record due to postgrest joining.
    const docWithCase = docRecord as unknown as { cases: { user_id: string } | null };
    const caseOwnerId = docWithCase.cases?.user_id;

    if (caseOwnerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this document container' }, { status: 403 });
    }

    // 2. Remove file from storage
    const { error: storageError } = await supabase.storage
      .from('case-documents')
      .remove([docRecord.file_path]);

    if (storageError) {
      console.error('Storage deletion warning (might be fine if file was already missing):', storageError);
    }

    // 3. Delete metadata row from DB
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // 4. Create audit log entry
    await supabase.from('audit_logs').insert({
      case_id: docRecord.case_id,
      user_id: user.id,
      action: 'DOCUMENT_DELETED',
      metadata: {
        document_id: docId,
        original_filename: docRecord.original_filename,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
