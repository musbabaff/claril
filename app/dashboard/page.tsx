'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';

// Sparkline component copied from new-design/dash.jsx
function Sparkline({ data, color = 'var(--accent)', id }: { data: number[]; color?: string; id: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max - min) || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  const area = `0,100 ${pts} 100,100`;
  const gradId = `sp-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="stat-spark">
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} opacity="0.08"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

const KPIS = [
  { k: 'Extractions · Oct',  v: 6210, prefix: '', suffix: '',    prev: ['+410', 'vs Sep'], ok: true, data: [12, 15, 14, 18, 17, 19, 22, 21, 24, 26, 25, 28, 30] },
  { k: 'Success rate',        v: 99.1, prefix: '', suffix: '%',   prev: ['p99', '< 2.4s'],   ok: true, data: [98.5, 98.6, 98.8, 98.9, 99.0, 99.1, 99.1, 99.0, 99.1, 99.1, 99.1, 99.1, 99.1] },
  { k: 'Avg. cost / doc',     v: 0.031, prefix: '$', suffix: '',   prev: ['$0.029', 'Sep'],   ok: true, data: [0.045, 0.042, 0.040, 0.038, 0.036, 0.035, 0.034, 0.033, 0.032, 0.031, 0.031, 0.031] },
  { k: 'Pending review',      v: 3, prefix: '', suffix: '',       prev: ['1', 'schema warn'], ok: false, data: [5, 4, 4, 3, 3, 2, 2, 3, 3, 3, 3, 3] },
];

function AnimatedNum({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    let start = 0;
    const dur = 1000;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      start = target * ease;
      setVal(start);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);
  const fmt = target % 1 !== 0 ? val.toFixed(3) : Math.round(val).toLocaleString('en-US');
  return <span>{prefix}{fmt}{suffix}</span>;
}

const RECENT = [
  { id: 'case-001', name: 'Acme_Invoice_Q3.pdf',    type: 'Invoice',       status: 'done',       cost: '$0.024', ago: '2m ago'  },
  { id: 'case-002', name: 'Chase_Statement_Sep.pdf', type: 'BankStatement', status: 'done',       cost: '$0.068', ago: '14m ago' },
  { id: 'case-003', name: 'Vendor_PO_4471.pdf',      type: 'PurchaseOrder', status: 'running',    cost: '$0.011', ago: '20m ago' },
  { id: 'case-004', name: 'Receipt_AWS_Oct.pdf',     type: 'Receipt',       status: 'review',     cost: '$0.009', ago: '31m ago' },
  { id: 'case-005', name: 'Insurance_Cert_Q4.pdf',   type: 'Certificate',   status: 'done',       cost: '$0.033', ago: '1h ago'  },
];

function StatusBadge({ s }: { s: string }) {
  if (s === 'done')    return <span className="dash-pill is-ok"><Icon.Check size={10} /> done</span>;
  if (s === 'running') return <span className="dash-pill is-on"><span className="dot-pulse" /> running</span>;
  if (s === 'review')  return <span className="dash-pill is-warn"><Icon.Bolt size={10} /> review</span>;
  return <span className="dash-pill">{s}</span>;
}

const ACTIVITY = [
  { state: 'ok', who: 'parser', what: 'settled ', obj: 'Chase_Statement_Sep.pdf', t: '14m', meta: 'case_chase_sep · 1,240ms' },
  { state: 'warn', who: 'verify', what: 'retried ', obj: 'Vendor_PO_4471.pdf', t: '22m', meta: 'retry loop triggered · schema mismatch' },
  { state: 'err', who: 'verify', what: 'flagged ', obj: 'Receipt_AWS_Oct.pdf', t: '31m', meta: 'total field ambiguous' },
  { state: 'ok', who: 'parser', what: 'settled ', obj: 'Acme_Invoice_Q3.pdf', t: '2h', meta: 'case_acme_q3 · 1,480ms' },
  { state: 'ok', who: 'parser', what: 'settled ', obj: 'Insurance_Cert_Q4.pdf', t: '1h', meta: 'case_insurance_q4 · 940ms' },
];

const USAGE_WEEKS = [72, 88, 65, 95, 102, 81, 78, 91, 110, 99, 85, 62, 88, 92];

export default function DashboardPage() {
  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: 'Workspace' }, { label: 'Overview' }]}
        title="Overview"
        actions={
          <Link className="btn btn-primary" href="/dashboard/cases/new">
            <Icon.Upload size={12} /> New extraction
          </Link>
        }
      />

      <div className="dash-body">
        {/* KPI row */}
        <div className="stat-grid">
          {KPIS.map(k => (
            <div key={k.k} className="stat-card">
              <span className="stat-k">{k.k}</span>
              <span className="stat-v ticker">
                <AnimatedNum target={k.v} prefix={k.prefix} suffix={k.suffix} />
              </span>
              <span className="stat-sub">
                <span className={"delta " + (k.ok ? 'up' : 'down')}>{k.prev[0]}</span>
                <span>{k.prev[1]}</span>
              </span>
              <Sparkline data={k.data} color={k.ok ? 'var(--accent)' : 'var(--warn)'} id={k.k} />
            </div>
          ))}
        </div>

        {/* First Row: Recent Cases + Agent Activity */}
        <div className="dash-two">
          {/* Recent cases */}
          <section className="dash-sec">
            <header className="dash-sec-head">
              <h3 className="dash-sec-title">Recent cases</h3>
              <div className="dash-sec-actions">
                <Link className="btn btn-link" href="/dashboard/cases">
                  View all <Icon.Arrow size={12} />
                </Link>
              </div>
            </header>
            <div style={{ overflowX: 'auto' }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Schema</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT.map(r => (
                    <tr key={r.id}>
                      <td className="f-mono" style={{ fontSize: 12 }}>{r.name}</td>
                      <td className="f-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{r.type}</td>
                      <td><StatusBadge s={r.status} /></td>
                      <td className="f-mono ticker" style={{ fontSize: 12 }}>{r.cost}</td>
                      <td>
                        <Link href={`/dashboard/cases/${r.id}`} className="btn-link" style={{ fontSize: 12 }}>
                          inspect →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Activity feed */}
          <section className="dash-sec">
            <header className="dash-sec-head">
              <h3 className="dash-sec-title">Agent activity</h3>
              <div className="dash-sec-actions">
                <span className="dash-pill is-ok">
                  <span className="dot-live" /> live
                </span>
              </div>
            </header>
            <ul className="activity-list thin-scroll" style={{ maxHeight: 310, overflowY: 'auto' }}>
              {ACTIVITY.map((a, i) => (
                <li className="activity-row" key={i}>
                  <span className={"dot " + a.state} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                    <span>
                      <span className="f-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{a.who}</span>{' '}
                      <span style={{ color: 'var(--muted)' }}>{a.what}</span>
                      <b>{a.obj}</b>
                    </span>
                    <span className="f-mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>{a.meta}</span>
                  </div>
                  <time>{a.t}</time>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Second Row: Extraction Volume + Audit Ledger */}
        <div className="dash-two">
          {/* Extraction volume chart */}
          <section className="dash-sec">
            <header className="dash-sec-head">
              <h3 className="dash-sec-title">Extraction volume · last 14 days</h3>
              <div className="dash-sec-actions">
                <span className="dash-pill">org_4f7a · prod</span>
              </div>
            </header>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <svg viewBox="0 0 600 120" style={{ width: '100%', height: 120 }}>
                {USAGE_WEEKS.map((v, i) => {
                  const max = Math.max(...USAGE_WEEKS);
                  const h = Math.max(8, (v / max) * 100);
                  const x = i * 40 + 20;
                  const y = 120 - h;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width="24"
                      height={h}
                      rx="3"
                      fill={i === USAGE_WEEKS.length - 1 ? 'var(--accent)' : 'var(--hairline-strong)'}
                      opacity={i > 10 ? 0.9 : 0.4}
                    />
                  );
                })}
              </svg>
              <div className="f-mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted-2)', marginTop: 12 }}>
                <span>14 days ago</span>
                <span>7 days ago</span>
                <span>today</span>
              </div>
            </div>
          </section>

          {/* Ledger spot-check */}
          <section className="dash-sec">
            <header className="dash-sec-head">
              <h3 className="dash-sec-title">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon.Hash size={13} /> Audit ledger · chain root
                </span>
              </h3>
              <div className="dash-sec-actions">
                <span className="dash-pill is-ok">
                  <Icon.Check size={10} /> verified
                </span>
              </div>
            </header>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <code className="f-mono" style={{ fontSize: 11, wordBreak: 'break-all', display: 'block', padding: '10px 14px', background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--hairline)', color: 'var(--ink)' }}>
                sha256:a7c1f04e…88fa92 · block 6,210 · Oct 21 2026 18:32 UTC
              </code>
              <p className="dash-ledger-copy" style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                The chain root above covers all 6,210 extractions in this billing period.
                Run <code className="f-mono" style={{ fontSize: 12, background: 'var(--bg-alt)', padding: '2px 5px', borderRadius: 4, color: 'var(--ink)' }}>claril ledger verify --from block-1</code> to confirm integrity offline.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
