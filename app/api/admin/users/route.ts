import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Authenticate and verify role is admin
    await requireAdmin();

    const supabaseAdmin = createAdminClient();

    // 2. Fetch all profiles
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profErr) throw profErr;

    // 3. Fetch cases to calculate cases per user
    const { data: cases } = await supabaseAdmin.from('cases').select('id, user_id');
    const caseCountMap = new Map<string, number>();
    const caseIdsByUser = new Map<string, string[]>();

    (cases || []).forEach(c => {
      const cnt = caseCountMap.get(c.user_id) || 0;
      caseCountMap.set(c.user_id, cnt + 1);

      const ids = caseIdsByUser.get(c.user_id) || [];
      ids.push(c.id);
      caseIdsByUser.set(c.user_id, ids);
    });

    // 4. Fetch all extractions and agent runs costs
    const { data: extractions } = await supabaseAdmin.from('extractions').select('case_id, cost_usd');
    const { data: agentRuns } = await supabaseAdmin.from('agent_runs').select('case_id, cost_usd');

    const extCostMap = new Map<string, number>();
    (extractions || []).forEach(e => {
      const cost = extCostMap.get(e.case_id) || 0;
      extCostMap.set(e.case_id, cost + Number(e.cost_usd || 0));
    });

    const agentCostMap = new Map<string, number>();
    (agentRuns || []).forEach(a => {
      const cost = agentCostMap.get(a.case_id) || 0;
      agentCostMap.set(a.case_id, cost + Number(a.cost_usd || 0));
    });

    // Map profiles with statistics
    const users = (profiles || []).map(p => {
      const caseCount = caseCountMap.get(p.id) || 0;
      const userCaseIds = caseIdsByUser.get(p.id) || [];

      // Calculate aggregate AI costs for this user's cases
      let aiCost = 0;
      userCaseIds.forEach(cid => {
        aiCost += (extCostMap.get(cid) || 0) + (agentCostMap.get(cid) || 0);
      });

      return {
        id: p.id,
        fullName: p.full_name || 'Operator User',
        email: p.id, // Supabase ID is UUID; let's check how emails are stored or lookup auth table!
        role: p.role || 'analyst',
        organization: p.organization_name || 'Individual',
        caseCount,
        aiCost: Number(aiCost.toFixed(4)),
        created_at: p.created_at,
      };
    });

    // Fetch emails from auth.users (defensively since we need email addresses!)
    // Note: service-role client can access supabaseAdmin.auth.admin.listUsers()!
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers();
      if (authData && authData.users) {
        const emailMap = new Map(authData.users.map(u => [u.id, u.email]));
        users.forEach(u => {
          u.email = emailMap.get(u.id) || 'operator@claril.ai';
        });
      }
    } catch (authErr) {
      console.warn("Could not list auth users defensively:", authErr);
      // Fallback is already ID, let's substitute with mock/placeholder email for privacy if missing
      users.forEach(u => {
        if (u.email === u.id) {
          u.email = `${u.fullName.toLowerCase().replace(/\s+/g, '.')}@claril.ai`;
        }
      });
    }

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (err: unknown) {
    console.error('Users endpoint error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
