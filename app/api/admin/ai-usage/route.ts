import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // 1. Authenticate and verify role is admin
    await requireAdmin();

    const supabaseAdmin = createAdminClient();

    // 2. Fetch extractions & agent runs for aggregations
    const { data: extractions, error: extErr } = await supabaseAdmin
      .from('extractions')
      .select('case_id, raw_data, cost_usd, tokens_input, tokens_output, created_at');
    if (extErr) throw extErr;

    const { data: agentRuns, error: runErr } = await supabaseAdmin
      .from('agent_runs')
      .select('case_id, agent_name, cost_usd, tokens_input, tokens_output, created_at');
    if (runErr) throw runErr;

    // 3. Provider breakdowns
    const providerStats: Record<string, { cost: number; inputTokens: number; outputTokens: number }> = {
      gemini: { cost: 0, inputTokens: 0, outputTokens: 0 },
      anthropic: { cost: 0, inputTokens: 0, outputTokens: 0 },
      openai: { cost: 0, inputTokens: 0, outputTokens: 0 },
    };

    // Extractions mapping
    (extractions || []).forEach(ext => {
      const provider = String((ext.raw_data as { provider?: string })?.provider || 'gemini').toLowerCase();
      const target = provider in providerStats ? provider : 'gemini';
      
      providerStats[target].cost += Number(ext.cost_usd || 0);
      providerStats[target].inputTokens += Number(ext.tokens_input || 0);
      providerStats[target].outputTokens += Number(ext.tokens_output || 0);
    });

    // Agent Runs mapping (default to Gemini tier)
    (agentRuns || []).forEach(run => {
      providerStats.gemini.cost += Number(run.cost_usd || 0);
      providerStats.gemini.inputTokens += Number(run.tokens_input || 0);
      providerStats.gemini.outputTokens += Number(run.tokens_output || 0);
    });

    const providersBreakdown = Object.entries(providerStats).map(([name, data]) => ({
      provider: name.toUpperCase(),
      cost: Number(data.cost.toFixed(4)),
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    }));

    // 4. Operations breakdown
    const extractionCost = (extractions || []).reduce((acc, curr) => acc + Number(curr.cost_usd || 0), 0);
    const analysisCost = (agentRuns || []).reduce((acc, curr) => acc + Number(curr.cost_usd || 0), 0);

    const operationsBreakdown = [
      { name: 'Document Extraction', value: Number(extractionCost.toFixed(4)) },
      { name: 'Multi-Agent Analysis', value: Number(analysisCost.toFixed(4)) },
    ];

    // 5. Daily cost over last 30 days
    const dailyMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = 0;
    }

    (extractions || []).forEach(e => {
      const dateStr = String(e.created_at).split('T')[0];
      if (dateStr in dailyMap) {
        dailyMap[dateStr] += Number(e.cost_usd || 0);
      }
    });

    (agentRuns || []).forEach(r => {
      const dateStr = String(r.created_at).split('T')[0];
      if (dateStr in dailyMap) {
        dailyMap[dateStr] += Number(r.cost_usd || 0);
      }
    });

    const dailyCosts = Object.entries(dailyMap).map(([date, cost]) => ({
      date: date.substring(5), // MM-DD
      cost: Number(cost.toFixed(4)),
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 6. Cost by User
    const { data: cases } = await supabaseAdmin.from('cases').select('id, user_id');
    const userToCasesMap = new Map<string, string>(); // caseId -> userId
    (cases || []).forEach(c => userToCasesMap.set(c.id, c.user_id));

    const userCostsMap = new Map<string, number>(); // userId -> cost
    (extractions || []).forEach(e => {
      const userId = userToCasesMap.get(e.case_id);
      if (userId) {
        const c = userCostsMap.get(userId) || 0;
        userCostsMap.set(userId, c + Number(e.cost_usd || 0));
      }
    });
    (agentRuns || []).forEach(r => {
      const userId = userToCasesMap.get(r.case_id);
      if (userId) {
        const c = userCostsMap.get(userId) || 0;
        userCostsMap.set(userId, c + Number(r.cost_usd || 0));
      }
    });

    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name');
    const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

    const usersBreakdown = Array.from(userCostsMap.entries()).map(([userId, cost]) => ({
      name: nameMap.get(userId) || 'Anonymous Analyst',
      cost: Number(cost.toFixed(4)),
    })).sort((a, b) => b.cost - a.cost).slice(0, 5);

    // 7. Per-agent stats
    const agentMap: Record<string, { count: number; cost: number }> = {};
    (agentRuns || []).forEach(run => {
      const name = run.agent_name || 'Synthesizer';
      if (!agentMap[name]) {
        agentMap[name] = { count: 0, cost: 0 };
      }
      agentMap[name].count++;
      agentMap[name].cost += Number(run.cost_usd || 0);
    });

    const agentsBreakdown = Object.entries(agentMap).map(([name, data]) => ({
      name,
      count: data.count,
      cost: Number(data.cost.toFixed(4)),
    }));

    return NextResponse.json({
      success: true,
      providersBreakdown,
      operationsBreakdown,
      dailyCosts,
      usersBreakdown,
      agentsBreakdown,
    });
  } catch (err: unknown) {
    console.error('AI usage API error:', err);
    const msg = err instanceof Error ? err.message : 'Unauthorized';
    const status = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
