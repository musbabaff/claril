'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';

interface AnalysisTabProps {
  caseId: string;
  onStatusChange?: () => void;
  language?: string;
}

interface AgentRunState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  reasoning: string;
  score?: number;
  output?: {
    recommendation?: string;
    key_findings?: string[];
  };
}

export function AnalysisTab({ caseId, onStatusChange, language = 'English' }: AnalysisTabProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>('');
  
  // Real-time agent status tracking
  const [agents, setAgents] = useState<Record<string, AgentRunState>>({
    auditor: { status: 'idle', reasoning: '' },
    risk: { status: 'idle', reasoning: '' },
    compliance: { status: 'idle', reasoning: '' },
    synthesizer: { status: 'idle', reasoning: '' },
  });

  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<string>('');
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [costLedger] = useState({
    totalCost: 0,
    totalTokens: 0,
    provider: 'Gemini Free'
  });

  // Monospace consoles scroll refs
  const auditorConsoleRef = useRef<HTMLDivElement>(null);
  const riskConsoleRef = useRef<HTMLDivElement>(null);
  const complianceConsoleRef = useRef<HTMLDivElement>(null);
  const synthesizerConsoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for consoles during stream
  useEffect(() => {
    if (auditorConsoleRef.current) auditorConsoleRef.current.scrollTop = auditorConsoleRef.current.scrollHeight;
  }, [agents.auditor.reasoning]);
  
  useEffect(() => {
    if (riskConsoleRef.current) riskConsoleRef.current.scrollTop = riskConsoleRef.current.scrollHeight;
  }, [agents.risk.reasoning]);

  useEffect(() => {
    if (complianceConsoleRef.current) complianceConsoleRef.current.scrollTop = complianceConsoleRef.current.scrollHeight;
  }, [agents.compliance.reasoning]);

  useEffect(() => {
    if (synthesizerConsoleRef.current) synthesizerConsoleRef.current.scrollTop = synthesizerConsoleRef.current.scrollHeight;
  }, [agents.synthesizer.reasoning]);

  // Load existing analysis from database if any
  const loadExistingAnalysis = useCallback(async () => {
    try {
      const { data: analysis, error: aErr } = await supabase
        .from('analyses')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (aErr) throw aErr;
      if (!analysis) return;

      setOverallScore(analysis.overall_score || null);
      setRecommendation(analysis.recommendation || '');

      const { data: runs, error: rErr } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('analysis_id', analysis.id);

      if (rErr) throw rErr;
      if (!runs) return;

      const loadedAgents: Record<string, AgentRunState> = {
        auditor: { status: 'idle', reasoning: '' },
        risk: { status: 'idle', reasoning: '' },
        compliance: { status: 'idle', reasoning: '' },
        synthesizer: { status: 'idle', reasoning: '' },
      };

      runs.forEach(r => {
        let key = '';
        if (r.agent_name === 'Extraction Auditor') key = 'auditor';
        else if (r.agent_name === 'Risk Analyst') key = 'risk';
        else if (r.agent_name === 'Compliance Checker') key = 'compliance';
        else if (r.agent_name === 'Synthesizer') key = 'synthesizer';

        if (key) {
          loadedAgents[key] = {
            status: r.status as 'idle' | 'running' | 'completed' | 'failed',
            reasoning: r.reasoning_log || '',
            score: r.score || undefined,
            output: r.output || undefined,
          };
          if (r.output?.key_findings) {
            setKeyFindings(r.output.key_findings);
          }
        }
      });

      setAgents(loadedAgents);
    } catch (err) {
      console.warn('Analysis loaded in SSE mode. Table reading bypassed.', err);
    }
  }, [caseId, supabase]);

  useEffect(() => {
    loadExistingAnalysis();
  }, [loadExistingAnalysis]);

  // Run the multi-agent orchestration analysis
  const runAnalysis = async () => {
    setLoading(true);
    setStatusMsg('Waking up specialized cognitive agents...');
    setOverallScore(null);
    setRecommendation('');
    setKeyFindings([]);
    setAgents({
      auditor: { status: 'running', reasoning: '' },
      risk: { status: 'running', reasoning: '' },
      compliance: { status: 'running', reasoning: '' },
      synthesizer: { status: 'idle', reasoning: '' },
    });

    try {
      const res = await fetch(`/api/cases/${caseId}/analyze?lang=${encodeURIComponent(language)}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Server returned an error.');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Readable stream not supported.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          const lines = part.split('\n');
          let event = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) event = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
          }

          if (event && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              
              if (event === 'status') {
                setStatusMsg(data.msg || '');
              } else if (event === 'agent-stream') {
                const { agent, chunk } = data;
                setAgents(prev => ({
                  ...prev,
                  [agent]: {
                    ...prev[agent],
                    status: 'running',
                    reasoning: prev[agent].reasoning + chunk
                  }
                }));
              } else if (event === 'agent-done') {
                const { agent, content, score, recommendation, key_findings } = data;
                setAgents(prev => ({
                  ...prev,
                  [agent]: {
                    ...prev[agent],
                    status: 'completed',
                    reasoning: content,
                    score,
                    output: { recommendation, key_findings }
                  }
                }));

                // If synthesizer finished, populate totals
                if (agent === 'synthesizer') {
                  if (score !== undefined) setOverallScore(score);
                  if (recommendation) setRecommendation(recommendation);
                  if (key_findings) setKeyFindings(key_findings);
                }
              } else if (event === 'agent-err') {
                const { agent, error } = data;
                setAgents(prev => ({
                  ...prev,
                  [agent]: {
                    ...prev[agent],
                    status: 'failed',
                    reasoning: prev[agent].reasoning + `\n\n[ERROR]: ${error}`
                  }
                }));
                toast.error(`${agent.toUpperCase()} agent encountered an error.`);
              } else if (event === 'complete') {
                setStatusMsg('Analysis pipeline successfully finished.');
                toast.success('Cognitive multi-agent evaluation completed!');
                if (onStatusChange) onStatusChange();
              }
            } catch (pErr) {
              console.error('Failed to parse SSE payload:', pErr);
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Cognitive pipeline failed.';
      toast.error(errMsg);
      setStatusMsg('Pipeline failed.');
      setAgents(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (next[k].status === 'running') next[k].status = 'failed';
        });
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine indicator color
  const getStatusColor = (status: 'idle' | 'running' | 'completed' | 'failed') => {
    if (status === 'completed') return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
    if (status === 'running') return 'bg-sky-400 animate-ping';
    if (status === 'failed') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]';
    return 'bg-neutral-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  return (
    <div className="space-y-6">
      {/* Trigger & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border-subtle bg-bg-surface-2/80 backdrop-blur-md">
        <div>
          <h3 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Icon.Sparkle className="text-accent animate-pulse" size={18} />
            Multi-Agent Orchestrator
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Activate parallel cognitive specialists to inspect and audit document inconsistencies, assess risk vectors, and synthesize strategic actions.
          </p>
          {statusMsg && (
            <div className="text-xs font-mono text-accent mt-2 flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-accent animate-ping" />
              {statusMsg}
            </div>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="btn btn-primary relative overflow-hidden group px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(20,110,245,0.2)] hover:shadow-[0_0_20px_rgba(20,110,245,0.45)] transition-all"
        >
          {loading ? (
            <>
              <Icon.Loop size={14} className="animate-spin" />
              Orchestrating...
            </>
          ) : (
            <>
              <Icon.Bolt size={14} className="text-amber-400 group-hover:scale-125 transition-transform" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Agent 1: Auditor */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface backdrop-blur-sm overflow-hidden h-[280px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface-2/50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                <Icon.Shield size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Extraction Auditor</h4>
                <p className="text-[10px] text-text-muted">Data Integrity Verification</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agents.auditor.status)}`} />
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">{agents.auditor.status}</span>
            </div>
          </div>
          <div 
            ref={auditorConsoleRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/30 text-sky-300/90 thin-scroll whitespace-pre-wrap select-text selection:bg-sky-500/30"
          >
            {agents.auditor.reasoning ? (
              <>
                {agents.auditor.reasoning}
                {agents.auditor.status === 'running' && <span className="inline-block w-1.5 h-3 bg-sky-400 animate-pulse ml-0.5" />}
              </>
            ) : (
              <span className="text-neutral-500 italic">Auditor waiting in queue...</span>
            )}
          </div>
        </div>

        {/* Agent 2: Risk */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface backdrop-blur-sm overflow-hidden h-[280px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface-2/50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                <Icon.Bolt size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Risk Analyst</h4>
                <p className="text-[10px] text-text-muted">Cognitive Quality & Score</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agents.risk.status)}`} />
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">{agents.risk.status}</span>
            </div>
          </div>
          <div 
            ref={riskConsoleRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/30 text-amber-300/90 thin-scroll whitespace-pre-wrap select-text selection:bg-amber-500/30"
          >
            {agents.risk.reasoning ? (
              <>
                {agents.risk.reasoning}
                {agents.risk.status === 'running' && <span className="inline-block w-1.5 h-3 bg-amber-400 animate-pulse ml-0.5" />}
              </>
            ) : (
              <span className="text-neutral-500 italic">Risk Evaluator waiting in queue...</span>
            )}
          </div>
        </div>

        {/* Agent 3: Compliance */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface backdrop-blur-sm overflow-hidden h-[280px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface-2/50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <Icon.Check size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Compliance Checker</h4>
                <p className="text-[10px] text-text-muted">Operational Rule Verification</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agents.compliance.status)}`} />
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">{agents.compliance.status}</span>
            </div>
          </div>
          <div 
            ref={complianceConsoleRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/30 text-emerald-300/90 thin-scroll whitespace-pre-wrap select-text selection:bg-emerald-500/30"
          >
            {agents.compliance.reasoning ? (
              <>
                {agents.compliance.reasoning}
                {agents.compliance.status === 'running' && <span className="inline-block w-1.5 h-3 bg-emerald-400 animate-pulse ml-0.5" />}
              </>
            ) : (
              <span className="text-neutral-500 italic">Compliance engine waiting in queue...</span>
            )}
          </div>
        </div>

        {/* Agent 4: Synthesizer */}
        <div className="flex flex-col rounded-xl border border-border-subtle bg-bg-surface backdrop-blur-sm overflow-hidden h-[280px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-surface-2/50">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-purple-500/10 text-purple-400">
                <Icon.Logo size={14} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-primary">Strategic Synthesizer</h4>
                <p className="text-[10px] text-text-muted">Report Consensus Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getStatusColor(agents.synthesizer.status)}`} />
              <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">{agents.synthesizer.status}</span>
            </div>
          </div>
          <div 
            ref={synthesizerConsoleRef}
            className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed bg-black/30 text-purple-300/90 thin-scroll whitespace-pre-wrap select-text selection:bg-purple-500/30"
          >
            {agents.synthesizer.reasoning ? (
              <>
                {agents.synthesizer.reasoning}
                {agents.synthesizer.status === 'running' && <span className="inline-block w-1.5 h-3 bg-purple-400 animate-pulse ml-0.5" />}
              </>
            ) : (
              <span className="text-neutral-500 italic">Synthesizer waiting for specialized runs to conclude...</span>
            )}
          </div>
        </div>
      </div>

      {/* Synthesized Evaluation Panel */}
      {overallScore !== null && (
        <div className="p-6 rounded-xl border border-border-subtle bg-bg-surface-2/90 backdrop-blur-md space-y-6 animate-[fadeIn_0.4s_ease-out]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-border-subtle">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-accent font-semibold">Consolidated Recommendation</span>
              <p className="text-sm font-medium text-text-primary mt-1.5 leading-relaxed bg-bg-surface px-4 py-3 rounded-lg border border-border-subtle">
                {recommendation || 'Synthesis completed without errors.'}
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border-subtle bg-bg-surface min-w-[140px] text-center">
              <span className="text-[9px] uppercase font-mono tracking-widest text-text-muted">Overall Score</span>
              <span className="text-4xl font-extrabold text-text-primary font-mono mt-1 tracking-tighter">
                {overallScore}
              </span>
              <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full mt-2 ${getScoreBadgeColor(overallScore)}`}>
                {overallScore >= 80 ? 'EXCELLENT' : overallScore >= 50 ? 'MODERATE' : 'CRITICAL'}
              </span>
            </div>
          </div>

          {keyFindings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-primary tracking-wide uppercase mb-3">Key Strategic Findings</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {keyFindings.map((finding, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-2 text-xs text-text-muted bg-bg-surface/50 border border-border-subtle/50 px-3 py-2 rounded-lg"
                  >
                    <Icon.Check className="text-emerald-400 mt-0.5 shrink-0" size={13} />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Ledger / Provider Info */}
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted pt-2 border-t border-border-subtle/40">
            <span className="flex items-center gap-1.5">
              <Icon.Lock size={10} className="text-emerald-500" />
              Evaluation Cryptographically Committed to Ledger
            </span>
            <span className="flex items-center gap-1">
              Engine: <span className="text-text-primary font-medium">{costLedger.provider}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
