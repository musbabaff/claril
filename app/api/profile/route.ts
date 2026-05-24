import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Bypass RLS recursively using the service role client
    const supabaseAdmin = createAdminClient();
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      // Fallback if public profile does not exist yet
      return NextResponse.json({
        data: {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Operator User',
          organization_name: user.user_metadata?.organization_name || 'Acme Industrial',
          role: 'analyst',
        }
      });
    }

    return NextResponse.json({ data: profile });
  } catch (err: unknown) {
    console.error('Profile API error:', err);
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, organization_name, role } = body;

    const supabaseAdmin = createAdminClient();
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: user.id,
        full_name,
        organization_name,
        role: role || 'analyst',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileErr) {
      throw profileErr;
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (err: unknown) {
    console.error('Profile update error:', err);
    const msg = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
