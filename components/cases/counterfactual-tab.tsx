'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';

interface CounterfactualTabProps {
  caseId: string;
  language?: string;
}

interface NumericAttribute {
  key: string;
  original: number;
  current: number;
  min: number;
  max: number;
}

export function CounterfactualTab({ caseId, language = 'English' }: CounterfactualTabProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [originalScore, setOriginalScore] = useState<number | null>(null);
  const [originalRec, setOriginalRec] = useState<string>('');
  
  // Dynamic numeric attributes parsed from extractions
  const [attributes, setAttributes] = useState<NumericAttribute[]>([]);
  
  // Simulated Results State
  const [simulatedScore, setSimulatedScore] = useState<number | null>(null);
  const [simulatedRec, setSimulatedRec] = useState<string>('');
  const [simulatedReasoning, setSimulatedReasoning] = useState<string>('');

  // Extract all numeric attributes recursively or from top-level
  const loadCaseIntelligence = useCallback(async () => {
    try {
      // 1. Fetch latest baseline analysis
      const { data: analysis } = await supabase
        .from('analyses')
        .select('*')
        .eq('case_id', caseId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysis) {
        setOriginalScore(analysis.overall_score || 85);
        setOriginalRec(analysis.recommendation || 'Case successfully audited.');
      }

      // 2. Fetch completed extraction data
      const { data: extractions } = await supabase
        .from('extractions')
        .select('*')
        .eq('case_id', caseId)
        .eq('status', 'completed');

      if (!extractions || extractions.length === 0) return;

      const parsedAttrs: NumericAttribute[] = [];
      const seenKeys = new Set<string>();

      extractions.forEach(ext => {
        const payload = ext.structured_data || ext.extracted_data || {};
        Object.entries(payload).forEach(([k, v]) => {
          if (seenKeys.has(k)) return;
          
          const numVal = typeof v === 'number' ? v : parseFloat(String(v));
          if (!isNaN(numVal) && typeof numVal === 'number' && numVal > 0) {
            seenKeys.add(k);
            
            // Set dynamic slider boundaries
            const min = 0;
            const max = numVal === 0 ? 100 : Math.round(numVal * 2.5);

            parsedAttrs.push({
              key: k,
              original: numVal,
              current: numVal,
              min,
              max,
            });
          }
        });
      });

      setAttributes(parsedAttrs);
    } catch (err) {
      console.error('Failed to load counterfactual attributes:', err);
    }
  }, [caseId, supabase]);

  useEffect(() => {
    loadCaseIntelligence();
  }, [loadCaseIntelligence]);

  const handleSliderChange = (key: string, val: number) => {
    setAttributes(prev =>
      prev.map(a => (a.key === key ? { ...a, current: val } : a))
    );
  };

  const handleSimulate = async () => {
    setLoading(true);
    setSimulatedScore(null);
    setSimulatedRec('');
    setSimulatedReasoning('');

    const adjustedValues: Record<string, number> = {};
    attributes.forEach(a => {
      if (a.current !== a.original) {
        adjustedValues[a.key] = a.current;
      }
    });

    try {
      const res = await fetch(`/api/cases/${caseId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustedValues, lang: language }),
      });

      if (!res.ok) throw new Error('Simulation failed.');

      const data = await res.json();
      setSimulatedScore(data.simulated_score);
      setSimulatedRec(data.simulated_recommendation);
      setSimulatedReasoning(data.simulated_reasoning);
      toast.success('Simulation re-evaluation completed!');
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Counterfactual evaluation failed.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };



  const getDeltaIndicator = () => {
    if (originalScore === null || simulatedScore === null) return null;
    const delta = simulatedScore - originalScore;
    if (delta > 0) return <span className="text-emerald-400 font-bold ml-1.5 font-mono text-sm">(+{delta})</span>;
    if (delta < 0) return <span className="text-rose-400 font-bold ml-1.5 font-mono text-sm">({delta})</span>;
    return <span className="text-text-muted ml-1.5 font-mono text-sm">(±0)</span>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Sliders Controller */}
      <div className="lg:col-span-1 p-5 rounded-xl border border-border-subtle bg-bg-surface backdrop-blur-sm h-fit space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <Icon.Branch className="text-accent" size={15} />
            Adjust Scenario Sliders
          </h3>
          <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
            Modify any extracted numerical metrics to trigger real-time AI re-evaluation of the case risk structure.
          </p>
        </div>

        {attributes.length === 0 ? (
          <div className="text-center py-10 font-mono text-[11px] text-text-muted italic border border-dashed border-border-subtle rounded-lg p-4">
            No completed document extractions with numerical attributes found for this case.
          </div>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto thin-scroll pr-1">
            {attributes.map(attr => (
              <div key={attr.key} className="space-y-1.5 p-3 rounded-lg bg-bg-surface-2/40 border border-border-subtle/50">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-text-muted font-medium truncate max-w-[130px]" title={attr.key}>
                    {attr.key}
                  </span>
                  <span className="text-text-primary font-bold">
                    {attr.current.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={attr.min}
                  max={attr.max}
                  value={attr.current}
                  onChange={e => handleSliderChange(attr.key, parseFloat(e.target.value))}
                  className="w-full h-1 bg-bg-surface rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[9px] font-mono text-text-muted/60">
                  <span>Min: {attr.min}</span>
                  <span>Original: {attr.original.toLocaleString()}</span>
                  <span>Max: {attr.max.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {attributes.length > 0 && (
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full btn btn-primary py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(20,110,245,0.15)]"
          >
            {loading ? (
              <>
                <Icon.Loop className="animate-spin" size={13} />
                Re-evaluating Risk Model...
              </>
            ) : (
              <>
                <Icon.Bolt size={13} className="text-amber-400" />
                Simulate Scenario
              </>
            )}
          </button>
        )}
      </div>

      {/* Right Comparison Screen */}
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Panel */}
          <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/50 backdrop-blur-sm space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted font-medium">Original Baseline</span>
            
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-text-primary font-mono tracking-tighter">
                {originalScore !== null ? originalScore : '—'}
              </span>
              <span className="text-xs text-text-muted font-medium">/ 100</span>
            </div>

            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-text-muted">Strategic Outcome</span>
              <p className="text-xs text-text-primary font-medium mt-1 leading-relaxed bg-bg-surface-2/40 px-3 py-2 rounded border border-border-subtle/50 min-h-[48px]">
                {originalRec || 'Run analysis first to compile original baseline.'}
              </p>
            </div>
          </div>

          {/* Simulated Panel */}
          <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface-2/80 backdrop-blur-sm space-y-4 relative overflow-hidden">
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold">Simulated Outcome</span>
            
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-text-primary font-mono tracking-tighter">
                {simulatedScore !== null ? simulatedScore : '—'}
              </span>
              <span className="text-xs text-text-muted font-medium">/ 100</span>
              {getDeltaIndicator()}
            </div>

            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest text-accent">Adjusted Action</span>
              <p className="text-xs text-text-primary font-medium mt-1 leading-relaxed bg-bg-surface px-3 py-2 rounded border border-border-subtle min-h-[48px]">
                {simulatedRec || 'Adjust values and click simulate to trigger AI re-evaluation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Explain Variance Reasoning */}
        {simulatedReasoning && (
          <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface-2/95 backdrop-blur-md space-y-3 animate-[fadeIn_0.35s_ease-out]">
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Icon.Logo size={14} className="text-accent animate-pulse" />
              Scenario Analysis & Impact Report
            </h4>
            <div className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap select-text selection:bg-accent/15 bg-black/20 p-4 rounded-lg border border-border-subtle/50 font-mono">
              {simulatedReasoning}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
