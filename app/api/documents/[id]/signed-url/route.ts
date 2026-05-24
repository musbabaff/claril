import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
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

    // 2. Create signed URL for document (60s expiry)
    const { data, error: signedUrlError } = await supabase.storage
      .from('case-documents')
      .createSignedUrl(docRecord.file_path, 60);

    if (signedUrlError || !data?.signedUrl) {
      return NextResponse.json({ error: signedUrlError?.message || 'Could not generate preview link' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
