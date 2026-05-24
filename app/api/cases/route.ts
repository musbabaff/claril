import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subjectName, caseReference, primaryValue, description } = body;

    if (!subjectName) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cases')
      .insert({
        user_id: user.id,
        subject_name: subjectName,
        case_reference: caseReference || null,
        primary_value: primaryValue !== undefined && primaryValue !== null && primaryValue !== '' ? Number(primaryValue) : null,
        description: description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Insert case creation audit log
    await supabase.from('audit_logs').insert({
      case_id: data.id,
      user_id: user.id,
      action: 'CASE_CREATION',
      metadata: {
        subject_name: subjectName,
        case_reference: caseReference,
      },
    });

    return NextResponse.json(data);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
