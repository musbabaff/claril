'use client';

import { useState } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';

interface LedgerEntry {
  idx: number;
  hash: string;
  prev: string;
  time: string;
  actor: string;
  op: string;
  doc: string;
  tenant: string;
  state: string;
  ms: number;
}

const LEDGER_ENTRIES: LedgerEntry[] = [
  { idx: 824112, hash: "7b03ee83d8a7c1f02998cc18d4e1f8fa92", prev: "f8fa92ee03d8d4e1aa7c1f099b8cc18d", time: "2026-05-22 14:08:33", actor: "synth:w_03", op: "emit",        doc: "Invoice_AC-4471.pdf", tenant: "org_4f7a", state: "ok",   ms: 1450 },
  { idx: 824111, hash: "d4e1f87b03ee83a7c1f0fa9229bdcc18", prev: "29bdcc18a7c1f0d4e1f87b03ee83fa92", time: "2026-05-22 14:08:31", actor: "verify:w_05", op: "verify",      doc: "Invoice_AC-4471.pdf", tenant: "org_4f7a", state: "ok",   ms: 410 },
  { idx: 824110, hash: "29bdcc18a7c1f0d4e1f87b03ee83fa92", prev: "48fe22a7c1f029bdcc1891a0d4e1f8fa", time: "2026-05-22 14:08:30", actor: "parser:w_02", op: "extract",     doc: "Invoice_AC-4471.pdf", tenant: "org_4f7a", state: "ok",   ms: 1840 },
  { idx: 824109, hash: "48fe22a7c1f029bdcc1891a0d4e1f8fa", prev: "91a0cc18a7c1f048fe22d4e1f8fa7b03", time: "2026-05-22 14:08:14", actor: "verify:w_05", op: "verify.fail", doc: "Invoice_AC-4473.pdf", tenant: "org_4f7a", state: "warn", ms: 320 },
  { idx: 824108, hash: "91a0cc18a7c1f048fe22d4e1f8fa7b03", prev: "a7c1f048fe22cc1891a0d4e1f8fa7b03", time: "2026-05-22 14:08:13", actor: "parser:w_07", op: "extract",     doc: "Invoice_AC-4473.pdf", tenant: "org_4f7a", state: "ok",   ms: 2110 },
  { idx: 824107, hash: "a7c1f048fe22cc1891a0d4e1f8fa7b03", prev: "ee83d8d4e1aa7c1f099b8cc18b03f8fa", time: "2026-05-22 14:08:09", actor: "ingest",      op: "ingest",      doc: "Acme_Q3_bundle (24 files)", tenant: "org_4f7a", state: "ok",   ms: 18 },
  { idx: 824106, hash: "ee83d8d4e1aa7c1f099b8cc18b03f8fa", prev: "cc18d4e1f8fa92eea7c1f099b803ee83", time: "2026-05-22 14:07:50", actor: "synth:w_09",  op: "emit",        doc: "Statement_Chase_Sep.pdf", tenant: "org_4f7a", state: "ok",   ms: 1620 },
  { idx: 824105, hash: "cc18d4e1f8fa92eea7c1f099b803ee83", prev: "b803ee83cc18d4e1f8fa92a7c1f099b8", time: "2026-05-22 14:07:48", actor: "verify:w_05", op: "verify",      doc: "Statement_Chase_Sep.pdf", tenant: "org_4f7a", state: "ok",   ms: 530 },
];

interface VerificationResult {
  state: "pending" | "ok" | "err" | "idle";
  entry?: LedgerEntry;
  reason?: string;
}

export default function AuditPage() {
  const [query, setQuery] = useState<string>("");
  const [actor, setActor] = useState<string>("all");
  const [result, setResult] = useState<VerificationResult>({ state: "idle" });
  const [verifying, setVerifying] = useState<boolean>(false);

  const filtered = LEDGER_ENTRIES.filter((e) => {
    if (actor !== "all" && !e.actor.startsWith(actor)) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return e.hash.includes(q) || e.doc.toLowerCase().includes(q) || String(e.idx).includes(q);
  });

  const runVerify = () => {
    if (!query) return;
    setVerifying(true);
    setResult({ state: "pending" });
    setTimeout(() => {
      const target = LEDGER_ENTRIES.find((e) => e.hash.includes(query.toLowerCase()) || String(e.idx) === query || e.doc.toLowerCase().includes(query.toLowerCase()));
      if (target) {
        setResult({ state: "ok", entry: target });
      } else {
        setResult({ state: "err", reason: "hash not found in chain · check region or older shard" });
      }
      setVerifying(false);
    }, 1300);
  };

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Audit ledger" }]}
        title="Audit Ledger"
        actions={
          <>
            <span className="dash-pill is-ok">chain · valid · {LEDGER_ENTRIES[0].idx.toLocaleString()} steps</span>
            <button className="btn btn-ghost" onClick={() => alert("Exporting JSONL ledger index. Direct cold vault query generated.")}>
              <Icon.Hash size={12}/> Export JSONL
            </button>
            <button className="btn btn-primary" onClick={() => alert("Verification run completed. Root Merkle anchor perfectly intact.")}>
              Verify chain root
            </button>
          </>
        }
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
        {/* Validator */}
        <div className="audit-validator">
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>Verify a step</h3>
            <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 13 }}>
              Paste any chain hash, step index, or document name. Claril recomputes the SHA-256 chain locally and shows whether the step is unbroken.
            </p>
            <div className="audit-input">
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                     onKeyDown={(e) => { if (e.key === "Enter") runVerify(); }}
                     placeholder="sha256:7b03ee… or 824112 or Invoice_AC-4471.pdf"
                     style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', color: 'var(--ink)', font: 'inherit', fontSize: 13.5 }}/>
              <button onClick={runVerify} disabled={verifying} className="btn-primary" style={{ padding: "0 14px", height: 32, borderRadius: 5, fontSize: 12.5, fontWeight: 500 }}>
                {verifying ? "Verifying…" : "Verify"}
              </button>
            </div>
            {result.state === "ok" && result.entry && (
              <div className="audit-result is-ok" style={{ marginTop: 14 }}>
                <b>✓ Verified — step is unbroken</b>
                <div className="row"><span>index</span><span>{result.entry.idx}</span></div>
                <div className="row"><span>hash</span><span>sha256:{result.entry.hash.slice(0,28)}…</span></div>
                <div className="row"><span>prev</span><span>sha256:{result.entry.prev.slice(0,28)}…</span></div>
                <div className="row"><span>actor</span><span>{result.entry.actor}</span></div>
                <div className="row"><span>recomputed locally</span><span>matches anchor</span></div>
              </div>
            )}
            {result.state === "err" && (
              <div className="audit-result is-err" style={{ marginTop: 14 }}>
                <b>✕ Not found</b>
                <span>{result.reason}</span>
              </div>
            )}
            {result.state === "pending" && verifying && (
              <div className="audit-result is-pending" style={{ marginTop: 14 }}>
                <b>Recomputing chain locally…</b>
                <span>walking 824,112 steps · should take ~1s</span>
              </div>
            )}
          </div>

          <div className="audit-chain-viz">
            <span className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, display: 'block' }}>last 5 steps</span>
            {LEDGER_ENTRIES.slice(0, 5).map((e) => (
              <div key={e.idx} className={"chain-link " + (e.state === "warn" ? "warn" : "")}>
                <div className={"chain-dot " + (e.state === "warn" ? "warn" : "")}/>
                <div className="chain-body">
                  <b>{e.op}</b>
                  <span>{e.idx.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="dash-sec" style={{ marginTop: 22 }}>
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Ledger entries</h3>
            <div className="dash-sec-actions">
              <input className="search-input" style={{ height: 28, fontSize: 12, padding: "0 10px" }}
                     placeholder="search ledger…"
                     value={query} onChange={(e) => setQuery(e.target.value)}/>
              {["all","parser","verify","synth","ingest"].map((a) => (
                <button key={a} className={"filter-chip " + (actor === a ? "is-on" : "")}
                        onClick={() => setActor(a)}>{a}</button>
              ))}
            </div>
          </header>
          <table className="dash-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Operation</th>
                <th>Document</th>
                <th>Hash</th>
                <th>Actor</th>
                <th>Time</th>
                <th>Δms</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.idx} onClick={() => { setQuery(e.hash.slice(0, 12)); }} style={{ cursor: 'pointer' }}>
                  <td className="mono">{e.idx.toLocaleString()}</td>
                  <td>
                    <span className={"dash-pill " + (e.state === "warn" ? "is-warn" : "is-ok")}>{e.op}</span>
                  </td>
                  <td>{e.doc}</td>
                  <td className="mono">sha256:{e.hash.slice(0, 18)}…</td>
                  <td className="mono">{e.actor}</td>
                  <td className="mono">{e.time}</td>
                  <td className="mono">{e.ms}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 60, color: "var(--muted-2)" }}>
                    No entries match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
