'use client';

import { useState, useEffect } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';

const AGENT_KINDS = [
  { id: "parser", name: "Parser",       desc: "OCR + layout segmentation" },
  { id: "verify", name: "Verify",       desc: "Schema + cross-field validate" },
  { id: "synth",  name: "Synthesizer",  desc: "Typed JSON emission" },
];

interface Worker {
  id: number;
  kind: string;
  name: string;
  state: "running" | "error" | "idle";
  util: number;
  cost: number;
  queue: string | number;
}

interface LogItem {
  id: number;
  time: string;
  worker: string;
  kind: string;
  lvl: string;
  msg: string;
  dur: string;
}

export default function AgentsPage() {
  const [mounted, setMounted] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [paused, setPaused] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Initialize workers and logs once mounted on the client
    setWorkers(
      Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        kind: AGENT_KINDS[i % 3].id,
        name: AGENT_KINDS[i % 3].name,
        state: i < 9 ? "running" : (i === 9 ? "error" : "idle"),
        util:  i < 9 ? 0.4 + Math.random() * 0.55 : 0,
        cost:  +(Math.random() * 0.08 + 0.01).toFixed(4),
        queue: i < 9 ? (Math.random() * 2.2 + 0.4).toFixed(1) : 0,
      }))
    );
    setLogs(
      Array.from({ length: 14 }).map((_, i) => makeLog(i, Date.now() - i * 2000))
    );
  }, []);

  function makeLog(i: number, ts: number): LogItem {
    const lvls = ["info","ok","info","warn","ok","info","err","ok","info"];
    const lvl = lvls[i % lvls.length];
    const w = (i % 12) + 1;
    const kinds = ["parser","verify","synth"];
    const k = kinds[i % 3];
    const messages = [
      "extracted Invoice_AC-4471.pdf",
      "validated against Invoice v2.3",
      "emitted strict JSON · 612 tokens out",
      "schema mismatch · total drift 0.2%",
      "retried with delta · success",
      "webhook delivered · 218ms",
      "504 from acme.dev/x · backing off 2s",
      "ledger append · sha256:7b03ee…",
      "received chunk · 284 KB",
    ];
    return {
      id: ts + Math.random(),
      time: new Date(ts).toLocaleTimeString("en-GB", { hour12: false }),
      worker: `w_${String(w).padStart(2,"0")}`,
      kind: k,
      lvl,
      msg: messages[i % messages.length],
      dur: Math.round(Math.random() * 1900 + 80) + "ms",
    };
  }

  useEffect(() => {
    if (!mounted || paused) return;
    const t = setInterval(() => {
      setLogs((prev) => [makeLog(prev.length, Date.now()), ...prev.slice(0, 49)]);
      setWorkers((prev) => 
        prev.map((w) => 
          w.state === "running"
            ? { 
                ...w, 
                util: Math.max(0.2, Math.min(0.95, w.util + (Math.random() - 0.5) * 0.25)),
                queue: (Math.random() * 2.2 + 0.3).toFixed(1) 
              }
            : w
        )
      );
    }, 1400);
    return () => clearInterval(t);
  }, [mounted, paused]);

  const filtered = logFilter === "all" ? logs : logs.filter((l) => l.lvl === logFilter);

  const summary = [
    { k: "Active workers",   v: `${workers.filter(w => w.state === "running").length} / ${workers.length}`, sub: "67% utilization" },
    { k: "Throughput · /min",v: "184",     sub: "↑ 12 vs last hour" },
    { k: "p99 latency",      v: "2.41s",   sub: "↓ 0.18s vs last hour" },
    { k: "Error rate",       v: "0.42%",   sub: "1 worker degraded" },
  ];

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Agents" }]}
        title="Agents"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setPaused((p) => !p)}>
              {paused ? "▶ Resume stream" : "❚❚ Pause stream"}
            </button>
            <button className="btn btn-ghost" onClick={() => alert("Scaling worker pools dynamically. Ingestion workloads will dynamically rebalance.")}>
              <Icon.Branch size={12}/> Scale up
            </button>
            <button className="btn btn-primary" onClick={() => alert("Deploying latest agent revisions to production pods.")}>
              Deploy agent rev
            </button>
          </>
        }
      />

      {mounted ? (
        <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
          <div className="stat-grid">
            {summary.map((s) => (
              <div className="stat-card" key={s.k}>
                <span className="stat-k">{s.k}</span>
                <span className="stat-v">{s.v}</span>
                <span className="stat-sub"><span className="delta up">{s.sub}</span></span>
              </div>
            ))}
          </div>

          <div className="agents-grid" style={{ marginTop: 20 }}>
            {workers.map((w) => (
              <div key={w.id} className={"worker-card " + (w.state === "idle" ? "is-idle " : "") + (w.state === "error" ? "is-err" : "")}>
                <div className="worker-head">
                  <span className="worker-id">{`worker_${String(w.id).padStart(2,"0")}`}</span>
                  {w.state === "running" && <span className="dot-pulse"/>}
                  {w.state === "error"   && <span className="dash-pill is-err">degraded</span>}
                  {w.state === "idle"    && <span className="dash-pill">idle</span>}
                </div>
                <span className="worker-kind">{w.name}</span>
                <div className="worker-meter">
                  <div className="worker-meter-row"><span>util</span><b>{Math.round(w.util * 100)}%</b></div>
                  <div className={"worker-bar " + (w.state === "error" ? "err" : (w.util > 0.85 ? "warn" : ""))}>
                    <span style={{ width: `${w.util * 100}%` }}/>
                  </div>
                  <div className="worker-meter-row"><span>queue</span><b>{w.state === "running" ? `${w.queue}s` : "—"}</b></div>
                  <div className="worker-meter-row"><span>cost · 24h</span><b>${w.cost.toFixed(4)}</b></div>
                </div>
              </div>
            ))}
          </div>

          <section className="dash-sec" style={{ marginTop: 22 }}>
            <header className="dash-sec-head">
              <h3 className="dash-sec-title">Live log stream</h3>
              <div className="dash-sec-actions">
                {["all","info","ok","warn","err"].map((l) => (
                  <button key={l} className={"filter-chip " + (logFilter === l ? "is-on" : "")}
                          onClick={() => setLogFilter(l)}>
                    {l}
                  </button>
                ))}
                <span className="dash-pill is-ok"><span className="dot-live"/> {paused ? "paused" : "live"}</span>
              </div>
            </header>
            <ul className="live-log thin-scroll">
              {filtered.slice(0, 28).map((l) => (
                <li key={l.id}>
                  <span className="t">{l.time}</span>
                  <span className="w">{l.worker}</span>
                  <span className={"lvl-" + l.lvl}>{l.lvl.toUpperCase()}</span>
                  <span className="msg"><b>{l.kind}</b> · {l.msg}</span>
                  <span className="dur">{l.dur}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : (
        <div className="dash-body">
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <span className="dot-pulse" style={{ scale: '1.5' }} />
            <span style={{ fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--muted)' }}>Initializing agent streams...</span>
          </div>
        </div>
      )}
    </>
  );
}
