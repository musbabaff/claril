// console.jsx — The interactive Synapse Console widget.
//
// State machine, per document:
//   queued → parser → verify → (retry → parser?) → synthesize → done
// Auto-plays continuously. User can click a file to jump, drop new file to enqueue.

const { useState, useEffect, useRef, useMemo } = React;

// ---------------- Mock dataset ----------------

const MOCK_DOCS = [
  {
    id: "inv-4471",
    kind: "invoice",
    name: "Acme_Invoice_Q3.pdf",
    size: "284 KB",
    pages: 2,
    output: {
      type: "Invoice",
      vendor: "Acme Industrial Co.",
      invoice_no: "AC-2024-04471",
      issued: "2024-09-14",
      due: "2024-10-14",
      currency: "USD",
      subtotal: 18_420.00,
      tax: 1_473.60,
      total: 19_893.60,
      line_items: 7,
    },
    cost: 0.0241,
    tokensIn: 4860,
    tokensOut: 612,
    retried: false,
  },
  {
    id: "stmt-chase",
    kind: "statement",
    name: "Chase_Statement_Sep.pdf",
    size: "1.2 MB",
    pages: 11,
    output: {
      type: "BankStatement",
      account: "****-4992",
      institution: "Chase Sapphire",
      period: "2024-09-01 → 2024-09-30",
      opening_balance: 32_104.55,
      closing_balance: 28_440.18,
      transactions: 42,
      currency: "USD",
    },
    cost: 0.0683,
    tokensIn: 11_240,
    tokensOut: 1_805,
    retried: true,
  },
  {
    id: "po-vendor",
    kind: "invoice",
    name: "Vendor_PO_4471.pdf",
    size: "96 KB",
    pages: 1,
    output: {
      type: "PurchaseOrder",
      vendor: "Northwind Materials",
      po_number: "NW-PO-22841",
      ship_date: "2024-10-02",
      currency: "USD",
      line_items: 3,
      total: 4_812.00,
    },
    cost: 0.0118,
    tokensIn: 2_140,
    tokensOut: 290,
    retried: false,
  },
  {
    id: "rcpt-aws",
    kind: "receipt",
    name: "Receipt_AWS_Oct.pdf",
    size: "48 KB",
    pages: 1,
    output: {
      type: "Receipt",
      vendor: "Amazon Web Services",
      receipt_id: "EUW1-INV-90142",
      period: "2024-10",
      currency: "USD",
      total: 1_244.87,
    },
    cost: 0.0094,
    tokensIn: 1_510,
    tokensOut: 210,
    retried: false,
  },
];

const AGENTS = [
  { id: "parser",      label: "Parser",      desc: "OCR + layout segmentation" },
  { id: "verify",      label: "Verify",      desc: "Schema + cross-field validate" },
  { id: "synthesizer", label: "Synthesizer", desc: "Typed JSON emission" },
];

// Step duration (ms) — used for both auto-play and visual timing
const STEP_MS = { parser: 1900, verify: 1500, retry: 900, synthesizer: 1600, done: 1100 };

// Format USD
const fmt$ = (n) => "$" + n.toFixed(4);
const fmtMoney = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------------- File-kind icon ----------------

function FileIcon({ kind }) {
  if (kind === "invoice")   return <Icon.DocInvoice size={20} />;
  if (kind === "statement") return <Icon.DocBank    size={20} />;
  return <Icon.Doc size={20} />;
}

// ---------------- Audit log line generator ----------------

function makeAuditLines(doc) {
  const h = (seed) => {
    // pseudo-deterministic 6-char hash by seed string
    let x = 0;
    for (const ch of seed) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
    return x.toString(16).padStart(8, "0").slice(0, 8);
  };
  const base = doc.id;
  return [
    { step: "ingest",      hash: h(base + "ingest"),      ms: 12 },
    { step: "parser",      hash: h(base + "parser"),      ms: 1840 },
    ...(doc.retried ? [{ step: "verify.fail", hash: h(base + "fail"), ms: 320, warn: true }] : []),
    ...(doc.retried ? [{ step: "retry",       hash: h(base + "retry"), ms: 980 }] : []),
    { step: "verify",      hash: h(base + "verify"),      ms: 410 },
    { step: "synthesize",  hash: h(base + "synth"),       ms: 1450 },
    { step: "emit",        hash: h(base + "emit"),        ms: 18 },
  ];
}

// ---------------- Upload Queue (left panel) ----------------

function UploadQueue({ docs, activeId, statusFor, onPick, onDrop }) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div className="sc-panel sc-panel-left">
      <header className="sc-panel-head">
        <span className="sc-panel-title">Upload queue</span>
        <span className="sc-panel-meta f-mono">{docs.length} docs</span>
      </header>

      <div
        className={"sc-drop " + (dragOver ? "is-over" : "")}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop && onDrop(); }}
      >
        <Icon.Upload size={16} />
        <span>Drop PDFs, scans &amp; statements</span>
        <span className="sc-drop-hint f-mono">⌘V to paste</span>
      </div>

      <ul className="sc-list thin-scroll">
        {docs.map((d) => {
          const s = statusFor(d.id);
          return (
            <li
              key={d.id}
              className={"sc-file " + (d.id === activeId ? "is-active " : "") + "is-" + s.state}
              onClick={() => onPick(d.id)}
            >
              <span className="sc-file-icon"><FileIcon kind={d.kind} /></span>
              <span className="sc-file-body">
                <span className="sc-file-name">{d.name}</span>
                <span className="sc-file-meta f-mono">{d.size} · {d.pages}p</span>
              </span>
              <span className="sc-file-status">
                {s.state === "done" && <span className="sc-pill sc-pill-ok"><Icon.Check size={10}/> done</span>}
                {s.state === "running" && <span className="sc-pill sc-pill-run"><span className="dot-pulse"/>{s.label}</span>}
                {s.state === "queued" && <span className="sc-pill sc-pill-q">queued</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------- Agent Timeline (center panel) ----------------

function AgentTimeline({ doc, phase, retrying }) {
  // phase: "idle" | "parser" | "verify" | "synthesizer" | "done"
  const idx = { idle: -1, parser: 0, verify: 1, synthesizer: 2, done: 3 }[phase] ?? -1;

  return (
    <div className="sc-panel sc-panel-center">
      <header className="sc-panel-head">
        <span className="sc-panel-title">Agent pipeline</span>
        <span className="sc-panel-meta f-mono">
          <span className="dot-live"/> claude-3.5-sonnet · 3 agents
        </span>
      </header>

      <div className="sc-timeline-wrap">
        {/* Connector line */}
        <svg className="sc-timeline-svg" viewBox="0 0 600 60" preserveAspectRatio="none">
          <line x1="60" y1="30" x2="540" y2="30" stroke="var(--hairline-strong)" strokeWidth="1" strokeDasharray="3 4"/>
          {idx >= 1 && <line x1="60"  y1="30" x2="300" y2="30" className="sc-flow-line" />}
          {idx >= 2 && <line x1="300" y1="30" x2="540" y2="30" className="sc-flow-line" />}
        </svg>

        <ol className="sc-timeline">
          {AGENTS.map((a, i) => {
            const active = idx === i;
            const done = idx > i || phase === "done";
            return (
              <li key={a.id} className={"sc-node " + (active ? "is-active " : "") + (done ? "is-done" : "")}>
                <div className="sc-node-dot">
                  {done ? <Icon.Check size={14}/> : <span className="sc-node-num f-mono">{i+1}</span>}
                </div>
                <div className="sc-node-label">
                  <span className="sc-node-name">{a.label}</span>
                  <span className="sc-node-desc f-mono">{a.desc}</span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Double-loop indicator */}
        <div className={"sc-retry " + (retrying ? "is-on" : "")}>
          <svg viewBox="0 0 200 36" preserveAspectRatio="none">
            <path d="M150 12 Q 100 -10 50 12" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3"/>
            <path d="M52 8 L48 12 L52 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
          <span className="f-mono">double-loop · schema mismatch → reparse</span>
        </div>
      </div>

      {/* Live log */}
      <div className="sc-log thin-scroll">
        {doc && makeAuditLines(doc).slice(0, Math.max(0, idx + 1 + (retrying ? 1 : 0))).map((l, i) => (
          <div key={i} className={"sc-log-line " + (l.warn ? "is-warn" : "")}>
            <span className="sc-log-step f-mono">{l.step.padEnd(13)}</span>
            <span className="sc-log-hash f-mono">sha256:{l.hash}…</span>
            <span className="sc-log-ms f-mono tabular">{l.ms}ms</span>
            {l.warn ? <span className="sc-log-tag f-mono">retry</span> : <Icon.Check size={11}/>}
          </div>
        ))}
        <div className="sc-log-cursor f-mono">
          <span>›</span>
          <span className="sc-blink">_</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- JSON Output + Cost (right panel) ----------------

function JsonViewer({ doc, phase, animatedCost, totalCost, runs }) {
  const showJson = phase === "done";
  const obj = doc?.output ?? {};

  return (
    <div className="sc-panel sc-panel-right">
      <header className="sc-panel-head">
        <span className="sc-panel-title">Typed output</span>
        <span className="sc-panel-meta f-mono">JSON · strict</span>
      </header>

      <div className="sc-json thin-scroll">
        {showJson ? (
          <pre className="f-mono sc-json-pre">
            <span className="j-p">{"{"}</span>{"\n"}
            {Object.entries(obj).map(([k, v], i) => {
              const isStr = typeof v === "string";
              const isNum = typeof v === "number";
              return (
                <span key={k} className="sc-json-line">
                  {"  "}
                  <span className="j-k">"{k}"</span><span className="j-p">: </span>
                  {isStr && <span className="j-s">"{String(v)}"</span>}
                  {isNum && <span className="j-n">{Number.isInteger(v) ? v : v.toFixed(2)}</span>}
                  <span className="j-p">{i < Object.entries(obj).length - 1 ? "," : ""}</span>{"\n"}
                </span>
              );
            })}
            <span className="j-p">{"}"}</span>
          </pre>
        ) : (
          <div className="sc-json-skel">
            <span className="f-mono sc-skel-label">awaiting Synthesizer…</span>
            <div className="sc-skel-line w70"/>
            <div className="sc-skel-line w55"/>
            <div className="sc-skel-line w80"/>
            <div className="sc-skel-line w40"/>
            <div className="sc-skel-line w60"/>
          </div>
        )}
      </div>

      {/* Cost meter */}
      <div className="sc-meter">
        <div className="sc-meter-row">
          <span className="sc-meter-k f-mono">API · usd</span>
          <span className="sc-meter-v ticker">{fmt$(animatedCost)}</span>
        </div>
        <div className="sc-meter-bar">
          <span style={{ width: `${Math.min(100, (animatedCost / 0.08) * 100)}%` }}/>
        </div>
        <div className="sc-meter-grid f-mono">
          <span><b className="ticker">{(doc?.tokensIn ?? 0).toLocaleString("en-US")}</b><em>tokens in</em></span>
          <span><b className="ticker">{(doc?.tokensOut ?? 0).toLocaleString("en-US")}</b><em>tokens out</em></span>
          <span><b className="ticker">{runs}</b><em>session runs</em></span>
        </div>
        <div className="sc-meter-row sc-meter-foot">
          <span className="sc-meter-k f-mono">session total</span>
          <span className="sc-meter-v ticker">{fmt$(totalCost)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------- The console (orchestrator) ----------------

function SynapseConsole() {
  const [docs] = useState(MOCK_DOCS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [retrying, setRetrying] = useState(false);
  const [completed, setCompleted] = useState(new Set()); // doc ids
  const [sessionCost, setSessionCost] = useState(0);
  const [animatedCost, setAnimatedCost] = useState(0);
  const [runs, setRuns] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const active = docs[activeIdx];

  // Cost animator (during a run, ramp from 0 → doc.cost)
  useEffect(() => {
    if (phase === "idle") { setAnimatedCost(0); return; }
    if (phase === "done") { setAnimatedCost(active.cost); return; }
    let t0 = performance.now();
    let raf;
    const animate = (now) => {
      const dt = (now - t0) / 1000;
      const target = active.cost * (phase === "parser" ? 0.4 : phase === "verify" ? 0.6 : 0.95);
      setAnimatedCost((c) => c + (target - c) * Math.min(1, dt * 0.4));
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase, active]);

  // Main step driver
  useEffect(() => {
    if (paused) return;
    clearTimeout(timerRef.current);
    const next = (ms, fn) => { timerRef.current = setTimeout(fn, ms); };

    if (phase === "idle") {
      next(700, () => setPhase("parser"));
    } else if (phase === "parser") {
      next(STEP_MS.parser, () => {
        if (active.retried) { setRetrying(true); next(STEP_MS.retry, () => { setRetrying(false); setPhase("verify"); }); }
        else setPhase("verify");
      });
    } else if (phase === "verify") {
      next(STEP_MS.verify, () => setPhase("synthesizer"));
    } else if (phase === "synthesizer") {
      next(STEP_MS.synthesizer, () => setPhase("done"));
    } else if (phase === "done") {
      // mark complete, accumulate cost, advance to next doc
      setCompleted((s) => { const n = new Set(s); n.add(active.id); return n; });
      setSessionCost((c) => c + active.cost);
      setRuns((r) => r + 1);
      next(STEP_MS.done, () => {
        const nextIdx = (activeIdx + 1) % docs.length;
        // if we've come full loop, reset completed for re-run
        if (nextIdx === 0) setCompleted(new Set());
        setActiveIdx(nextIdx);
        setPhase("idle");
      });
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, activeIdx, paused]);

  const statusFor = (id) => {
    if (completed.has(id)) return { state: "done" };
    if (id === active.id) {
      if (phase === "idle") return { state: "queued" };
      if (phase === "parser") return { state: "running", label: "parsing" };
      if (phase === "verify") return { state: "running", label: retrying ? "retrying" : "verifying" };
      if (phase === "synthesizer") return { state: "running", label: "emitting" };
      if (phase === "done") return { state: "done" };
    }
    return { state: "queued" };
  };

  const pickDoc = (id) => {
    const idx = docs.findIndex((d) => d.id === id);
    if (idx === -1) return;
    setActiveIdx(idx);
    setPhase("idle");
    setRetrying(false);
  };

  return (
    <div className="synapse-console">
      <div className="sc-chrome">
        <div className="sc-chrome-l">
          <span className="sc-tl"><span/><span/><span/></span>
          <span className="sc-chrome-path f-mono">synapse-console — production · org_4f7a</span>
        </div>
        <div className="sc-chrome-r f-mono">
          <span className="sc-chrome-pill"><Icon.Shield size={11}/> RLS · tenant_acme</span>
          <button className="sc-chrome-btn" onClick={() => setPaused((p) => !p)}>
            {paused ? "▶ run" : "❚❚ pause"}
          </button>
        </div>
      </div>

      <div className="sc-grid">
        <UploadQueue docs={docs} activeId={active.id} statusFor={statusFor} onPick={pickDoc} onDrop={() => {}}/>
        <AgentTimeline doc={active} phase={phase} retrying={retrying} />
        <JsonViewer doc={active} phase={phase} animatedCost={animatedCost} totalCost={sessionCost} runs={runs}/>
      </div>
    </div>
  );
}

window.SynapseConsole = SynapseConsole;
