// dash.jsx — Dashboard, Cases ledger, New case wizard.
// Page selected via window.DASH_PAGE = 'overview' | 'cases' | 'new'.

const { useState: useS, useEffect: useE, useMemo: useM } = React;

// ───────────────────────── OVERVIEW ─────────────────────────

function Sparkline({ data, color = "var(--accent)" }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = (max - min) || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d - min) / range) * 100;
    return `${x},${y}`;
  }).join(" ");
  const area = `0,100 ${pts} 100,100`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="stat-spark">
      <defs>
        <linearGradient id={"sp" + Math.random()} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={color} opacity="0.08"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

const OVERVIEW_STATS = [
  { k: "Docs processed",       v: "62,184",   sub: ["↑ 18.2%", " vs last week"], delta: "up",
    data: [12, 15, 14, 18, 17, 19, 22, 21, 24, 26, 25, 28, 30] },
  { k: "Avg. agent time",      v: "1.84s",    sub: ["↓ 0.31s", " p99 latency"],   delta: "up",
    data: [30, 28, 27, 26, 24, 23, 21, 19, 17, 16, 15, 14, 13] },
  { k: "Hours saved · est.",   v: "1,247",    sub: ["≈ $84,160", " in operator time"], delta: "up",
    data: [4, 6, 5, 8, 10, 12, 14, 13, 16, 18, 20, 22, 24] },
  { k: "Active agent pool",    v: "8 / 12",   sub: ["67% utilization", ""], delta: null,
    data: [6, 6, 7, 7, 8, 8, 8, 7, 8, 8, 8, 8, 8] },
];

const ACTIVITY = [
  { state: "ok",   who: "parser",       what: "extracted ", obj: "Invoice_4471.pdf", t: "12s ago",  meta: "case_acme_q3 · 1,840ms" },
  { state: "run",  who: "synthesizer",  what: "emitting ",  obj: "Statement_Sep.pdf", t: "44s ago",  meta: "case_chase_sep · in progress" },
  { state: "ok",   who: "verify",       what: "validated ", obj: "PO_22841.pdf",     t: "3m ago",   meta: "case_north_po · passed schema" },
  { state: "warn", who: "verify",       what: "retried ",   obj: "Receipt_AWS.pdf",  t: "5m ago",   meta: "double-loop · schema mismatch" },
  { state: "ok",   who: "ingest",       what: "received ",  obj: "Bundle_Q3 (24 files)", t: "8m ago", meta: "case_helio · 24 files" },
  { state: "ok",   who: "parser",       what: "extracted ", obj: "Tax_Form_W9.pdf",  t: "11m ago",  meta: "case_w9_kyc · 980ms" },
  { state: "err",  who: "webhook",      what: "failed ",    obj: "POST acme.dev/x",  t: "14m ago",  meta: "504 · retrying with backoff" },
  { state: "ok",   who: "synthesizer",  what: "emitted ",   obj: "Invoice_Q2.pdf",   t: "22m ago",  meta: "case_acme_q2 · 0.0203 USD" },
];

const RECENT_CASES = [
  { id: "case_acme_q3",  name: "Acme Q3 invoices",     files: 24, status: "ready", state: "ok",   updated: "12s ago",  cost: "$0.612" },
  { id: "case_chase_sep",name: "Chase statements Sep", files: 11, status: "running", state: "run",updated: "1m ago",   cost: "$0.241" },
  { id: "case_helio_kyc",name: "Heliotrope KYC bundle",files:  6, status: "review", state: "warn",updated: "12m ago",  cost: "$0.184" },
  { id: "case_north_po", name: "Northwind PO ledger",  files: 18, status: "ready", state: "ok",   updated: "2h ago",   cost: "$0.418" },
  { id: "case_mira_aug", name: "Mira Capital Aug",     files:  9, status: "archived", state: "off",updated: "4d ago",  cost: "$0.272" },
];

function statePill(s) {
  if (s === "ok")   return <span className="dash-pill is-ok">ready</span>;
  if (s === "run")  return <span className="dash-pill is-on">running</span>;
  if (s === "warn") return <span className="dash-pill is-warn">review</span>;
  if (s === "err")  return <span className="dash-pill is-err">error</span>;
  return <span className="dash-pill">archived</span>;
}

function OverviewPage() {
  return (
    <DashLayout current="dashboard" page="Overview"
                crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Overview" }]}
                actions={<>
                  <button className="dash-search">
                    <span>Search cases, schemas, files…</span>
                    <kbd>⌘K</kbd>
                  </button>
                  <a className="btn btn-ghost" href="#"><Icon.Code size={12}/> Docs</a>
                  <a className="btn btn-primary" href="case-new.html">+ New case</a>
                </>}>

      {/* Stat cards */}
      <div className="stat-grid">
        {OVERVIEW_STATS.map((s) => (
          <div className="stat-card" key={s.k}>
            <span className="stat-k">{s.k}</span>
            <span className="stat-v">{s.v}</span>
            <span className="stat-sub">
              <span className={"delta " + (s.delta || "")}>{s.sub[0]}</span>
              <span>{s.sub[1]}</span>
            </span>
            <Sparkline data={s.data}/>
          </div>
        ))}
      </div>

      <div className="dash-two">
        {/* Recent cases */}
        <section className="dash-sec">
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Recent cases</h3>
            <div className="dash-sec-actions">
              <a className="btn btn-link" href="cases.html">View all <Icon.Arrow size={12}/></a>
            </div>
          </header>
          <table className="dash-table">
            <thead><tr>
              <th>Case</th><th>Files</th><th>Status</th><th>Cost</th><th>Updated</th>
            </tr></thead>
            <tbody>
              {RECENT_CASES.map((c) => (
                <tr key={c.id} onClick={() => location.assign("case-detail.html")}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <b style={{ color: "var(--ink)", fontWeight: 500 }}>{c.name}</b>
                      <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>{c.id}</span>
                    </div>
                  </td>
                  <td className="mono">{c.files}</td>
                  <td>{statePill(c.state)}</td>
                  <td className="mono">{c.cost}</td>
                  <td className="mono">{c.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Activity feed */}
        <section className="dash-sec">
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Agent activity</h3>
            <div className="dash-sec-actions">
              <span className="dash-pill is-ok"><span className="dot-live"/> live</span>
            </div>
          </header>
          <ul className="activity-list">
            {ACTIVITY.map((a, i) => (
              <li className="activity-row" key={i}>
                <span className={"dot " + a.state}/>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                  <span>
                    <span className="mono">{a.who}</span>{" "}<span style={{ color: "var(--muted)" }}>{a.what}</span><b>{a.obj}</b>
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted-2)", fontFamily: "var(--f-mono)" }}>{a.meta}</span>
                </div>
                <time>{a.t}</time>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Agent pool + cost */}
      <div className="dash-two">
        <section className="dash-sec">
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Agent pool</h3>
            <div className="dash-sec-actions">
              <span className="dash-pill is-on">8 of 12 active</span>
            </div>
          </header>
          <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const active = i < 8;
              const types = ["P", "V", "S"];
              return (
                <div key={i} style={{
                  border: "1px solid var(--hairline)",
                  borderRadius: 8,
                  padding: "14px 12px",
                  background: active ? "var(--surface)" : "var(--bg-alt)",
                  display: "flex", flexDirection: "column", gap: 4,
                  opacity: active ? 1 : 0.55,
                }}>
                  <span style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="f-mono" style={{ fontSize: 10, color: "var(--muted-2)" }}>worker_{String(i+1).padStart(2,"0")}</span>
                    {active && <span className="dot-pulse"/>}
                  </span>
                  <span className="f-mono" style={{ fontSize: 12, color: active ? "var(--ink)" : "var(--muted-2)" }}>
                    {types[i % 3]}-agent
                  </span>
                  <span className="f-mono" style={{ fontSize: 10, color: "var(--muted-2)" }}>
                    {active ? `${(0.6 + Math.random() * 0.4).toFixed(1)}s queue` : "idle"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dash-sec">
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">API cost · this month</h3>
            <div className="dash-sec-actions">
              <span className="dash-pill">claude-3.5-sonnet</span>
            </div>
          </header>
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span className="f-display" style={{ fontSize: 42, fontWeight: 300, letterSpacing: "-0.025em" }}>$1,284.21</span>
              <span className="f-mono" style={{ fontSize: 12, color: "var(--ok)" }}>↓ 8.4% wow</span>
            </div>
            <svg viewBox="0 0 600 120" style={{ width: "100%", height: 120 }}>
              {Array.from({ length: 30 }).map((_, i) => {
                const h = 20 + Math.sin(i * 0.4) * 18 + Math.random() * 30;
                return (
                  <rect key={i}
                        x={i * 20 + 4} y={120 - h}
                        width="14" height={h}
                        rx="2"
                        fill={i === 29 ? "var(--accent)" : "var(--hairline-strong)"}
                        opacity={i > 24 ? 0.9 : 0.4}/>
                );
              })}
            </svg>
            <div className="f-mono" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted-2)" }}>
              <span>oct 01</span><span>oct 15</span><span>oct 30</span>
            </div>
          </div>
        </section>
      </div>
    </DashLayout>
  );
}

// ───────────────────────── CASES LEDGER ─────────────────────────

const ALL_CASES = [
  ...RECENT_CASES,
  { id: "case_w9_kyc",   name: "Quartzly W-9 batch",      files: 42, status: "ready",  state: "ok",   updated: "1d ago",  cost: "$0.842" },
  { id: "case_velvet",   name: "Velvet & Co contracts",   files:  7, status: "review", state: "warn", updated: "1d ago",  cost: "$0.318" },
  { id: "case_eu_dpa",   name: "EU DPA reconciliation",   files: 56, status: "ready",  state: "ok",   updated: "2d ago",  cost: "$1.241" },
  { id: "case_helio_q2", name: "Heliotrope Q2 ledger",    files: 31, status: "ready",  state: "ok",   updated: "3d ago",  cost: "$0.612" },
  { id: "case_mercator", name: "Mercator Marine BoL",     files: 13, status: "archived",state: "off", updated: "5d ago",  cost: "$0.302" },
  { id: "case_north_q1", name: "Northwind Q1",            files: 28, status: "archived",state: "off", updated: "12d ago", cost: "$0.642" },
];

function CasesLedgerPage() {
  const [filter, setFilter] = useS("all");
  const [query, setQuery]   = useS("");

  const filtered = ALL_CASES.filter((c) => {
    if (filter !== "all" && c.status !== filter) return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.id.includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <DashLayout current="cases" page="Cases ledger"
                crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Cases ledger" }]}
                actions={<>
                  <a className="btn btn-ghost" href="#"><Icon.Hash size={12}/> Export</a>
                  <a className="btn btn-primary" href="case-new.html">+ New case</a>
                </>}>

      <div className="cases-toolbar">
        <input className="search-input"
               placeholder="Search cases by name or id…"
               value={query}
               onChange={(e) => setQuery(e.target.value)}/>
        {["all", "ready", "running", "review", "archived"].map((f) => (
          <button key={f}
                  className={"filter-chip " + (filter === f ? "is-on" : "")}
                  onClick={() => setFilter(f)}>
            {f}
            {f !== "all" && <span style={{ opacity: 0.6 }}>· {ALL_CASES.filter(c => c.status === f).length}</span>}
            {f === "all" && <span style={{ opacity: 0.6 }}>· {ALL_CASES.length}</span>}
          </button>
        ))}
        <span style={{ flex: 1 }}/>
        <span className="filter-chip">sort: updated ↓</span>
      </div>

      <section className="dash-sec">
        <table className="dash-table">
          <thead><tr>
            <th>Case</th>
            <th>Files</th>
            <th>Status</th>
            <th>API cost</th>
            <th>Updated</th>
            <th></th>
          </tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => location.assign("case-detail.html")}>
                <td>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <b style={{ color: "var(--ink)", fontWeight: 500 }}>{c.name}</b>
                    <span className="mono" style={{ fontSize: 11, color: "var(--muted-2)" }}>{c.id}</span>
                  </div>
                </td>
                <td className="mono">{c.files} files</td>
                <td>{statePill(c.state)}</td>
                <td className="mono">{c.cost}</td>
                <td className="mono">{c.updated}</td>
                <td style={{ textAlign: "right" }}><Icon.ArrowUR size={12}/></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: 60, color: "var(--muted-2)" }}>
                No cases match your filters.
              </td></tr>
            )}
          </tbody>
        </table>
      </section>
    </DashLayout>
  );
}

// ───────────────────────── NEW CASE WIZARD ─────────────────────────

const SCHEMAS = [
  { id: "invoice",  name: "Invoice",          tag: "v2.3", desc: "Vendor, line items, tax, currency, dues",                       code: "synapse.schemas.Invoice" },
  { id: "stmt",     name: "BankStatement",    tag: "v1.8", desc: "Account, period, opening/closing balance, transactions[]",     code: "synapse.schemas.BankStatement" },
  { id: "po",       name: "PurchaseOrder",    tag: "v1.4", desc: "Buyer, shipper, line items, ship date, totals",                code: "synapse.schemas.PurchaseOrder" },
  { id: "receipt",  name: "Receipt",          tag: "v1.1", desc: "Merchant, items, payment method, totals",                      code: "synapse.schemas.Receipt" },
  { id: "kyc",      name: "KYC.W9",           tag: "v3.0", desc: "Form W-9: legal entity, tax classification, TIN, signature",   code: "synapse.schemas.W9" },
  { id: "custom",   name: "Custom schema…",   tag: "byo",  desc: "Bring your own pydantic, zod, or JSON schema",                  code: "import MySchema from \"./schemas\"" },
];

function NewCaseWizard() {
  const [step, setStep] = useS(0);
  const [name, setName] = useS("");
  const [schema, setSchema] = useS("invoice");
  const [files, setFiles] = useS([
    { name: "Acme_Invoice_Q3.pdf",   size: "284 KB", progress: 100 },
    { name: "Chase_Statement_Sep.pdf", size: "1.2 MB", progress: 100 },
    { name: "Vendor_PO_4471.pdf",    size: "96 KB",  progress: 72 },
  ]);

  const STEPS = [
    { t: "Files",   d: "drag & drop documents" },
    { t: "Schema",  d: "choose extraction shape" },
    { t: "Details", d: "name + tenant scope" },
    { t: "Review",  d: "confirm and run" },
  ];

  return (
    <DashLayout current="cases" page="New case"
                crumbs={[
                  { label: "Acme Industrial · prod", href: "#" },
                  { label: "Cases ledger", href: "cases.html" },
                  { label: "New case" }
                ]}
                actions={<a className="btn btn-ghost" href="cases.html">Cancel</a>}>

      <div className="wizard-grid">
        <aside className="wiz-steps">
          {STEPS.map((s, i) => (
            <div key={s.t}
                 className={"wiz-step " + (i === step ? "is-on " : "") + (i < step ? "is-done" : "")}
                 onClick={() => setStep(i)}>
              <span className="wiz-step-n">{i < step ? "✓" : i + 1}</span>
              <div>
                <b>{s.t}</b>
                <span>{s.d}</span>
              </div>
            </div>
          ))}
        </aside>

        <div className="wiz-panel">
          {step === 0 && (
            <>
              <h2>Upload documents</h2>
              <p>Drop PDFs, scans, or images. Synapse de-skews and OCRs automatically before the Parser agent begins.</p>
              <div className="wiz-drop">
                <span className="ico"><Icon.Upload size={18}/></span>
                <span className="lead">Drag &amp; drop files here</span>
                <span className="hint">PDF · PNG · JPG · TIFF · HEIC — up to 50 MB each</span>
                <button className="btn btn-ghost">Browse files</button>
              </div>

              <div className="wiz-files">
                <header>
                  <span>{files.length} files</span>
                  <span>queued · 1.58 MB</span>
                </header>
                {files.map((f, i) => (
                  <div className="wiz-file" key={i}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{f.name}</span>
                      <div className="wiz-file-progress"><span style={{ width: `${f.progress}%` }}/></div>
                    </div>
                    <span/>
                    <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                      {f.progress < 100 ? `${f.progress}% · uploading` : `${f.size} · ready`}
                    </span>
                  </div>
                ))}
              </div>
              <WizFooter step={step} setStep={setStep} last={3}/>
            </>
          )}

          {step === 1 && (
            <>
              <h2>Pick a target schema</h2>
              <p>Synapse will refuse to emit a document that doesn't match this schema. Pick the closest, or bring your own.</p>
              <div className="schema-grid">
                {SCHEMAS.map((s) => (
                  <div key={s.id}
                       className={"schema-card " + (schema === s.id ? "is-on" : "")}
                       onClick={() => setSchema(s.id)}>
                    <div className="schema-card-h">
                      <b>{s.name}</b>
                      <span className="schema-card-tag">{s.tag}</span>
                    </div>
                    <p>{s.desc}</p>
                    <code>{s.code}</code>
                  </div>
                ))}
              </div>
              <WizFooter step={step} setStep={setStep} last={3}/>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Name &amp; scope</h2>
              <p>Cases live inside a tenant. Naming is up to you — most teams use the source system + period.</p>
              <div className="auth-form" style={{ gap: 16 }}>
                <div className="field">
                  <label>Case name</label>
                  <input placeholder="Acme Q3 invoices"
                         value={name} onChange={(e) => setName(e.target.value)}/>
                  <span className="hint">Visible in the cases ledger and case URL.</span>
                </div>
                <div className="field">
                  <label>Tenant scope</label>
                  <select defaultValue="org_4f7a">
                    <option value="org_4f7a">Acme Industrial · org_4f7a (default)</option>
                    <option>Sub-tenant · finance.acme</option>
                    <option>Sub-tenant · legal.acme</option>
                  </select>
                  <span className="hint">RLS policies are bound to this scope. Cannot be changed after creation.</span>
                </div>
                <div className="field">
                  <label>On validation error</label>
                  <select defaultValue="retry">
                    <option value="retry">Double-loop retry (max 3 attempts) — recommended</option>
                    <option>Single attempt, then flag for review</option>
                    <option>Fail fast and webhook the error</option>
                  </select>
                </div>
              </div>
              <WizFooter step={step} setStep={setStep} last={3}/>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Review and run</h2>
              <p>Synapse will spin up a Parser, Verify and Synthesizer agent per document and write to the ledger.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: 10, overflow: "hidden", marginBottom: 22 }}>
                {[
                  ["Case name",   name || "Acme Q3 invoices"],
                  ["Schema",      SCHEMAS.find(s => s.id === schema)?.name],
                  ["Files",       `${files.length} files · 1.58 MB total`],
                  ["Tenant",      "Acme Industrial · org_4f7a"],
                  ["Region",      "eu-west-1 (Frankfurt)"],
                  ["Retries",     "Double-loop · max 3 attempts"],
                  ["Estimated",   `≈ $${(0.024 * files.length).toFixed(3)} USD · ~${files.length * 2.4}s`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "var(--surface)", padding: "12px 18px", display: "flex", justifyContent: "space-between" }}>
                    <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{k}</span>
                    <span className="f-mono" style={{ fontSize: 13, color: "var(--ink)" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="wiz-row" style={{ borderTop: 0, paddingTop: 0, marginTop: 0 }}>
                <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>
                <a className="btn btn-primary" href="case-detail.html">
                  Run pipeline <Icon.Arrow size={12}/>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </DashLayout>
  );
}

function WizFooter({ step, setStep, last }) {
  return (
    <div className="wiz-row">
      {step > 0
        ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>← Back</button>
        : <span/>}
      <button className="btn btn-primary" onClick={() => setStep(Math.min(last, step + 1))}>
        Continue <Icon.Arrow size={12}/>
      </button>
    </div>
  );
}

// ───────────────────────── LAYOUT ─────────────────────────

function DashLayout({ current, page, crumbs, actions, children }) {
  return (
    <div className="dash-shell">
      <DashboardSidebar current={current}/>
      <main className="dash-main">
        <DashboardTopbar title={page} crumbs={crumbs} actions={actions}/>
        <div className="dash-body">{children}</div>
      </main>
      <SharedTweaks/>
    </div>
  );
}

const DASH_PAGES = { overview: OverviewPage, cases: CasesLedgerPage, new: NewCaseWizard };
const Page = DASH_PAGES[window.DASH_PAGE] ?? OverviewPage;

applySharedTokens({ accent: "gold", theme: "light" });
ReactDOM.createRoot(document.getElementById("root")).render(<Page/>);
