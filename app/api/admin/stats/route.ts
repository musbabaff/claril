import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Authenticate and verify role is admin
    await requireAdmin();

    const supabaseAdmin = createAdminClient();

    // 2. Query basic counts
    const { count: usersCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
    const { count: casesCount } = await supabaseAdmin.from('cases').select('*', { count: 'exact', head: true });
    const { count: docsCount } = await supabaseAdmin.from('documents').select('*', { count: 'exact', head: true });
    const { count: extractionsCount } = await supabaseAdmin.from('extractions').select('*', { count: 'exact', head: true });
    const { count: analysesCount } = await supabaseAdmin.from('analyses').select('*', { count: 'exact', head: true });

    // 3. Aggregate AI costs across extractions and agent runs
    const { data: extCosts } = await supabaseAdmin.from('extractions').select('cost_usd');
    const { data: agentCosts } = await supabaseAdmin.from('agent_runs').select('cost_usd');

    const totalExtCost = (extCosts || []).reduce((acc, curr) => acc + Number(curr.cost_usd || 0), 0);
    const totalAgentCost = (agentCosts || []).reduce((acc, curr) => acc + Number(curr.cost_usd || 0), 0);
    const totalCost = Number((totalExtCost + totalAgentCost).toFixed(4));

    // 4. Fetch status breakdown
    const { data: casesStatus } = await supabaseAdmin.from('cases').select('status');
    const statusMap: Record<string, number> = {
      pending: 0,
      extracting: 0,
      analyzing: 0,
      completed: 0,
      failed: 0,
    };
    (casesStatus || []).forEach(c => {
      if (c.status in statusMap) {
        statusMap[c.status]++;
      }
    });

    const statusBreakdown = Object.entries(statusMap).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }));

    // 5. Fetch recent 10 audit logs with user info
    const { data: rawAuditLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('id, action, metadata, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(10);

    // Fetch user profile maps
    const { data: allProfiles } = await supabaseAdmin.from('profiles').select('id, full_name, role');
    const profileMap = new Map((allProfiles || []).map(p => [p.id, p]));

    const recentLogs = (rawAuditLogs || []).map(log => {
      const p = profileMap.get(log.user_id);
      return {
        id: log.id,
        action: log.action,
        metadata: log.metadata,
        created_at: log.created_at,
        userName: p ? p.full_name : 'System Operation',
        userRole: p ? p.role : 'operator',
      };
    });

    // 6. Cost breakdown by Provider (using standard parsing of logs/extraction models)
    const { data: rawExts } = await supabaseAdmin.from('extractions').select('raw_data, cost_usd');
    const { data: rawRuns } = await supabaseAdmin.from('agent_runs').select('agent_name, cost_usd');

    const providerCosts: Record<string, number> = {
      gemini: 0,
      anthropic: 0,
      openai: 0,
    };

    (rawExts || []).forEach(ext => {
      const provider = String((ext.raw_data as { provider?: string })?.provider || 'gemini').toLowerCase();
      if (provider in providerCosts) {
        providerCosts[provider] += Number(ext.cost_usd || 0);
      } else {
        providerCosts.gemini += Number(ext.cost_usd || 0);
      }
    });

    // Assume agent runs generally cost free-tier Gemini or compute allocations
    (rawRuns || []).forEach(run => {
      providerCosts.gemini += Number(run.cost_usd || 0);
    });

    const aiUsage = Object.entries(providerCosts).map(([provider, cost]) => ({
      provider: provider.toUpperCase(),
      cost: Number(cost.toFixed(4)),
    }));

    // 7. Case creation activity over last 30 days
    const { data: casesTime } = await supabaseAdmin.from('cases').select('created_at');
    const timeMap: Record<string, number> = {};
    
    // Seed last 30 days with 0
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timeMap[dateStr] = 0;
    }

    (casesTime || []).forEach(c => {
      const dateStr = String(c.created_at).split('T')[0];
      if (dateStr in timeMap) {
        timeMap[dateStr]++;
      }
    });

    const activityData = Object.entries(timeMap).map(([date, cases]) => ({
      date: date.substring(5), // 'MM-DD' format
      cases,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      stats: {
        users: usersCount || 0,
        cases: casesCount || 0,
        documents: docsCount || 0,
        extractions: extractionsCount || 0,
        analyses: analysesCount || 0,
        totalCost,
      },
      statusBreakdown,
      recentLogs,
      aiUsage,
      activityData,
    });
  } catch (err: unknown) {
    console.error('Stats endpoint error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
