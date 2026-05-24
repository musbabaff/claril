import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Authenticate and verify role is admin
    await requireAdmin();

    const supabaseAdmin = createAdminClient();

    // 2. Fetch all cases
    const { data: cases, error: caseErr } = await supabaseAdmin
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (caseErr) throw caseErr;

    // 3. Fetch all profiles to map user_id -> Name/Org
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, role');
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Fetch emails from auth.users (defensively)
    const emailMap = new Map<string, string>();
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      if (authData && authData.users) {
        authData.users.forEach(u => emailMap.set(u.id, u.email || 'operator@claril.ai'));
      }
    } catch {
      // Fallback
    }

    // 4. Fetch documents count per case
    const { data: documents } = await supabaseAdmin.from('documents').select('id, case_id');
    const docCountMap = new Map<string, number>();
    (documents || []).forEach(d => {
      const cnt = docCountMap.get(d.case_id) || 0;
      docCountMap.set(d.case_id, cnt + 1);
    });

    // 5. Fetch cost per case
    const { data: extractions } = await supabaseAdmin.from('extractions').select('case_id, cost_usd');
    const { data: agentRuns } = await supabaseAdmin.from('agent_runs').select('case_id, cost_usd');

    const costMap = new Map<string, number>();
    (extractions || []).forEach(e => {
      const current = costMap.get(e.case_id) || 0;
      costMap.set(e.case_id, current + Number(e.cost_usd || 0));
    });
    (agentRuns || []).forEach(a => {
      const current = costMap.get(a.case_id) || 0;
      costMap.set(a.case_id, current + Number(a.cost_usd || 0));
    });

    // 6. Map cases
    const mappedCases = (cases || []).map(c => {
      const p = profileMap.get(c.user_id);
      return {
        id: c.id,
        subject_name: c.subject_name || 'Vega Logistics',
        case_reference: c.case_reference || 'REF-TBD',
        primary_value: c.primary_value || 0,
        status: c.status || 'pending',
        created_at: c.created_at,
        docCount: docCountMap.get(c.id) || 0,
        aiCost: Number((costMap.get(c.id) || 0).toFixed(4)),
        ownerName: p ? p.full_name : 'System User',
        ownerEmail: emailMap.get(c.user_id) || 'analyst@claril.ai',
      };
    });

    return NextResponse.json({
      success: true,
      cases: mappedCases,
    });
  } catch (err: unknown) {
    console.error('Admin cases route error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
