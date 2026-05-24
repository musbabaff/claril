'use client';

import { useState, useEffect } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';

function generateDeterministicBars(n: number, base = 30, jitter = 50, period = 0.4) {
  // Use a deterministic pseudo-random formula to avoid Next.js hydration mismatches
  return Array.from({ length: n }, (_, i) => {
    const pseudoRand = ((i * 214013 + 2531011) >> 16) & 0x7fff;
    const jitterVal = (pseudoRand % jitter);
    return Math.max(8, base + Math.sin(i * period) * 20 + jitterVal);
  });
}

interface DonutItem {
  label: string;
  value: number;
  color: string;
}

function Donut({ data }: { data: DonutItem[] }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  let off = 0;
  const radius = 50;
  const circ = 2 * Math.PI * radius;
  
  return (
    <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
      <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--hairline)" strokeWidth="14"/>
      {data.map((d) => {
        const len = (d.value / total) * circ;
        const dash = `${len} ${circ - len}`;
        const el = (
          <circle 
            key={d.label} 
            cx="70" 
            cy="70" 
            r={radius}
            fill="none" 
            stroke={d.color} 
            strokeWidth="14"
            strokeDasharray={dash} 
            strokeDashoffset={-off}
            transform="rotate(-90 70 70)"
          />
        );
        off += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" fontFamily="var(--f-display)" fontSize="22" fontWeight="500" fill="var(--ink)">
        ${(1284 / 100).toFixed(0)}k
      </text>
      <text x="70" y="84" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="9" fill="var(--muted)" letterSpacing="0.06em">
        SPEND · 30D
      </text>
    </svg>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<"volume" | "latency" | "cost" | "errors">("volume");
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const tabs = [
    { id: "volume" as const,   label: "Volume" },
    { id: "latency" as const,  label: "Latency" },
    { id: "cost" as const,     label: "Cost" },
    { id: "errors" as const,   label: "Errors" },
  ];

  // Adjust parameters slightly based on range to make it look responsive
  const pointCount = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 60 : 90;

  const rawData = {
    volume:  generateDeterministicBars(pointCount, 80, 100, 0.3),
    latency: generateDeterministicBars(pointCount, 28, 8, 0.6),
    cost:    generateDeterministicBars(pointCount, 30, 40, 0.45),
    errors:  generateDeterministicBars(pointCount, 4, 8, 0.7),
  };

  const series = rawData[tab];
  const max = Math.max(...series) || 1;
  const total = Math.round(series.reduce((a, b) => a + b, 0));

  if (!mounted) {
    return (
      <>
        <DashboardTopbar
          crumbs={[{ label: "Acme Industrial · prod" }, { label: "Reports" }]}
          title="Reports"
          actions={
            <>
              <button className="btn btn-ghost">Export CSV</button>
              <button className="btn btn-ghost">Schedule weekly report</button>
              <button className="btn btn-primary">+ Custom dashboard</button>
            </>
          }
        />
        <div className="dash-body animate-[fadeIn_0.3s_ease-out] opacity-0">
          <div className="stat-grid" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Reports" }]}
        title="Reports"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => alert("CSV Export initialized.")}>
              Export CSV
            </button>
            <button className="btn btn-ghost" onClick={() => alert("Weekly reports schedule configuration.")}>
              Schedule weekly report
            </button>
            <button className="btn btn-primary" onClick={() => alert("Custom dashboard wizard.")}>
              + Custom dashboard
            </button>
          </>
        }
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
        <div className="stat-grid">
          {[
            { k: "Docs processed · 30d",   v: "62,184",   sub: "↑ 18.2%", label: "vs last month" },
            { k: "Avg cost / doc",         v: "$0.0241",  sub: "↓ $0.003", label: "reduction" },
            { k: "Pass rate · first try",  v: "94.6%",    sub: "↑ 1.2pp", label: "vs Q1 target" },
            { k: "Self-correct success",   v: "82.3%",    sub: "82.3%", label: "of all retries" },
          ].map((s) => (
            <div className="stat-card" key={s.k}>
              <span className="stat-k">{s.k}</span>
              <span className="stat-v">{s.v}</span>
              <span className="stat-sub">
                <span className={`delta ${s.sub.startsWith('↓') ? 'down' : 'up'}`}>{s.sub}</span>
                <span>{s.label}</span>
              </span>
            </div>
          ))}
        </div>

        <section className="dash-sec" style={{ marginTop: 24 }}>
          <header className="dash-sec-head">
            <div className="report-tabs">
              {tabs.map((t) => (
                <button 
                  key={t.id} 
                  className={`report-tab ${tab === t.id ? "is-on" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="dash-sec-actions">
              {(["7d", "30d", "90d", "1y"] as const).map((r) => (
                <button 
                  key={r} 
                  className={`filter-chip ${range === r ? "is-on" : ""}`} 
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </header>

          <div className="report-chart">
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 14 }}>
              <span className="f-display" style={{ fontSize: 38, fontWeight: 300, letterSpacing: "-0.025em" }}>
                {tab === "volume"  && total.toLocaleString()}
                {tab === "latency" && (series[series.length - 1] / 10).toFixed(2) + "s"}
                {tab === "cost"    && "$" + total.toFixed(2)}
                {tab === "errors"  && total + " events"}
              </span>
              <span className="f-mono" style={{ fontSize: 11.5, color: "var(--ok)" }}>
                ↑ 12.4% vs prior {range}
              </span>
            </div>
            <svg viewBox="0 0 600 200" style={{ width: "100%", height: 200 }}>
              <defs>
                <linearGradient id="r-grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((g) => (
                <line key={g} x1="0" x2="600" y1={40 + g * 40} y2={40 + g * 40} stroke="var(--hairline)" strokeWidth="0.5"/>
              ))}
              {(() => {
                const pts = series.map((v, i) => {
                  const x = (i / (series.length - 1)) * 600;
                  const y = 190 - (v / max) * 160;
                  return { x, y };
                });
                
                let d = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i];
                  const p1 = pts[i + 1];
                  const cp1x = p0.x + (p1.x - p0.x) / 3;
                  const cp1y = p0.y;
                  const cp2x = p0.x + (2 * (p1.x - p0.x)) / 3;
                  const cp2y = p1.y;
                  d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                }
                const area = `${d} L 600 200 L 0 200 Z`;

                return (
                  <>
                    <path d={area} fill="url(#r-grad)"/>
                    <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/>
                    {pts.map((pt, i) => {
                      const isActive = i === series.length - 1;
                      return (
                        <g key={i}>
                          {isActive && (
                            <circle 
                              cx={pt.x} 
                              cy={pt.y} 
                              r="8" 
                              fill="var(--accent)" 
                              opacity="0.3"
                              className="animate-ping"
                              style={{ animationDuration: '2s' }}
                            />
                          )}
                          <circle 
                            cx={pt.x} 
                            cy={pt.y} 
                            r={isActive ? "4" : "1.5"} 
                            fill="var(--accent)"
                            stroke={isActive ? "var(--surface)" : "none"}
                            strokeWidth={isActive ? 1.5 : 0}
                          />
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="report-legend">
            <span><span className="sw" style={{ background: "var(--accent)" }}/>This period</span>
            <span><span className="sw" style={{ background: "var(--hairline-strong)" }}/>Prior period</span>
          </div>
        </section>

        <div className="dash-two" style={{ marginTop: 24 }}>
          <div className="donut-card">
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Cost by schema</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>30-day attribution</p>
            <div className="donut-row">
              <Donut data={[
                { label: "Invoice",       value: 42, color: "var(--accent)" },
                { label: "BankStatement", value: 28, color: "oklch(0.6 0.13 250)" },
                { label: "KYC.W9",        value: 18, color: "oklch(0.65 0.13 155)" },
                { label: "Receipt",       value: 8,  color: "oklch(0.7 0.13 25)" },
                { label: "Other",         value: 4,  color: "var(--muted-2)" },
              ]}/>
              <ul className="donut-legend">
                {[
                  ["Invoice",       42, "var(--accent)"] as const,
                  ["BankStatement", 28, "oklch(0.6 0.13 250)"] as const,
                  ["KYC.W9",        18, "oklch(0.65 0.13 155)"] as const,
                  ["Receipt",        8, "oklch(0.7 0.13 25)"] as const,
                  ["Other",          4, "var(--muted-2)"] as const,
                ].map(([l, v, c]) => (
                  <li key={l}>
                    <span className="sw" style={{ background: c }}/>
                    <b>{l}</b>
                    <span className="pct">{v}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="donut-card">
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Latency distribution</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>
              p50 · 1.83s &nbsp;&nbsp; p99 · 2.41s
            </p>
            <svg viewBox="0 0 400 160" style={{ width: "100%", height: 160 }}>
              {(() => {
                const buckets = [4, 12, 28, 60, 92, 88, 62, 38, 22, 14, 8, 5, 3, 2, 1];
                const maxVal = Math.max(...buckets) || 1;
                return buckets.map((b, i) => {
                  const x = 10 + i * 26;
                  const h = (b / maxVal) * 120;
                  const p50 = i === 5;
                  const p99 = i === 9;
                  return (
                    <g key={i}>
                      <rect 
                        x={x} 
                        y={140 - h} 
                        width="20" 
                        height={h} 
                        rx="2"
                        fill={p99 ? "var(--warn)" : (p50 ? "var(--accent)" : "var(--hairline-strong)")} 
                        opacity={p50 || p99 ? 1 : 0.7}
                      />
                      <text 
                        x={x + 10} 
                        y="155" 
                        textAnchor="middle" 
                        fontFamily="var(--f-mono)" 
                        fontSize="9" 
                        fill="var(--muted-2)"
                      >
                        {(i * 0.4).toFixed(1)}s
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
