'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';

interface Stats {
  users: number;
  cases: number;
  documents: number;
  extractions: number;
  analyses: number;
  totalCost: number;
}

interface Log {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
  userName: string;
  userRole: string;
}

interface ProviderCost {
  provider: string;
  cost: number;
}

interface ActivityData {
  date: string;
  cases: number;
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [aiUsage, setAiUsage] = useState<ProviderCost[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setStatusBreakdown(data.statusBreakdown);
          setRecentLogs(data.recentLogs);
          setAiUsage(data.aiUsage);
          setActivityData(data.activityData);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 rounded-xl border border-border-subtle bg-bg-surface/50 backdrop-blur-sm h-[120px] animate-pulse space-y-4">
            <div className="h-2.5 w-1/3 bg-border-subtle rounded" />
            <div className="h-6 w-2/3 bg-border-subtle rounded" />
          </div>
        ))}
      </div>
    );
  }

  // Draw custom SVG sparklines or charts!
  const maxCases = Math.max(...activityData.map(d => d.cases), 1);
  const totalCasesSum = stats?.cases || 0;

  return (
    <div className="space-y-6">
      {/* Real-time statistics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">Global Users</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
              {stats?.users}
            </div>
            <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5 mt-1">
              Active system accounts
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/15 text-accent">
            <Icon.Shield size={18} />
          </div>
        </div>

        {/* Platform Cases */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">Cases Ledger</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
              {stats?.cases}
            </div>
            <span className="text-[9px] text-accent font-mono flex items-center gap-0.5 mt-1">
              Platform-wide cases
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/15 text-blue-400">
            <Icon.Doc size={18} />
          </div>
        </div>

        {/* Total Documents */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">Documents Ingested</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-text-primary">
              {stats?.documents}
            </div>
            <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5 mt-1">
              {stats?.extractions} completed audits
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/15 text-amber-400">
            <Icon.Code size={18} />
          </div>
        </div>

        {/* Aggregate AI Costs */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">Accumulated AI Costs</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-accent">
              ${stats?.totalCost.toFixed(4)}
            </div>
            <span className="text-[9px] text-text-muted font-mono flex items-center gap-0.5 mt-1">
              Billed LLM API compute
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/15 text-purple-400">
            <Icon.Sparkle size={18} />
          </div>
        </div>
      </div>

      {/* Interactive premium SVG analytics reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases creation over time (glowing SVG line chart) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border-subtle bg-bg-surface/85 backdrop-blur-md space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-semibold text-text-primary tracking-wide flex items-center gap-1.5">
                <Icon.Grid size={13} className="text-accent" />
                Case Intake Activity
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">30-day cumulative platform ingest trends</p>
            </div>
            <div className="text-[10px] font-mono text-text-muted">Total: {totalCasesSum} cases</div>
          </div>

          {/* Premium Custom SVG Chart */}
          <div className="w-full h-[220px] relative">
            {activityData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-text-muted font-mono border border-dashed border-border-subtle rounded-lg">
                No case activity log data available.
              </div>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#146ef5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#146ef5" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#146ef5" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                {[0, 25, 50, 75, 100].map(p => (
                  <line
                    key={p}
                    x1="0"
                    y1={20 + (p * 1.5)}
                    x2="600"
                    y2={20 + (p * 1.5)}
                    stroke="var(--border-subtle)"
                    strokeWidth="0.5"
                    strokeDasharray="4 6"
                    opacity="0.5"
                  />
                ))}

                {/* Draw Area with Glow */}
                <path
                  d={`
                    M 0 180
                    ${activityData.map((d, i) => {
                      const x = (i / (activityData.length - 1)) * 600;
                      const y = 180 - (d.cases / maxCases) * 150;
                      return `L ${x} ${y}`;
                    }).join(' ')}
                    L 600 180 Z
                  `}
                  fill="url(#chartGlow)"
                />

                {/* Draw Glowing Path Line */}
                <path
                  d={activityData.map((d, i) => {
                    const x = (i / (activityData.length - 1)) * 600;
                    const y = 180 - (d.cases / maxCases) * 150;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="url(#strokeGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Draw points */}
                {activityData.map((d, i) => {
                  const x = (i / (activityData.length - 1)) * 600;
                  const y = 180 - (d.cases / maxCases) * 150;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="3"
                      className="fill-accent stroke-bg-surface hover:r-5 cursor-pointer transition-all duration-150"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            )}
          </div>
          
          {/* Dates bottom-axis representation */}
          <div className="flex justify-between text-[9px] font-mono text-text-muted px-1.5">
            <span>{activityData[0]?.date || 'Oct 23'}</span>
            <span>{activityData[Math.round(activityData.length / 2)]?.date || 'Nov 07'}</span>
            <span>{activityData[activityData.length - 1]?.date || 'Nov 22'}</span>
          </div>
        </div>

        {/* Case Status Split ( gapped progress segments ) */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/85 backdrop-blur-md space-y-5">
          <div>
            <h3 className="text-xs font-semibold text-text-primary tracking-wide flex items-center gap-1.5">
              <Icon.Doc size={13} className="text-blue-400" />
              Pipeline Breakdown
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">Status split across platforms</p>
          </div>

          <div className="space-y-4">
            {statusBreakdown.length === 0 ? (
              <div className="text-center py-10 font-mono text-[10px] text-text-muted italic border border-dashed border-border-subtle rounded-lg">
                No pipeline statistics compiled yet.
              </div>
            ) : (
              statusBreakdown.map(stat => {
                const total = statusBreakdown.reduce((a, b) => a + b.value, 0) || 1;
                const percentage = Math.round((stat.value / total) * 100);
                
                // Color badges based on status name
                const statusColor = 
                  stat.name === 'COMPLETED' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
                  stat.name === 'FAILED' ? 'bg-rose-400/10 text-rose-400 border-rose-400/20' :
                  stat.name === 'ANALYZING' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                  stat.name === 'EXTRACTING' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' :
                  'bg-amber-400/10 text-amber-400 border-amber-400/20';

                const progressColor =
                  stat.name === 'COMPLETED' ? 'bg-emerald-400' :
                  stat.name === 'FAILED' ? 'bg-rose-400' :
                  stat.name === 'ANALYZING' ? 'bg-purple-400' :
                  stat.name === 'EXTRACTING' ? 'bg-blue-400' :
                  'bg-amber-400';

                return (
                  <div key={stat.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${statusColor}`}>
                        {stat.name}
                      </span>
                      <span className="text-text-primary font-bold">{stat.value} cases ({percentage}%)</span>
                    </div>
                    <div className="h-1 bg-border-subtle rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* AI cost ledger & Recent logs table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Audit Event Feed */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border-subtle bg-bg-surface/85 backdrop-blur-md space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-semibold text-text-primary tracking-wide flex items-center gap-1.5">
                <Icon.Hash size={13} className="text-purple-400" />
                Live Security Audit Trail
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Real-time recording of operator event executions</p>
            </div>
            <span className="px-2 py-0.5 text-[8px] font-mono bg-bg-surface border border-border-subtle rounded-full uppercase text-text-muted animate-pulse">
              Live Feed
            </span>
          </div>

          <div className="border border-border-subtle/50 rounded-lg overflow-hidden bg-black/10 select-none">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead>
                <tr className="bg-bg-surface border-b border-border-subtle/50 text-[9px] uppercase tracking-wider text-text-muted">
                  <th className="p-3">Operator</th>
                  <th className="p-3">Action performed</th>
                  <th className="p-3">Logged Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/30">
                {recentLogs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-text-muted italic">
                      No security audit events recorded.
                    </td>
                  </tr>
                ) : (
                  recentLogs.map(log => (
                    <tr key={log.id} className="hover:bg-bg-surface-2/30 transition-colors duration-150">
                      <td className="p-3 flex items-center gap-2 max-w-[150px] truncate" title={log.userName}>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/60" />
                        <span className="text-text-primary font-semibold">{log.userName}</span>
                        <span className="text-[9px] text-text-muted opacity-65">({log.userRole})</span>
                      </td>
                      <td className="p-3">
                        <span className="px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle text-[10px] text-text-muted font-bold" title={JSON.stringify(log.metadata)}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-text-muted">
                        {new Date(log.created_at).toLocaleTimeString()} · {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Provider Cost share card */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/85 backdrop-blur-md space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-text-primary tracking-wide flex items-center gap-1.5">
                <Icon.Sparkle size={13} className="text-purple-400" />
                AI Provider Distribution
              </h3>
              <p className="text-[10px] text-text-muted mt-0.5">Billed resources split by model network</p>
            </div>

            <div className="space-y-4">
              {aiUsage.length === 0 ? (
                <div className="text-center py-10 font-mono text-[10px] text-text-muted italic border border-dashed border-border-subtle rounded-lg">
                  No billing cost records compiled.
                </div>
              ) : (
                aiUsage.map(provider => {
                  const total = aiUsage.reduce((a, b) => a + b.cost, 0) || 1;
                  const pct = Math.round((provider.cost / total) * 100);

                  const brandColor =
                    provider.provider === 'ANTHROPIC' ? 'text-orange-400' :
                    provider.provider === 'OPENAI' ? 'text-emerald-400' :
                    'text-accent';

                  const progressColor =
                    provider.provider === 'ANTHROPIC' ? 'bg-orange-400' :
                    provider.provider === 'OPENAI' ? 'bg-emerald-400' :
                    'bg-accent';

                  return (
                    <div key={provider.provider} className="p-3 rounded-lg border border-border-subtle bg-bg-surface-2/30 space-y-1.5">
                      <div className="flex justify-between items-baseline text-[10px] font-mono">
                        <span className={`font-bold ${brandColor}`}>{provider.provider}</span>
                        <span className="text-text-primary font-bold">
                          ${provider.cost.toFixed(4)} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                        <div className={`h-full ${progressColor} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-bg-surface border border-border-subtle text-[10px] text-text-muted font-mono leading-relaxed select-none">
            💡 <strong>Cost Optimization Tip</strong>: Free Gemini models are active by default to respect platform compute guidelines on Hackathon Day.
          </div>
        </div>
      </div>
    </div>
  );
}
