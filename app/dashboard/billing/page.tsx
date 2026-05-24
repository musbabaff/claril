'use client';

import { useState } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';

interface Invoice {
  id: string;
  period: string;
  amount: string;
  status: "paid" | "open";
  issued: string;
}

const INVOICES: Invoice[] = [
  { id: "INV-2026-005", period: "May 2026", amount: "$1,284.21", status: "open",   issued: "2026-05-01" },
  { id: "INV-2026-004", period: "Apr 2026", amount: "$1,402.04", status: "paid",   issued: "2026-04-01" },
  { id: "INV-2026-003", period: "Mar 2026", amount: "$1,189.91", status: "paid",   issued: "2026-03-01" },
  { id: "INV-2026-002", period: "Feb 2026", amount: "$1,028.40", status: "paid",   issued: "2026-02-01" },
  { id: "INV-2026-001", period: "Jan 2026", amount: "$884.12",   status: "paid",   issued: "2026-01-01" },
  { id: "INV-2025-012", period: "Dec 2025", amount: "$762.88",   status: "paid",   issued: "2025-12-01" },
];

export default function BillingPage() {
  const [planModal, setPlanModal] = useState<boolean>(false);

  const limits = [
    { k: "Core extractions",     v: 6210,   max: 10000, unit: "" },
    { k: "Storage",              v: 84,     max: 200,   unit: " GB" },
    { k: "Webhook delivery",     v: 4204,   max: 50000, unit: "" },
    { k: "Audit retention",      v: 124,    max: 2557,  unit: " days · 7yr WORM" },
  ];

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Billing" }]}
        title="Billing"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => alert("Downloading all paid invoices as compressed ZIP archive.")}>
              Download all invoices
            </button>
            <button className="btn btn-primary" onClick={() => setPlanModal(true)}>
              Change plan
            </button>
          </>
        }
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
        <div className="billing-grid">
          <div className="billing-meter">
            <div className="billing-meter-row">
              <div>
                <span className="billing-meter-meta">Current month · May 2026</span>
                <div className="billing-meter-amt" style={{ color: "var(--ink)", fontSize: 24, fontWeight: 600 }}>$1,284.21</div>
              </div>
              <span className="dash-pill is-on">Production Ledger · $120/mo</span>
            </div>
            <div className="billing-bars" style={{ marginTop: 16 }}>
              {limits.map((l) => {
                const pct = Math.min(100, (l.v / l.max) * 100);
                return (
                  <div key={l.k} className={"billing-bar " + (pct > 80 ? "warn" : "")} style={{ marginBottom: 12 }}>
                    <div className="billing-bar-h" style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--ink-2)", marginBottom: 4 }}>
                      <b>{l.k}</b>
                      <span>{l.v.toLocaleString()} / {l.max.toLocaleString()}{l.unit} · {Math.round(pct)}%</span>
                    </div>
                    <div className="billing-bar-track" style={{ height: 6, background: "var(--hairline)", borderRadius: 3, overflow: "hidden" }}>
                      <span style={{ display: "block", height: "100%", width: `${pct}%`, background: pct > 80 ? "var(--warn)" : "var(--accent)", borderRadius: 3 }}/>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed var(--hairline)", marginTop: 14 }}>
              <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>billing cycle resets jun 1 · 09:00 UTC</span>
              <button className="btn btn-link" style={{ fontSize: 12 }} onClick={() => alert("Configure monthly ceiling notifications. Default alert at 80% limit threshold.")}>Set spend alerts →</button>
            </div>
          </div>

          <div className="payment-card">
            <div className="glow"/>
            <div className="payment-card-h">
              <b>Acme Industrial Co.</b>
              <span className="brand">Visa</span>
            </div>
            <div className="number" style={{ fontSize: 20, margin: "16px 0", letterSpacing: "0.05em" }}>•••• <b>4242</b></div>
            <div className="meta">
              <span>elif@heliotrope.capital</span>
              <span>exp <b>11/28</b></span>
            </div>
          </div>
        </div>

        <section className="dash-sec" style={{ marginTop: 24 }}>
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Invoice history</h3>
            <div className="dash-sec-actions">
              <span className="filter-chip">year · 2026</span>
              <button className="btn btn-link" onClick={() => alert("Redirecting to secure Stripe Billing Portal. Customer reference: stripe_cus_acme_4f7a.")}>View Stripe portal →</button>
            </div>
          </header>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((i) => (
                <tr key={i.id} style={{ cursor: "default" }}>
                  <td className="mono">{i.id}</td>
                  <td>{i.period}</td>
                  <td className="mono" style={{ color: "var(--ink)" }}>{i.amount}</td>
                  <td>
                    {i.status === "paid" ? <span className="dash-pill is-ok">paid</span>
                                         : <span className="dash-pill is-on">open</span>}
                  </td>
                  <td className="mono">{i.issued}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="copy-btn" onClick={() => alert(`Simulated receipt download for ${i.id}`)}>PDF</button>
                    <button className="copy-btn" style={{ marginLeft: 4 }} onClick={() => alert(`Raw payload mapping for ${i.id}`)}>JSON</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {planModal && (
        <div className="modal-back" onClick={() => setPlanModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-h">
              <h3>Change plan</h3>
              <button className="modal-x" onClick={() => setPlanModal(false)}>✕</button>
            </header>
            <div className="modal-body">
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.5 }}>
                Pick a new plan. Your audit ledger is unaffected — only the limits and SLA change. New limits apply from your next billing cycle.
              </p>
              <div className="schema-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 14 }}>
                {[
                  { name: "Developer Sandbox", price: "$0",   tag: "free forever", desc: "For building models and local API testing." },
                  { name: "Production Ledger", price: "$120", tag: "current plan", desc: "For mission-critical production data pipelines." },
                  { name: "Volume · custom",   price: "talk", tag: "≥ 1M docs/mo", desc: "For large enterprise clusters with dedicated SLAs." },
                ].map((p) => (
                  <div key={p.name} className={"schema-card " + (p.tag === "current plan" ? "is-on" : "")} 
                       style={{ border: p.tag === "current plan" ? "1px solid var(--accent)" : "1px solid var(--hairline-2)", borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="schema-card-h" style={{ display: 'flex', flexDirection: 'column' }}>
                      <b style={{ color: 'var(--ink)' }}>{p.name}</b>
                      <span className="schema-card-tag" style={{ fontSize: 11, color: p.tag === 'current plan' ? 'var(--accent-ink)' : 'var(--muted)', marginTop: 2 }}>{p.tag}</span>
                    </div>
                    <span style={{ fontFamily: "var(--f-display)", fontSize: 24, fontWeight: 300, color: "var(--ink)" }}>
                      {p.price}
                      {p.price !== "talk" && <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--muted)" }}>/mo</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <footer className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setPlanModal(false)}>Cancel</button>
              <button className="auth-submit" style={{ height: 36, padding: "0 14px" }} onClick={() => { alert("Active subscription updated. Limits will align on next statement date."); setPlanModal(false); }}>Confirm change</button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
