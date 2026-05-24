// dashx.jsx — Extra dashboard pages: schemas, agents, audit, team, keys, billing, reports, settings.

const { useState: useDX, useEffect: useDXE, useMemo: useDXM, useRef: useDXR } = React;

// =================================================================
// SCHEMAS
// =================================================================

const SCHEMA_LIB = [
  { id: "invoice",  name: "Invoice",          tag: "v2.3", updated: "2d ago",  type: "system",
    desc: "Vendor, line items, tax, currency, dues — covers ~98% of B2B invoices.",
    fields: [
      ["vendor",      "string",  "required", "Legal name of the issuing entity"],
      ["invoice_no",  "string",  "required", "Vendor-issued invoice number"],
      ["issued",      "date",    "required", "ISO-8601 date of issue"],
      ["due",         "date",    "required", "ISO-8601 due date"],
      ["currency",    "iso4217", "required", "3-letter currency code"],
      ["subtotal",    "decimal", "required", "Pre-tax amount"],
      ["tax",         "decimal", "required", "Tax amount, defaults to 0"],
      ["total",       "decimal", "required", "Inclusive total"],
      ["line_items",  "array",   "optional", "Itemised lines, max 256"],
      ["payment_terms","string", "optional", "Net 30, 45, etc."],
    ] },
  { id: "stmt",    name: "BankStatement",    tag: "v1.8", updated: "11d ago", type: "system",
    desc: "Account, period, opening/closing balance, transactions[].",
    fields: [
      ["account",        "string",  "required", "Masked account number"],
      ["institution",    "string",  "required", "Bank or broker name"],
      ["period_start",   "date",    "required", "Statement period start"],
      ["period_end",     "date",    "required", "Statement period end"],
      ["opening_balance","decimal", "required", ""],
      ["closing_balance","decimal", "required", ""],
      ["transactions",   "array",   "required", "Itemised transactions"],
      ["currency",       "iso4217", "required", ""],
    ] },
  { id: "po",      name: "PurchaseOrder",    tag: "v1.4", updated: "1mo ago", type: "system",
    desc: "Buyer, shipper, line items, ship date, totals.",
    fields: [
      ["po_number",      "string",  "required", ""],
      ["vendor",         "string",  "required", ""],
      ["buyer",          "string",  "required", ""],
      ["ship_date",      "date",    "required", ""],
      ["line_items",     "array",   "required", ""],
      ["total",          "decimal", "required", ""],
    ] },
  { id: "kyc-w9",  name: "KYC.W9",           tag: "v3.0", updated: "3d ago",  type: "system",
    desc: "Form W-9: legal entity, tax classification, TIN, signature.",
    fields: [
      ["legal_name",         "string",  "required", ""],
      ["tax_classification", "enum",    "required", "individual | c_corp | s_corp | …"],
      ["tin",                "string",  "required", "Encrypted at rest"],
      ["signature_present",  "bool",    "required", ""],
      ["signed_at",          "date",    "optional", ""],
    ] },
  { id: "freight", name: "FreightBoL",       tag: "v0.9 draft", updated: "today", type: "draft",
    desc: "Bill of Lading. Drafted by Maria · pending review.",
    fields: [
      ["bol_number",     "string",  "required", ""],
      ["shipper",        "string",  "required", ""],
      ["consignee",      "string",  "required", ""],
      ["shipment_date",  "date",    "required", ""],
      ["packages",       "integer", "required", ""],
      ["weight_kg",      "decimal", "required", ""],
    ] },
  { id: "rcpt",    name: "Receipt",          tag: "v1.1", updated: "2mo ago", type: "system",
    desc: "Merchant, items, payment method, totals.",
    fields: [
      ["merchant",     "string",  "required", ""],
      ["items",        "array",   "optional", ""],
      ["payment_method","string", "optional", ""],
      ["total",        "decimal", "required", ""],
      ["currency",     "iso4217", "required", ""],
    ] },
];

function SchemasPage() {
  const [activeId, setActiveId] = useDX(SCHEMA_LIB[0].id);
  const [modal, setModal] = useDX(null);
  const [confirmDel, setConfirmDel] = useDX(null);
  const [items, setItems] = useDX(SCHEMA_LIB);
  const active = items.find((s) => s.id === activeId) ?? items[0];

  const onCreate = (payload) => {
    const id = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (items.some((i) => i.id === id)) return;
    setItems([{ id, ...payload, tag: "v0.1 draft", updated: "just now", type: "draft", fields: [] }, ...items]);
    setActiveId(id);
    setModal(null);
  };

  const onDelete = () => {
    setItems(items.filter((i) => i.id !== confirmDel));
    if (activeId === confirmDel) setActiveId(items[0]?.id);
    setConfirmDel(null);
  };

  return (
    <DashLayoutShared
      current="schemas" page="Schemas"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Schemas" }]}
      actions={<>
        <a className="btn btn-ghost" href="#"><Icon.Code size={12}/> Import JSON Schema</a>
        <button className="btn btn-primary" onClick={() => setModal("create")}>+ New schema</button>
      </>}>

      <div className="split-panel">
        <aside className="split-list">
          <header className="split-list-h">
            <span>{items.length} schemas</span>
            <button onClick={() => setModal("create")}>+ new</button>
          </header>
          <ul className="split-items thin-scroll">
            {items.map((s) => (
              <li key={s.id}
                  className={"split-item " + (s.id === activeId ? "is-on" : "")}
                  onClick={() => setActiveId(s.id)}>
                <div className="split-item-h">
                  <span>{s.name}</span>
                  <span className="tag">{s.tag}</span>
                </div>
                <span className="split-item-meta">{s.fields.length} fields · updated {s.updated}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="split-detail">
          <header className="split-detail-h">
            <div>
              <h2>{active?.name}</h2>
              <p className="sub">id: <span style={{ color: "var(--accent-ink)" }}>synapse.schemas.{active?.id}</span> · {active?.tag} · updated {active?.updated}</p>
            </div>
            <div className="split-detail-actions">
              <button className="btn btn-ghost" onClick={() => setModal("edit")}>Edit fields</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(active.id)}
                      style={{ color: "var(--err)" }}>Delete</button>
              <button className="btn btn-primary">Publish v{(parseFloat(active?.tag.replace("v","")) + 0.1).toFixed(1)}</button>
            </div>
          </header>

          <div className="split-detail-body">
            <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14, maxWidth: 600 }}>{active?.desc}</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
              {[["fields", active?.fields.length], ["usage (30d)", "412 cases"], ["pass rate", "98.4%"]].map(([k, v]) => (
                <div key={k} style={{ background: "var(--surface)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                  <span className="f-mono" style={{ fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted-2)" }}>{k}</span>
                  <span className="f-mono" style={{ fontSize: 16, color: "var(--ink)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>

            <table className="schema-field-tbl">
              <thead><tr>
                <th>Field</th><th>Type</th><th>Constraint</th><th>Description</th>
              </tr></thead>
              <tbody>
                {active?.fields.map(([k, t, c, d]) => (
                  <tr key={k}>
                    <td className="key">{k}</td>
                    <td className="type">{t}</td>
                    <td><span className={c === "required" ? "req" : "opt"}>{c}</span></td>
                    <td style={{ color: "var(--muted)" }}>{d || "—"}</td>
                  </tr>
                ))}
                {(active?.fields?.length ?? 0) === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: 60, color: "var(--muted-2)" }}>
                    Empty schema — click "Edit fields" to add your first field.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === "create" && <CreateSchemaModal onClose={() => setModal(null)} onCreate={onCreate}/>}
      {modal === "edit"   && <EditSchemaModal schema={active} onClose={() => setModal(null)}
                                              onSave={(fields) => {
                                                setItems(items.map(i => i.id === active.id ? { ...i, fields, updated: "just now" } : i));
                                                setModal(null);
                                              }}/>}
      {confirmDel && (
        <Modal title="Delete schema" onClose={() => setConfirmDel(null)}
               foot={<>
                 <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                 <button className="auth-submit" style={{ background: "var(--err)", height: 36, padding: "0 14px" }}
                         onClick={onDelete}>Delete schema</button>
               </>}>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.5 }}>
            This will retire <b>{items.find(i => i.id === confirmDel)?.name}</b>. Cases using older versions will continue to work, but no new cases can be created against it.
          </p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>
            Type the schema id to confirm: <b>{confirmDel}</b>
          </p>
          <input className="field-input" placeholder={confirmDel} style={{ height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, font: "inherit", fontFamily: "var(--f-mono)", fontSize: 12 }}/>
        </Modal>
      )}
    </DashLayoutShared>
  );
}

function CreateSchemaModal({ onClose, onCreate }) {
  const [name, setName] = useDX("");
  const [desc, setDesc] = useDX("");
  return (
    <Modal title="New schema" onClose={onClose}
           foot={<>
             <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
             <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                     onClick={() => onCreate({ name: name || "Untitled", desc, })}>
               Create draft <Icon.Arrow size={12}/>
             </button>
           </>}>
      <div className="field">
        <label>Schema name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ContractAgreement" autoFocus/>
        <span className="hint">Used as the type name in your SDK. PascalCase recommended.</span>
      </div>
      <div className="field">
        <label>Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                  placeholder="Short description of what this schema captures."/>
      </div>
      <div className="field">
        <label>Start from</label>
        <select defaultValue="blank">
          <option value="blank">Blank schema</option>
          <option>Clone of Invoice (v2.3)</option>
          <option>Clone of BankStatement (v1.8)</option>
          <option>JSON Schema · paste at next step</option>
          <option>pydantic class · paste at next step</option>
        </select>
      </div>
    </Modal>
  );
}

function EditSchemaModal({ schema, onClose, onSave }) {
  const [rows, setRows] = useDX(schema?.fields ?? []);
  const updateRow = (i, idx, v) => {
    const next = rows.map((r, j) => j === i ? [...r.slice(0, idx), v, ...r.slice(idx + 1)] : r);
    setRows(next);
  };
  return (
    <Modal title={`Edit fields — ${schema?.name}`} onClose={onClose}
           wide
           foot={<>
             <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
             <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                     onClick={() => onSave(rows)}>Save fields</button>
           </>}>
      <table className="schema-field-tbl" style={{ marginBottom: 12 }}>
        <thead><tr><th>Field</th><th>Type</th><th>Constraint</th><th>Description</th><th/></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td><input value={r[0]} onChange={(e) => updateRow(i, 0, e.target.value)} className="inline-input"/></td>
              <td>
                <select value={r[1]} onChange={(e) => updateRow(i, 1, e.target.value)} className="inline-input">
                  {["string","integer","decimal","bool","date","iso4217","enum","array"].map(t => <option key={t}>{t}</option>)}
                </select>
              </td>
              <td>
                <select value={r[2]} onChange={(e) => updateRow(i, 2, e.target.value)} className="inline-input">
                  <option>required</option><option>optional</option>
                </select>
              </td>
              <td><input value={r[3]} onChange={(e) => updateRow(i, 3, e.target.value)} className="inline-input"/></td>
              <td>
                <button className="copy-btn" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}
              onClick={() => setRows([...rows, ["new_field", "string", "optional", ""]])}>
        + Add field
      </button>
      <style>{`.inline-input { width: 100%; font: inherit; padding: 4px 6px; border: 1px solid var(--hairline-2); border-radius: 4px; background: var(--surface); color: var(--ink); font-family: var(--f-mono); font-size: 12px; }`}</style>
    </Modal>
  );
}

function Modal({ title, onClose, foot, children, wide }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: wide ? 760 : 520 }} onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>{title}</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </header>
        <div className="modal-body">{children}</div>
        {foot && <footer className="modal-foot">{foot}</footer>}
      </div>
    </div>
  );
}

// =================================================================
// AGENTS — live worker pool + log stream
// =================================================================

const AGENT_KINDS = [
  { id: "parser", name: "Parser",       desc: "OCR + layout segmentation" },
  { id: "verify", name: "Verify",       desc: "Schema + cross-field validate" },
  { id: "synth",  name: "Synthesizer",  desc: "Typed JSON emission" },
];

function AgentsPage() {
  const [workers, setWorkers] = useDX(() => Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    kind: AGENT_KINDS[i % 3].id,
    name: AGENT_KINDS[i % 3].name,
    state: i < 9 ? "running" : (i === 9 ? "error" : "idle"),
    util:  i < 9 ? 0.4 + Math.random() * 0.55 : (i === 9 ? 0 : 0),
    cost:  +(Math.random() * 0.08 + 0.01).toFixed(4),
    queue: i < 9 ? (Math.random() * 2.2 + 0.4).toFixed(1) : 0,
  })));
  const [logs, setLogs] = useDX(() => Array.from({ length: 14 }).map((_, i) => makeLog(i, Date.now() - i * 2000)));
  const [logFilter, setLogFilter] = useDX("all");
  const [paused, setPaused] = useDX(false);

  function makeLog(i, ts) {
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

  useDXE(() => {
    if (paused) return;
    const t = setInterval(() => {
      setLogs((prev) => [makeLog(prev.length, Date.now()), ...prev.slice(0, 49)]);
      setWorkers((prev) => prev.map((w) => w.state === "running"
        ? { ...w, util: Math.max(0.2, Math.min(0.95, w.util + (Math.random() - 0.5) * 0.25)),
                  queue: (Math.random() * 2.2 + 0.3).toFixed(1) }
        : w));
    }, 1400);
    return () => clearInterval(t);
  }, [paused]);

  const filtered = logFilter === "all" ? logs : logs.filter((l) => l.lvl === logFilter);

  const summary = [
    { k: "Active workers",   v: `${workers.filter(w => w.state === "running").length} / ${workers.length}`, sub: "67% utilization" },
    { k: "Throughput · /min",v: "184",     sub: "↑ 12 vs last hour" },
    { k: "p99 latency",      v: "2.41s",   sub: "↓ 0.18s vs last hour" },
    { k: "Error rate",       v: "0.42%",   sub: "1 worker degraded" },
  ];

  return (
    <DashLayoutShared
      current="agents" page="Agents"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Agents" }]}
      actions={<>
        <button className="btn btn-ghost" onClick={() => setPaused((p) => !p)}>
          {paused ? "▶ Resume stream" : "❚❚ Pause stream"}
        </button>
        <button className="btn btn-ghost"><Icon.Branch size={12}/> Scale up</button>
        <button className="btn btn-primary">Deploy agent rev</button>
      </>}>

      <div className="stat-grid">
        {summary.map((s) => (
          <div className="stat-card" key={s.k}>
            <span className="stat-k">{s.k}</span>
            <span className="stat-v">{s.v}</span>
            <span className="stat-sub"><span className="delta up">{s.sub}</span></span>
          </div>
        ))}
      </div>

      <div className="agents-grid">
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

      <section className="dash-sec">
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
    </DashLayoutShared>
  );
}

// =================================================================
// AUDIT LEDGER — chain validator + search
// =================================================================

const LEDGER_ENTRIES = [
  { idx: 824112, hash: "7b03ee83d8a7c1f02998cc18d4e1f8fa92", prev: "f8fa92ee03d8d4e1aa7c1f099b8cc18d", time: "2026-05-22 14:08:33", actor: "synth:w_03", op: "emit",        doc: "Invoice_AC-4471.pdf", tenant: "org_4f7a", state: "ok",   ms: 1450 },
  { idx: 824111, hash: "d4e1f87b03ee83a7c1f0fa9229bdcc18", prev: "29bdcc18a7c1f0d4e1f87b03ee83fa92", time: "2026-05-22 14:08:31", actor: "verify:w_05", op: "verify",      doc: "Invoice_AC-4471.pdf", tenant: "org_4f7a", state: "ok",   ms: 410 },
  { idx: 824110, hash: "29bdcc18a7c1f0d4e1f87b03ee83fa92", prev: "48fe22a7c1f029bdcc1891a0d4e1f8fa", time: "2026-05-22 14:08:30", actor: "parser:w_02", op: "extract",     doc: "Invoice_AC-4471.pdf", tenant: "org_4f7a", state: "ok",   ms: 1840 },
  { idx: 824109, hash: "48fe22a7c1f029bdcc1891a0d4e1f8fa", prev: "91a0cc18a7c1f048fe22d4e1f8fa7b03", time: "2026-05-22 14:08:14", actor: "verify:w_05", op: "verify.fail", doc: "Invoice_AC-4473.pdf", tenant: "org_4f7a", state: "warn", ms: 320 },
  { idx: 824108, hash: "91a0cc18a7c1f048fe22d4e1f8fa7b03", prev: "a7c1f048fe22cc1891a0d4e1f8fa7b03", time: "2026-05-22 14:08:13", actor: "parser:w_07", op: "extract",     doc: "Invoice_AC-4473.pdf", tenant: "org_4f7a", state: "ok",   ms: 2110 },
  { idx: 824107, hash: "a7c1f048fe22cc1891a0d4e1f8fa7b03", prev: "ee83d8d4e1aa7c1f099b8cc18b03f8fa", time: "2026-05-22 14:08:09", actor: "ingest",      op: "ingest",      doc: "Acme_Q3_bundle (24 files)", tenant: "org_4f7a", state: "ok",   ms: 18 },
  { idx: 824106, hash: "ee83d8d4e1aa7c1f099b8cc18b03f8fa", prev: "cc18d4e1f8fa92eea7c1f099b803ee83", time: "2026-05-22 14:07:50", actor: "synth:w_09",  op: "emit",        doc: "Statement_Chase_Sep.pdf", tenant: "org_4f7a", state: "ok",   ms: 1620 },
  { idx: 824105, hash: "cc18d4e1f8fa92eea7c1f099b803ee83", prev: "b803ee83cc18d4e1f8fa92a7c1f099b8", time: "2026-05-22 14:07:48", actor: "verify:w_05", op: "verify",      doc: "Statement_Chase_Sep.pdf", tenant: "org_4f7a", state: "ok",   ms: 530 },
];

function AuditPage() {
  const [query, setQuery] = useDX("");
  const [actor, setActor] = useDX("all");
  const [result, setResult] = useDX({ state: "pending" });
  const [verifying, setVerifying] = useDX(false);

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
      const target = LEDGER_ENTRIES.find((e) => e.hash.includes(query.toLowerCase()) || String(e.idx) === query);
      if (target) {
        setResult({ state: "ok", entry: target });
      } else {
        setResult({ state: "err", reason: "hash not found in chain · check region or older shard" });
      }
      setVerifying(false);
    }, 1300);
  };

  return (
    <DashLayoutShared
      current="audit" page="Audit ledger"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Audit ledger" }]}
      actions={<>
        <span className="dash-pill is-ok">chain · valid · {LEDGER_ENTRIES[0].idx.toLocaleString()} steps</span>
        <a className="btn btn-ghost"><Icon.Hash size={12}/> Export JSONL</a>
        <a className="btn btn-primary" href="#">Verify chain root</a>
      </>}>

      {/* Validator */}
      <div className="audit-validator">
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 500 }}>Verify a step</h3>
          <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 13 }}>
            Paste any chain hash, step index, or document name. Synapse recomputes the SHA-256 chain locally and shows whether the step is unbroken.
          </p>
          <div className="audit-input">
            <input value={query} onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => { if (e.key === "Enter") runVerify(); }}
                   placeholder="sha256:7b03ee… or 824112 or invoice_AC-4471"/>
            <button onClick={runVerify} disabled={verifying}>
              {verifying ? "Verifying…" : "Verify"}
            </button>
          </div>
          {result.state === "ok" && (
            <div className="audit-result is-ok">
              <b>✓ Verified — step is unbroken</b>
              <div className="row"><span>index</span><span>{result.entry.idx}</span></div>
              <div className="row"><span>hash</span><span>sha256:{result.entry.hash.slice(0,28)}…</span></div>
              <div className="row"><span>prev</span><span>sha256:{result.entry.prev.slice(0,28)}…</span></div>
              <div className="row"><span>actor</span><span>{result.entry.actor}</span></div>
              <div className="row"><span>recomputed locally</span><span>matches anchor</span></div>
            </div>
          )}
          {result.state === "err" && (
            <div className="audit-result is-err">
              <b>✕ Not found</b>
              <span>{result.reason}</span>
            </div>
          )}
          {result.state === "pending" && verifying && (
            <div className="audit-result is-pending">
              <b>Recomputing chain locally…</b>
              <span>walking 824,112 steps · should take ~1s</span>
            </div>
          )}
        </div>

        <div className="audit-chain-viz">
          <span className="f-mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>last 5 steps</span>
          {LEDGER_ENTRIES.slice(0, 5).map((e, i) => (
            <div key={e.idx} className={"chain-link " + (e.state === "warn" ? "warn" : "")}>
              <div className={"chain-dot " + (e.state === "warn" ? "warn" : "")}/>
              <div className="chain-body">
                <b>{e.op}</b>
                <span>{e.idx}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="dash-sec">
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
          <thead><tr>
            <th>#</th><th>Operation</th><th>Document</th><th>Hash</th><th>Actor</th><th>Time</th><th>Δms</th>
          </tr></thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.idx} onClick={() => { setQuery(e.hash.slice(0, 12)); }}>
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
              <tr><td colSpan="7" style={{ textAlign: "center", padding: 60, color: "var(--muted-2)" }}>
                No entries match your filters.
              </td></tr>
            )}
          </tbody>
        </table>
      </section>
    </DashLayoutShared>
  );
}

// =================================================================
// TEAM — members + invite + RBAC matrix
// =================================================================

const MEMBERS = [
  { name: "Elif Karaca",      email: "elif@heliotrope.capital",  role: "owner",  mfa: true,  last: "active now" },
  { name: "Tomas Köhler",     email: "tomas@heliotrope.capital", role: "admin",  mfa: true,  last: "12m ago" },
  { name: "Maria Lima",       email: "maria@heliotrope.capital", role: "developer", mfa: true, last: "1h ago" },
  { name: "Jonas Berg",       email: "jonas@heliotrope.capital", role: "developer", mfa: false, last: "3d ago" },
  { name: "Asha Patel",       email: "asha@heliotrope.capital",  role: "viewer", mfa: true,  last: "2w ago" },
  { name: "auditor@kpmg.com", email: "auditor@kpmg.com",         role: "viewer", mfa: true,  last: "external · time-bound" },
];

const RBAC_ROWS = [
  ["View cases",                ["allow", "allow", "allow", "allow"]],
  ["Create cases",              ["allow", "allow", "allow", "deny"]],
  ["Edit schemas",              ["allow", "allow", "cond", "deny"]],
  ["Publish schema version",    ["allow", "allow", "deny", "deny"]],
  ["Issue API keys",            ["allow", "allow", "cond", "deny"]],
  ["Revoke API keys",           ["allow", "allow", "deny", "deny"]],
  ["Invite members",            ["allow", "allow", "deny", "deny"]],
  ["Change billing plan",       ["allow", "deny", "deny", "deny"]],
  ["Delete tenant",             ["allow", "deny", "deny", "deny"]],
  ["Read audit ledger",         ["allow", "allow", "allow", "allow"]],
  ["Export audit ledger",       ["allow", "allow", "cond", "deny"]],
];
const RBAC_LABELS = { allow: "allow", deny: "—", cond: "with approval" };

function TeamPage() {
  const [members, setMembers] = useDX(MEMBERS);
  const [inviteOpen, setInviteOpen] = useDX(false);

  const sendInvite = (payload) => {
    setMembers([...members, { ...payload, mfa: false, last: "invited just now" }]);
    setInviteOpen(false);
  };

  return (
    <DashLayoutShared
      current="team" page="Team"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Team" }]}
      actions={<>
        <button className="btn btn-ghost"><Icon.Shield size={12}/> Audit access</button>
        <button className="btn btn-primary" onClick={() => setInviteOpen(true)}>+ Invite member</button>
      </>}>

      <div className="stat-grid">
        {[
          { k: "Members",          v: String(members.length), sub: "incl. 1 external" },
          { k: "MFA enrolled",     v: `${members.filter(m => m.mfa).length} / ${members.length}`, sub: "WebAuthn or TOTP" },
          { k: "Admin roles",      v: String(members.filter(m => m.role === "owner" || m.role === "admin").length), sub: "policy violations: 0" },
          { k: "Session lifetime", v: "12h",   sub: "shortened from 30d default" },
        ].map((s) => (
          <div className="stat-card" key={s.k}>
            <span className="stat-k">{s.k}</span>
            <span className="stat-v">{s.v}</span>
            <span className="stat-sub"><span className="delta">{s.sub}</span></span>
          </div>
        ))}
      </div>

      <section className="dash-sec">
        <header className="dash-sec-head">
          <h3 className="dash-sec-title">Members ({members.length})</h3>
          <div className="dash-sec-actions">
            <input className="search-input" style={{ height: 28, fontSize: 12, padding: "0 10px" }} placeholder="search members…"/>
            <span className="filter-chip">role · all</span>
          </div>
        </header>
        <div>
          {members.map((m) => (
            <div className="member-row" key={m.email}>
              <span className="av is-large">{m.name.split(/\s+/).map(s => s[0]).slice(0, 2).join("")}</span>
              <div className="member-name">
                <b>{m.name}</b>
                <span>{m.email}</span>
              </div>
              <select defaultValue={m.role}
                      style={{ font: "inherit", fontSize: 12, padding: "5px 9px", border: "1px solid var(--hairline-2)", borderRadius: 6, background: "var(--surface)" }}>
                {["owner","admin","developer","viewer"].map(r => <option key={r}>{r}</option>)}
              </select>
              <span className={"member-mfa " + (m.mfa ? "is-on" : "is-off")}>
                {m.mfa ? "✓ MFA on" : "! MFA off"}
              </span>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--muted)" }}>{m.last}</span>
              <button className="member-actions">⋯</button>
            </div>
          ))}
        </div>
      </section>

      <section className="dash-sec" style={{ marginTop: 22 }}>
        <header className="dash-sec-head">
          <h3 className="dash-sec-title">Permissions · RBAC matrix</h3>
          <div className="dash-sec-actions">
            <span className="dash-pill">v4 · in effect</span>
            <a className="btn btn-link" href="#">Edit roles →</a>
          </div>
        </header>
        <table className="rbac-grid" style={{ margin: 0, border: 0, borderRadius: 0 }}>
          <thead><tr>
            <th>Permission</th>
            <th>Owner</th><th>Admin</th><th>Developer</th><th>Viewer</th>
          </tr></thead>
          <tbody>
            {RBAC_ROWS.map(([perm, cells]) => (
              <tr key={perm}>
                <td>{perm}</td>
                {cells.map((c, i) => (
                  <td key={i} className={c}>{RBAC_LABELS[c]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} onInvite={sendInvite}/>}
    </DashLayoutShared>
  );
}

function InviteModal({ onClose, onInvite }) {
  const [name, setName] = useDX("");
  const [email, setEmail] = useDX("");
  const [role, setRole] = useDX("developer");
  return (
    <Modal title="Invite member" onClose={onClose}
           foot={<>
             <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
             <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                     onClick={() => onInvite({ name: name || email.split("@")[0], email, role })}
                     disabled={!email}>
               Send invitation <Icon.Arrow size={12}/>
             </button>
           </>}>
      <div className="field">
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teammate@yourcompany.com" autoFocus/>
        <span className="hint">A signed invitation link valid for 7 days is sent to this address.</span>
      </div>
      <div className="field">
        <label>Display name (optional)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Lima"/>
      </div>
      <div className="field">
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Admin · everything except billing &amp; deletion</option>
          <option value="developer">Developer · cases + schemas + keys (with approval)</option>
          <option value="viewer">Viewer · read-only across cases &amp; ledger</option>
        </select>
        <span className="hint">Roles can be changed at any time. RBAC matrix below shows exact permissions.</span>
      </div>
      <label className="checkbox-row">
        <input type="checkbox" defaultChecked/>
        <span>Require WebAuthn enrollment before this member can access production tenants.</span>
      </label>
    </Modal>
  );
}

// =================================================================
// API KEYS
// =================================================================

const KEYS = [
  { id: "k_prod_001",  name: "Production · default",  prefix: "sk_live_4f7a_a7c1f0",      scopes: ["extract","schemas:read","ledger:read"],    last: "12s ago",   created: "2024-12-04" },
  { id: "k_etl_002",   name: "ETL pipeline",           prefix: "sk_live_4f7a_b8d217",      scopes: ["extract","webhooks:write"],                last: "1m ago",    created: "2025-02-19" },
  { id: "k_ci_003",    name: "GitHub Actions · CI",    prefix: "sk_test_4f7a_c4e092",      scopes: ["extract","schemas:read"],                  last: "1h ago",    created: "2025-08-30" },
  { id: "k_audit_004", name: "Auditor · KPMG",         prefix: "sk_live_4f7a_d401aa",      scopes: ["ledger:read"],                             last: "3d ago",    created: "2026-03-12", expires: "2026-06-12" },
  { id: "k_legacy_005",name: "Legacy ETL · revoke me", prefix: "sk_live_4f7a_e992cc",      scopes: ["extract"],                                 last: "184d ago",  created: "2024-04-01", revoked: true },
];

function KeysPage() {
  const [createOpen, setCreateOpen] = useDX(false);
  const [revealed, setRevealed]     = useDX(null);
  const [copied, setCopied]         = useDX(null);
  const [keys, setKeys]             = useDX(KEYS);

  const createKey = ({ name, env, scopes }) => {
    const secret = "sk_" + env + "_4f7a_" + Array.from({ length: 24 }).map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    const newK = {
      id: "k_new_" + Date.now(),
      name,
      prefix: secret.slice(0, 24),
      scopes,
      last: "never used",
      created: "just now",
      secret,
    };
    setKeys([newK, ...keys]);
    setRevealed(newK);
    setCreateOpen(false);
  };

  const revoke = (id) => {
    setKeys(keys.map(k => k.id === id ? { ...k, revoked: true } : k));
  };
  const copy = (id, value) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <DashLayoutShared
      current="keys" page="API keys"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "API keys" }]}
      actions={<>
        <a className="btn btn-ghost" href="#"><Icon.Code size={12}/> SDK docs</a>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Generate key</button>
      </>}>

      {revealed && (
        <div className="key-create-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Your new key — copy it now</h3>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 12.5 }}>
                Synapse never stores the plaintext. Once you close this card, it's only the prefix you'll see again.
              </p>
            </div>
            <button className="modal-x" onClick={() => setRevealed(null)}>✕</button>
          </div>
          <div className="key-result">
            <Icon.Lock size={14}/>
            <code>{revealed.secret}</code>
            <button className={"copy-btn " + (copied === "new" ? "is-copied" : "")}
                    onClick={() => copy("new", revealed.secret)}>
              {copied === "new" ? "copied" : "copy"}
            </button>
          </div>
        </div>
      )}

      <section className="dash-sec">
        <header className="dash-sec-head">
          <h3 className="dash-sec-title">Active keys ({keys.filter(k => !k.revoked).length})</h3>
          <div className="dash-sec-actions">
            <input className="search-input" style={{ height: 28, fontSize: 12, padding: "0 10px" }} placeholder="search keys…"/>
          </div>
        </header>
        <div>
          {keys.map((k) => (
            <div key={k.id} className="key-row" style={k.revoked ? { opacity: 0.4 } : {}}>
              <div className="icon"><Icon.Lock size={14}/></div>
              <div className="name">
                <b>{k.name}</b>
                <span className="val">
                  <span>{k.prefix}……{(Math.random() + "").slice(-6)}</span>
                  <button className={"copy-btn " + (copied === k.id ? "is-copied" : "")}
                          onClick={() => copy(k.id, k.prefix + "…")}>
                    {copied === k.id ? "copied" : "copy prefix"}
                  </button>
                </span>
              </div>
              <div className="scopes">
                {k.scopes.map((s) => <span key={s} className="scope-tag">{s}</span>)}
              </div>
              <span className="last">last used · {k.last}{k.expires ? ` · expires ${k.expires}` : ""}</span>
              <div className="actions">
                {k.revoked ? <span className="dash-pill is-err">revoked</span>
                           : <button className="copy-btn" style={{ color: "var(--err)" }}
                                     onClick={() => revoke(k.id)}>revoke</button>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {createOpen && <CreateKeyModal onClose={() => setCreateOpen(false)} onCreate={createKey}/>}
    </DashLayoutShared>
  );
}

function CreateKeyModal({ onClose, onCreate }) {
  const [name, setName] = useDX("");
  const [env, setEnv]   = useDX("live");
  const [scopes, setScopes] = useDX({ extract: true, "schemas:read": true, "ledger:read": false, "webhooks:write": false });
  const flip = (k) => setScopes({ ...scopes, [k]: !scopes[k] });

  return (
    <Modal title="Generate API key" onClose={onClose}
           foot={<>
             <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
             <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                     onClick={() => onCreate({ name: name || "Untitled", env,
                                               scopes: Object.entries(scopes).filter(([_, v]) => v).map(([k]) => k) })}>
               Generate <Icon.Arrow size={12}/>
             </button>
           </>}>
      <div className="field">
        <label>Key name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production · default" autoFocus/>
      </div>
      <div className="field">
        <label>Environment</label>
        <div style={{ display: "flex", gap: 6 }}>
          {["live", "test"].map((e) => (
            <button key={e} className={"filter-chip " + (env === e ? "is-on" : "")}
                    onClick={() => setEnv(e)}>{e}</button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Scopes</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.keys(scopes).map((s) => (
            <label key={s} className="checkbox-row" style={{ alignItems: "center", padding: "8px 10px", border: "1px solid var(--hairline-2)", borderRadius: 7, fontSize: 12.5 }}>
              <input type="checkbox" checked={scopes[s]} onChange={() => flip(s)}/>
              <span className="f-mono" style={{ color: "var(--ink)" }}>{s}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}

// =================================================================
// BILLING
// =================================================================

const INVOICES = [
  { id: "INV-2026-005", period: "May 2026", amount: "$1,284.21", status: "open",   issued: "2026-05-01" },
  { id: "INV-2026-004", period: "Apr 2026", amount: "$1,402.04", status: "paid",   issued: "2026-04-01" },
  { id: "INV-2026-003", period: "Mar 2026", amount: "$1,189.91", status: "paid",   issued: "2026-03-01" },
  { id: "INV-2026-002", period: "Feb 2026", amount: "$1,028.40", status: "paid",   issued: "2026-02-01" },
  { id: "INV-2026-001", period: "Jan 2026", amount: "$884.12",   status: "paid",   issued: "2026-01-01" },
  { id: "INV-2025-012", period: "Dec 2025", amount: "$762.88",   status: "paid",   issued: "2025-12-01" },
];

function BillingPage() {
  const [planModal, setPlanModal] = useDX(false);

  const limits = [
    { k: "Core extractions",     v: 6210,   max: 10000, unit: "" },
    { k: "Storage",              v: 84,     max: 200,   unit: " GB" },
    { k: "Webhook delivery",     v: 4204,   max: 50000, unit: "" },
    { k: "Audit retention",      v: 124,    max: 2557,  unit: " days · 7yr WORM" },
  ];

  return (
    <DashLayoutShared
      current="billing" page="Billing"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Billing" }]}
      actions={<>
        <button className="btn btn-ghost">Download all invoices</button>
        <button className="btn btn-primary" onClick={() => setPlanModal(true)}>Change plan</button>
      </>}>

      <div className="billing-grid">
        <div className="billing-meter">
          <div className="billing-meter-row">
            <div>
              <span className="billing-meter-meta">Current month · May 2026</span>
              <div className="billing-meter-amt">$1,284.21</div>
            </div>
            <span className="dash-pill is-on">Production Ledger · $120/mo</span>
          </div>
          <div className="billing-bars">
            {limits.map((l) => {
              const pct = Math.min(100, (l.v / l.max) * 100);
              return (
                <div key={l.k} className={"billing-bar " + (pct > 80 ? "warn" : "")}>
                  <div className="billing-bar-h">
                    <b>{l.k}</b>
                    <span>{l.v.toLocaleString()} / {l.max.toLocaleString()}{l.unit} · {Math.round(pct)}%</span>
                  </div>
                  <div className="billing-bar-track"><span style={{ width: `${pct}%` }}/></div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px dashed var(--hairline)" }}>
            <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>billing cycle resets jun 1 · 09:00 UTC</span>
            <a className="btn btn-link" href="#">Set spend alerts →</a>
          </div>
        </div>

        <div className="payment-card">
          <div className="glow"/>
          <div className="payment-card-h">
            <b>Acme Industrial Co.</b>
            <span className="brand">Visa</span>
          </div>
          <div className="number">•••• <b>4242</b></div>
          <div className="meta">
            <span>elif@heliotrope.capital</span>
            <span>exp <b>11/28</b></span>
          </div>
        </div>
      </div>

      <section className="dash-sec">
        <header className="dash-sec-head">
          <h3 className="dash-sec-title">Invoice history</h3>
          <div className="dash-sec-actions">
            <span className="filter-chip">year · 2026</span>
            <a className="btn btn-link" href="#">View Stripe portal →</a>
          </div>
        </header>
        <table className="dash-table">
          <thead><tr>
            <th>Invoice</th><th>Period</th><th>Amount</th><th>Status</th><th>Issued</th><th></th>
          </tr></thead>
          <tbody>
            {INVOICES.map((i) => (
              <tr key={i.id} style={{ cursor: "default" }}>
                <td className="mono">{i.id}</td>
                <td>{i.period}</td>
                <td className="mono" style={{ color: "var(--ink)" }}>{i.amount}</td>
                <td>{i.status === "paid" ? <span className="dash-pill is-ok">paid</span>
                                         : <span className="dash-pill is-on">open</span>}</td>
                <td className="mono">{i.issued}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="copy-btn">PDF</button>
                  <button className="copy-btn" style={{ marginLeft: 4 }}>JSON</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {planModal && (
        <Modal title="Change plan" onClose={() => setPlanModal(false)}
               foot={<>
                 <button className="btn btn-ghost" onClick={() => setPlanModal(false)}>Cancel</button>
                 <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}>Confirm change</button>
               </>}>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14 }}>
            Pick a new plan. Your audit ledger is unaffected — only the limits and SLA change. New limits apply from your next billing cycle.
          </p>
          <div className="schema-grid">
            {[
              { name: "Developer Sandbox", price: "$0",   tag: "free forever" },
              { name: "Production Ledger", price: "$120", tag: "current" },
              { name: "Volume · custom",   price: "talk", tag: "≥ 1M docs/mo" },
            ].map((p) => (
              <div key={p.name} className={"schema-card " + (p.tag === "current" ? "is-on" : "")}>
                <div className="schema-card-h">
                  <b>{p.name}</b>
                  <span className="schema-card-tag">{p.tag}</span>
                </div>
                <span style={{ fontFamily: "var(--f-display)", fontSize: 28, fontWeight: 300, letterSpacing: "-0.025em", color: "var(--ink)" }}>{p.price}<span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--muted)" }}>/mo</span></span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </DashLayoutShared>
  );
}

// =================================================================
// REPORTS
// =================================================================

function bars(n, base = 30, jitter = 50, period = 0.4) {
  return Array.from({ length: n }, (_, i) => Math.max(8, base + Math.sin(i * period) * 20 + Math.random() * jitter));
}

function ReportsPage() {
  const [tab, setTab] = useDX("volume");
  const [range, setRange] = useDX("30d");

  const tabs = [
    { id: "volume",   label: "Volume" },
    { id: "latency",  label: "Latency" },
    { id: "cost",     label: "Cost" },
    { id: "errors",   label: "Errors" },
  ];

  const data = {
    volume:  bars(30, 80, 100, 0.3),
    latency: bars(30, 28, 8, 0.6),
    cost:    bars(30, 30, 40, 0.45),
    errors:  bars(30, 4, 8, 0.7),
  };
  const series = data[tab];
  const max = Math.max(...series);
  const total = Math.round(series.reduce((a, b) => a + b, 0));

  return (
    <DashLayoutShared
      current="reports" page="Reports"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Reports" }]}
      actions={<>
        <button className="btn btn-ghost">Export CSV</button>
        <button className="btn btn-ghost">Schedule weekly report</button>
        <button className="btn btn-primary">+ Custom dashboard</button>
      </>}>

      <div className="stat-grid">
        {[
          { k: "Docs processed · 30d",   v: "62,184",   sub: "↑ 18.2% wow" },
          { k: "Avg cost / doc",         v: "$0.0241",  sub: "↓ $0.003 wow" },
          { k: "Pass rate · first try",  v: "94.6%",    sub: "↑ 1.2pp" },
          { k: "Self-correct success",   v: "82.3%",    sub: "of all retries" },
        ].map((s) => (
          <div className="stat-card" key={s.k}>
            <span className="stat-k">{s.k}</span>
            <span className="stat-v">{s.v}</span>
            <span className="stat-sub"><span className="delta up">{s.sub}</span></span>
          </div>
        ))}
      </div>

      <section className="dash-sec">
        <header className="dash-sec-head">
          <div className="report-tabs">
            {tabs.map((t) => (
              <button key={t.id} className={"report-tab " + (tab === t.id ? "is-on" : "")}
                      onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </div>
          <div className="dash-sec-actions">
            {["7d","30d","90d","1y"].map((r) => (
              <button key={r} className={"filter-chip " + (range === r ? "is-on" : "")} onClick={() => setRange(r)}>{r}</button>
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
            <span className="f-mono" style={{ fontSize: 11.5, color: "var(--ok)" }}>↑ 12.4% vs prior 30d</span>
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
                const y = 200 - (v / max) * 180;
                return `${x},${y}`;
              });
              const area = `0,200 ${pts.join(" ")} 600,200`;
              return (
                <>
                  <polygon points={area} fill="url(#r-grad)"/>
                  <polyline points={pts.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
                  {series.map((v, i) => {
                    const x = (i / (series.length - 1)) * 600;
                    const y = 200 - (v / max) * 180;
                    return <circle key={i} cx={x} cy={y} r={i === series.length - 1 ? 4 : 0} fill="var(--accent)"/>;
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

      <div className="dash-two">
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
                ["Invoice",       42, "var(--accent)"],
                ["BankStatement", 28, "oklch(0.6 0.13 250)"],
                ["KYC.W9",        18, "oklch(0.65 0.13 155)"],
                ["Receipt",        8, "oklch(0.7 0.13 25)"],
                ["Other",          4, "var(--muted-2)"],
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
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>p50 · 1.83s &nbsp;&nbsp; p99 · 2.41s</p>
          <svg viewBox="0 0 400 160" style={{ width: "100%", height: 160 }}>
            {(() => {
              const buckets = [4, 12, 28, 60, 92, 88, 62, 38, 22, 14, 8, 5, 3, 2, 1];
              const max = Math.max(...buckets);
              return buckets.map((b, i) => {
                const x = 10 + i * 26;
                const h = (b / max) * 120;
                const p50 = i === 5;
                const p99 = i === 9;
                return (
                  <g key={i}>
                    <rect x={x} y={140 - h} width="20" height={h} rx="2"
                          fill={p99 ? "var(--warn)" : (p50 ? "var(--accent)" : "var(--hairline-strong)")} opacity={p50 || p99 ? 1 : 0.7}/>
                    <text x={x + 10} y="155" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="9" fill="var(--muted-2)">{(i * 0.4).toFixed(1)}s</text>
                  </g>
                );
              });
            })()}
          </svg>
        </div>
      </div>
    </DashLayoutShared>
  );
}

function Donut({ data }) {
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
        const el = <circle key={d.label} cx="70" cy="70" r={radius}
                           fill="none" stroke={d.color} strokeWidth="14"
                           strokeDasharray={dash} strokeDashoffset={-off}
                           transform="rotate(-90 70 70)"/>;
        off += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" fontFamily="var(--f-display)" fontSize="22" fontWeight="500" fill="var(--ink)">
        ${(1284 / 100).toFixed(0)}k
      </text>
      <text x="70" y="84" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="9" fill="var(--muted)" letterSpacing="0.06em">SPEND · 30D</text>
    </svg>
  );
}

// =================================================================
// SETTINGS
// =================================================================

function SettingsPage() {
  const [tab, setTab] = useDX("profile");

  return (
    <DashLayoutShared
      current="settings" page="Settings"
      crumbs={[{ label: "Acme Industrial · prod", href: "#" }, { label: "Settings" }]}>

      <div className="settings-shell">
        <aside className="settings-side">
          <span className="h">account</span>
          <a className={tab === "profile" ? "is-on" : ""} onClick={() => setTab("profile")}><Icon.Shield size={14}/> Profile</a>
          <a className={tab === "security" ? "is-on" : ""} onClick={() => setTab("security")}><Icon.Lock size={14}/> Security</a>
          <a className={tab === "notifications" ? "is-on" : ""} onClick={() => setTab("notifications")}><Icon.Sparkle size={14}/> Notifications</a>
          <span className="h">organization</span>
          <a className={tab === "org" ? "is-on" : ""} onClick={() => setTab("org")}><Icon.Grid size={14}/> Organization</a>
          <a className={tab === "tenants" ? "is-on" : ""} onClick={() => setTab("tenants")}><Icon.Branch size={14}/> Tenants &amp; regions</a>
          <a className={tab === "webhooks" ? "is-on" : ""} onClick={() => setTab("webhooks")}><Icon.Code size={14}/> Webhooks</a>
          <span className="h">danger</span>
          <a className={tab === "danger" ? "is-on" : ""} onClick={() => setTab("danger")} style={{ color: "var(--err)" }}><Icon.Bolt size={14}/> Delete tenant</a>
        </aside>

        <div className="settings-form">
          {tab === "profile" && <SettingsProfile/>}
          {tab === "security" && <SettingsSecurity/>}
          {tab === "notifications" && <SettingsNotifications/>}
          {tab === "org" && <SettingsOrg/>}
          {tab === "tenants" && <SettingsTenants/>}
          {tab === "webhooks" && <SettingsWebhooks/>}
          {tab === "danger" && <SettingsDanger/>}
        </div>
      </div>
    </DashLayoutShared>
  );
}

function SettingsBlock({ title, desc, children, foot }) {
  return (
    <div className="settings-block">
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {children}
      {foot && <div className="settings-foot">{foot}</div>}
    </div>
  );
}

function SettingsProfile() {
  return (
    <SettingsBlock title="Profile" desc="This information appears on case activity and the audit ledger."
                   foot={<><button className="btn btn-ghost">Reset</button><button className="btn btn-primary">Save changes</button></>}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <span className="av is-large" style={{ width: 64, height: 64, fontSize: 18 }}>EK</span>
        <div>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 13.5 }}>Avatar derived from your initials. Upload a custom one — used in the team list and audit log.</p>
          <button className="btn btn-ghost" style={{ marginTop: 8 }}>Upload image</button>
        </div>
      </div>
      <div className="grid">
        <div className="field"><label>First name</label><input defaultValue="Elif"/></div>
        <div className="field"><label>Last name</label><input defaultValue="Karaca"/></div>
        <div className="field"><label>Work email</label><input defaultValue="elif@heliotrope.capital" disabled style={{ background: "var(--bg-alt)", color: "var(--muted)" }}/><span className="hint">Email changes go through your IdP.</span></div>
        <div className="field"><label>Title</label><input defaultValue="Engineering"/></div>
        <div className="field"><label>Timezone</label><select defaultValue="Europe/Istanbul"><option>Europe/Istanbul</option><option>Europe/Berlin</option><option>America/New_York</option><option>Asia/Singapore</option></select></div>
        <div className="field"><label>Locale</label><select defaultValue="en-GB"><option>en-GB</option><option>en-US</option><option>de-DE</option><option>tr-TR</option></select></div>
      </div>
    </SettingsBlock>
  );
}

function SettingsSecurity() {
  return (
    <>
      <SettingsBlock title="Password" desc="Required for fallback when WebAuthn is unavailable."
                     foot={<button className="btn btn-primary">Update password</button>}>
        <div className="grid">
          <div className="field"><label>Current password</label><input type="password"/></div>
          <div className="field"><label>New password</label><input type="password"/></div>
        </div>
      </SettingsBlock>
      <SettingsBlock title="Multi-factor authentication" desc="WebAuthn keys are checked first; TOTP is a fallback.">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--hairline)" }}>
            <div>
              <b style={{ fontSize: 13.5, color: "var(--ink)" }}>YubiKey 5C</b>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>added 2025-08-30 · last used 12s ago</p>
            </div>
            <button className="copy-btn" style={{ color: "var(--err)" }}>remove</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--hairline)" }}>
            <div>
              <b style={{ fontSize: 13.5, color: "var(--ink)" }}>1Password TOTP</b>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>added 2025-01-04 · fallback only</p>
            </div>
            <button className="copy-btn" style={{ color: "var(--err)" }}>remove</button>
          </div>
          <button className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 8 }}>+ Add WebAuthn key</button>
        </div>
      </SettingsBlock>
    </>
  );
}

function SettingsNotifications() {
  const channels = [
    ["Case completes",         "email + slack"],
    ["Schema validation fails","slack"],
    ["Quota >80%",             "email"],
    ["API key revoked",        "email + slack"],
    ["Team member invited",    "email"],
    ["Billing receipts",       "email"],
  ];
  return (
    <SettingsBlock title="Notifications" desc="Choose where each event lands. Audit ledger entries are always immutable; this only controls humans."
                   foot={<button className="btn btn-primary">Save preferences</button>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: 10, overflow: "hidden" }}>
        {channels.map(([k, v]) => (
          <label key={k} style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10, padding: "12px 14px", background: "var(--surface)", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{k}</span>
            <select defaultValue={v} style={{ font: "inherit", padding: "6px 10px", border: "1px solid var(--hairline-2)", borderRadius: 6, background: "var(--surface-2)", fontFamily: "var(--f-mono)", fontSize: 12 }}>
              <option>off</option><option>email</option><option>slack</option><option>email + slack</option><option>webhook</option>
            </select>
          </label>
        ))}
      </div>
    </SettingsBlock>
  );
}

function SettingsOrg() {
  return (
    <SettingsBlock title="Organization" desc="Visible on invoices and the API audit log."
                   foot={<button className="btn btn-primary">Save changes</button>}>
      <div className="grid">
        <div className="field"><label>Legal name</label><input defaultValue="Acme Industrial Co."/></div>
        <div className="field"><label>Tax ID</label><input defaultValue="DE 812 567 894" className="f-mono"/></div>
        <div className="field" style={{ gridColumn: "1 / -1" }}><label>Billing address</label><textarea rows={3} defaultValue={"1 Hudson Yards\nNew York, NY 10001\nUnited States"}/></div>
        <div className="field"><label>Tenant subdomain</label>
          <div className="input-prefix">
            <span>https://</span>
            <input defaultValue="acme"/>
            <span style={{ borderRight: 0, borderLeft: "1px solid var(--hairline-2)" }}>.synapse.dev</span>
          </div>
        </div>
        <div className="field"><label>Industry</label><select defaultValue="manufacturing"><option>manufacturing</option><option>finance</option><option>healthcare</option><option>logistics</option><option>other</option></select></div>
      </div>
    </SettingsBlock>
  );
}

function SettingsTenants() {
  const TENANTS = [
    { id: "org_4f7a",      name: "Acme Industrial · prod", region: "eu-west-1", state: "primary" },
    { id: "org_4f7a_eu2",  name: "Acme Industrial · prod-secondary", region: "eu-central-1", state: "warm-standby" },
    { id: "org_4f7a_test", name: "Acme Industrial · sandbox", region: "us-east-1",  state: "sandbox" },
  ];
  return (
    <SettingsBlock title="Tenants &amp; regions" desc="Each tenant is bound to a region. RLS policies follow the tenant; data never crosses regions.">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {TENANTS.map((t) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto", gap: 12, alignItems: "center", padding: "14px 16px", border: "1px solid var(--hairline)", borderRadius: 10, background: "var(--surface)" }}>
            <span className="region-iso">{t.region.slice(0, 2)}</span>
            <div>
              <b style={{ fontSize: 13.5 }}>{t.name}</b>
              <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 11, fontFamily: "var(--f-mono)" }}>{t.id} · {t.region}</p>
            </div>
            <span className={"dash-pill " + (t.state === "primary" ? "is-on" : "is-ok")}>{t.state}</span>
            <button className="copy-btn">manage</button>
          </div>
        ))}
        <button className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 4 }}>+ Add tenant in another region</button>
      </div>
    </SettingsBlock>
  );
}

function SettingsWebhooks() {
  return (
    <SettingsBlock title="Webhooks" desc="Synapse signs every webhook with your tenant's secret. Failed deliveries retry with exponential backoff for 24h.">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { url: "https://acme.dev/synapse/case-complete", events: 3, last: "200 · 218ms · 12s ago", state: "on" },
          { url: "https://acme.dev/synapse/audit-export",   events: 1, last: "200 · 89ms · 1d ago",   state: "on" },
          { url: "https://acme.dev/synapse/x-legacy",       events: 5, last: "504 · 8m ago · backing off", state: "warn" },
        ].map((w, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 200px 80px", gap: 14, alignItems: "center", padding: "14px 16px", border: "1px solid var(--hairline)", borderRadius: 10, background: "var(--surface)" }}>
            <span className="f-mono" style={{ fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.url}</span>
            <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>{w.events} events</span>
            <span className="f-mono" style={{ fontSize: 11, color: w.state === "warn" ? "var(--warn)" : "var(--muted)" }}>{w.last}</span>
            <span className={"dash-pill " + (w.state === "warn" ? "is-warn" : "is-ok")}>{w.state}</span>
          </div>
        ))}
        <button className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 6 }}>+ Add webhook</button>
      </div>
    </SettingsBlock>
  );
}

function SettingsDanger() {
  return (
    <SettingsBlock title="Delete tenant" desc="This shuts down all pipelines and seals the audit ledger. The ledger remains queryable for 90 days, then is permanently destroyed." foot={null}>
      <div className="settings-block danger-zone" style={{ border: 0, padding: 0, background: "transparent" }}>
        <ul style={{ margin: "0 0 18px", padding: "0 0 0 18px", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.7 }}>
          <li>All workers are drained and shut down within 5 minutes.</li>
          <li>Open invoices remain payable; no further usage is billed.</li>
          <li>Document blobs in object storage are encrypted-zero'd within 24h.</li>
          <li>The audit ledger is sealed (no more appends) and retained for 90 days for legal continuity, then destroyed.</li>
        </ul>
        <div className="field" style={{ maxWidth: 360 }}>
          <label>Type the tenant subdomain to confirm</label>
          <input placeholder="acme" className="f-mono"/>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn-danger">Delete tenant permanently</button>
        </div>
      </div>
    </SettingsBlock>
  );
}

// =================================================================
// ROOT
// =================================================================

const DASHX_PAGES = {
  schemas:  SchemasPage,
  agents:   AgentsPage,
  audit:    AuditPage,
  team:     TeamPage,
  keys:     KeysPage,
  billing:  BillingPage,
  reports:  ReportsPage,
  settings: SettingsPage,
};

const Page = DASHX_PAGES[window.DASHX_PAGE] ?? SchemasPage;
applySharedTokens({ accent: "gold", theme: "light" });
ReactDOM.createRoot(document.getElementById("root")).render(<Page/>);
