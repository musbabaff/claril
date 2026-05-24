// sections.jsx — Bento, architecture, code block, logo wall, compliance, pricing, CTA, footer.

const { useState: useStateSec, useEffect: useEffectSec, useMemo: useMemoSec } = React;

// ───────────────────────── BENTO ─────────────────────────

function BentoMicroRLS() {
  // Animated row-level isolation diagram
  return (
    <svg viewBox="0 0 220 120" className="bento-svg" aria-hidden="true">
      <defs>
        <pattern id="rlsgrid" width="11" height="11" patternUnits="userSpaceOnUse">
          <path d="M11 0H0V11" fill="none" stroke="var(--hairline)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect x="0" y="0" width="220" height="120" fill="url(#rlsgrid)"/>
      {[0,1,2,3].map((i) => (
        <g key={i} transform={`translate(20, ${14 + i*24})`}>
          <rect width="180" height="18" rx="3" fill="var(--surface)" stroke="var(--hairline-2)"/>
          <text x="10" y="12" className="bento-mono">tenant_{["acme","north","helio","mira"][i]}</text>
          <rect x="105" y="4" width="68" height="10" fill={i === 1 ? "var(--accent)" : "var(--hairline)"}
                opacity={i === 1 ? "0.9" : "0.7"} rx="2"/>
          {i === 1 && (
            <g>
              <circle cx="175" cy="9" r="3" fill="var(--accent)" opacity="0.9"/>
              <circle cx="175" cy="9" r="6" fill="none" stroke="var(--accent)" opacity="0.4">
                <animate attributeName="r" values="4;9;4" dur="1.8s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite"/>
              </circle>
            </g>
          )}
        </g>
      ))}
      <g transform="translate(82, 100)" className="bento-tag">
        <rect x="-30" y="-9" width="60" height="14" rx="7" fill="var(--surface)" stroke="var(--accent)" />
        <text x="0" y="1" textAnchor="middle" className="bento-mono accent">RLS · ON</text>
      </g>
    </svg>
  );
}

function BentoMicroLedger() {
  return (
    <svg viewBox="0 0 220 120" className="bento-svg" aria-hidden="true">
      {[0,1,2,3,4].map((i) => {
        const y = 14 + i*20;
        return (
          <g key={i}>
            <rect x="20" y={y} width="180" height="14" rx="2" fill="var(--surface)" stroke="var(--hairline-2)"/>
            <circle cx="28" cy={y+7} r="2.5" fill={i < 4 ? "var(--ok)" : "var(--accent)"}/>
            <text x="38"  y={y+10} className="bento-mono">step_{i}</text>
            <text x="84"  y={y+10} className="bento-mono dim">sha256:{(0xabcd12+i*7).toString(16).slice(0,6)}…</text>
            {i < 4 && <path d={`M105 ${y+14} L105 ${y+20}`} stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 2"/>}
          </g>
        );
      })}
    </svg>
  );
}

function BentoMicroParallel() {
  return (
    <svg viewBox="0 0 220 120" className="bento-svg" aria-hidden="true">
      <g>
        {[0,1,2,3].map((i) => {
          const y = 18 + i*22;
          return (
            <g key={i}>
              <rect x="20" y={y-7} width="22" height="14" rx="3" fill="var(--surface)" stroke="var(--hairline-2)"/>
              <text x="31" y={y+3} textAnchor="middle" className="bento-mono">{i+1}</text>
              <line x1="42" y1={y} x2="172" y2={y} stroke="var(--accent)" strokeWidth="1.5"
                    strokeDasharray="4 3" opacity="0.7">
                <animate attributeName="stroke-dashoffset" values="14;0" dur={1.0 + i*0.3 + "s"} repeatCount="indefinite"/>
              </line>
              <rect x={120 + i*8} y={y-3} width="6" height="6" rx="1" fill="var(--accent)" opacity="0.9"/>
              <rect x="174" y={y-7} width="22" height="14" rx="3" fill="var(--accent-soft)"
                    stroke={"color-mix(in oklab, var(--accent) 30%, transparent)"}/>
              <text x="185" y={y+3} textAnchor="middle" className="bento-mono accent">✓</text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function BentoMicroLoop() {
  return (
    <svg viewBox="0 0 220 120" className="bento-svg" aria-hidden="true">
      <g transform="translate(110, 60)">
        <circle r="40" fill="none" stroke="var(--hairline-2)" strokeWidth="1" strokeDasharray="3 3"/>
        <path d="M -40 0 A 40 40 0 0 1 30 -28" fill="none" stroke="var(--accent)" strokeWidth="1.5"
              strokeLinecap="round">
          <animate attributeName="stroke-dasharray" values="0 200;120 200" dur="2.2s" repeatCount="indefinite"/>
        </path>
        <path d="M 30 -28 L 26 -22 M 30 -28 L 36 -24" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        <g transform="translate(-40, 0)">
          <circle r="6" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.2"/>
          <text y="3" textAnchor="middle" className="bento-mono accent" fontSize="7">P</text>
        </g>
        <g transform="translate(0, -40)">
          <circle r="6" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.2"/>
          <text y="3" textAnchor="middle" className="bento-mono" fontSize="7" fill="var(--warn)">!</text>
        </g>
        <g transform="translate(40, 0)">
          <circle r="6" fill="var(--surface)" stroke="var(--ok)" strokeWidth="1.2"/>
          <text y="3" textAnchor="middle" className="bento-mono" fontSize="7" fill="var(--ok)">✓</text>
        </g>
        <text x="0" y="58" textAnchor="middle" className="bento-mono dim">retry on validation_error</text>
      </g>
    </svg>
  );
}

const BENTO = [
  { id: "rls",      title: "Tenant row segregation",      lead: "PostgreSQL RLS policies enforced at the row, not the query.",
    bullet: "ALTER POLICY tenant_isolation USING (org_id = current_setting('app.tenant'))",
    icon: <Icon.Shield/>, Diag: BentoMicroRLS, span: "wide" },
  { id: "ledger",   title: "Cryptographic audit ledger",  lead: "Every step hashes the previous. Tamper a row, every row after breaks.",
    bullet: "sha256(step_n) = H( step_{n-1}  ‖  inputs  ‖  outputs )",
    icon: <Icon.Hash/>, Diag: BentoMicroLedger },
  { id: "parallel", title: "Parallel concurrency",        lead: "Up to 64 documents in flight per tenant, fanned across agent workers.",
    bullet: "asyncio.gather(parser, verify, synth) · backpressure 32",
    icon: <Icon.Grid/>, Diag: BentoMicroParallel },
  { id: "loop",     title: "Double-loop self-correction", lead: "Validation errors are fed back to the agent with the schema delta attached.",
    bullet: "on validation_error → reparse(schema_diff)  · max_retries 3",
    icon: <Icon.Loop/>, Diag: BentoMicroLoop, span: "wide" },
];

function Bento() {
  return (
    <section className="section bento" id="capabilities">
      <div className="container">
        <header className="sec-head">
          <span className="eyebrow"><span className="dot"/>Capabilities</span>
          <h2>Four primitives. <em>One quiet ledger.</em></h2>
          <p>Synapse is built around a small number of guarantees. They compose so you don't have to.</p>
        </header>

        <div className="bento-grid">
          {BENTO.map((b) => (
            <article key={b.id} className={"bento-card " + (b.span || "")}>
              <div className="bento-head">
                <span className="bento-icon">{b.icon}</span>
                <h3>{b.title}</h3>
              </div>
              <p className="bento-lead">{b.lead}</p>
              <div className="bento-diag"><b.Diag/></div>
              <code className="bento-code f-mono">{b.bullet}</code>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── ARCHITECTURE ─────────────────────────

function Architecture() {
  return (
    <section className="section architecture" id="architecture">
      <div className="container">
        <header className="sec-head">
          <span className="eyebrow"><span className="dot"/>Architecture</span>
          <h2>How a document moves through Synapse.</h2>
          <p>From upload to typed JSON in under three seconds, with every step hashed and tenant-bound.</p>
        </header>

        <div className="arch-board">
          <svg viewBox="0 0 1180 360" className="arch-svg" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="var(--muted-2)"/>
              </marker>
              <marker id="ahA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="var(--accent)"/>
              </marker>
              <pattern id="archgrid" width="22" height="22" patternUnits="userSpaceOnUse">
                <path d="M22 0H0V22" fill="none" stroke="var(--hairline)" strokeWidth="0.5"/>
              </pattern>
              <linearGradient id="boxFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--surface)"/>
                <stop offset="100%" stopColor="var(--surface-2)"/>
              </linearGradient>
            </defs>
            <rect width="1180" height="360" fill="url(#archgrid)"/>

            {/* Lane labels */}
            {[
              { y: 56,  label: "client" },
              { y: 152, label: "agent plane" },
              { y: 268, label: "data plane" },
            ].map((l) => (
              <g key={l.label}>
                <text x="14" y={l.y} className="arch-lane">{l.label}</text>
                <line x1="120" y1={l.y - 4} x2="1166" y2={l.y - 4} stroke="var(--hairline)" strokeDasharray="2 4"/>
              </g>
            ))}

            {/* Client → Gateway */}
            <ArchBox x={150} y={36} w={150} h={56} title="SDK · CLI · UI" sub="multipart upload"/>
            <ArchBox x={360} y={36} w={150} h={56} title="Ingress gateway" sub="tenant bind · OAuth"/>

            <ArchArrow d="M300 64 L360 64" />

            {/* Agent plane: parser, verify, synth */}
            <ArchBox x={150} y={130} w={140} h={64} title="Parser" sub="OCR + layout" accent/>
            <ArchBox x={360} y={130} w={140} h={64} title="Verify" sub="schema + cross-field" accent/>
            <ArchBox x={570} y={130} w={140} h={64} title="Synthesizer" sub="typed JSON emit" accent/>
            <ArchBox x={790} y={130} w={170} h={64} title="claude-3.5-sonnet" sub="shared inference pool"/>

            <ArchArrow d="M290 162 L360 162" accent/>
            <ArchArrow d="M500 162 L570 162" accent/>
            <ArchArrow d="M710 162 L790 162" />
            <ArchArrow d="M430 130 Q430 102 290 102 Q220 102 220 130" dash />

            {/* Retry loop: Verify → Parser */}
            <path d="M430 194 Q 430 240 280 240 Q 220 240 220 194" fill="none"
                  stroke="var(--warn)" strokeWidth="1.2" strokeDasharray="4 3" markerEnd="url(#ah)"/>
            <text x="320" y="232" className="arch-label warn">on validation_error → retry</text>

            {/* Data plane */}
            <ArchBox x={150} y={260} w={170} h={64} title="postgres · RLS" sub="tenant_id row scope" dataplane/>
            <ArchBox x={370} y={260} w={170} h={64} title="ledger" sub="sha256 chain · WORM" dataplane/>
            <ArchBox x={590} y={260} w={170} h={64} title="object store" sub="encrypted blobs" dataplane/>
            <ArchBox x={810} y={260} w={170} h={64} title="webhook bus" sub="at-least-once" dataplane/>

            <ArchArrow d="M220 194 L220 260" />
            <ArchArrow d="M430 194 L455 260" />
            <ArchArrow d="M640 194 L675 260" />
            <ArchArrow d="M895 260 L640 194" />
            <ArchArrow d="M640 194 L895 260" />

            {/* Output */}
            <ArchBox x={1010} y={130} w={150} h={64} title="JSON" sub="strict types"/>
            <ArchArrow d="M960 162 L1010 162" accent/>
          </svg>
        </div>

        <div className="arch-legend f-mono">
          <span><span className="lg-sw lg-accent"/>agent step</span>
          <span><span className="lg-sw lg-warn"/>retry edge</span>
          <span><span className="lg-sw lg-data"/>data plane</span>
          <span><span className="lg-sw lg-dash"/>tenant binding</span>
        </div>
      </div>
    </section>
  );
}

function ArchBox({ x, y, w, h, title, sub, accent, dataplane }) {
  const cls = "arch-box " + (accent ? "is-accent " : "") + (dataplane ? "is-data " : "");
  return (
    <g className={cls} transform={`translate(${x}, ${y})`}>
      <rect width={w} height={h} rx="8" fill="url(#boxFill)"
            stroke={accent ? "color-mix(in oklab, var(--accent) 50%, transparent)" :
                    dataplane ? "var(--hairline-strong)" : "var(--hairline-2)"}
            strokeWidth="1"/>
      {accent && (
        <rect x="0" y="0" width={w} height="3" rx="8" fill="var(--accent)"/>
      )}
      <text x="12" y="22" className="arch-title">{title}</text>
      <text x="12" y="40" className="arch-sub">{sub}</text>
    </g>
  );
}
function ArchArrow({ d, accent, dash }) {
  return (
    <path d={d} fill="none"
          stroke={accent ? "var(--accent)" : "var(--muted-2)"}
          strokeWidth="1.2"
          strokeDasharray={dash ? "3 3" : ""}
          markerEnd={accent ? "url(#ahA)" : "url(#ah)"}/>
  );
}

// ───────────────────────── CODE BLOCK ─────────────────────────

const CODE = {
  curl: `curl -X POST https://api.synapse.dev/v1/extract \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "X-Tenant-Id: org_4f7a" \\
  -F "file=@invoice.pdf" \\
  -F 'schema={"type":"Invoice","required":["total","due"]}'`,
  python: `from synapse import Synapse

client = Synapse(api_key=os.environ["SYNAPSE_KEY"])

doc = client.extract(
    file=open("invoice.pdf", "rb"),
    schema=Invoice,            # pydantic model
    tenant="org_4f7a",
    on_validation_error="retry",  # double-loop
)

assert isinstance(doc, Invoice)
print(doc.total, doc.audit.chain_root)`,
  node: `import Synapse from "@synapse/sdk";

const synapse = new Synapse({ apiKey: process.env.SYNAPSE_KEY });

const { data, audit } = await synapse.extract({
  file: fs.createReadStream("invoice.pdf"),
  schema: InvoiceSchema,
  tenant: "org_4f7a",
});

// audit.steps[*].sha256 forms a verifiable chain
console.log(audit.chain_root);`,
};

function CodeBlock() {
  const [tab, setTab] = useStateSec("python");
  const code = CODE[tab];
  return (
    <section className="section code-section" id="developers">
      <div className="container code-split">
        <div className="code-copy">
          <span className="eyebrow"><span className="dot"/>Developers</span>
          <h2 className="f-display">Five lines. <em>Typed.</em></h2>
          <p>One endpoint. Bring your own pydantic, zod, or JSON schema — Synapse refuses to emit anything that doesn't match it.</p>
          <ul className="code-points">
            <li><Icon.Check size={12}/> Strongly typed SDKs (Python · Node · Go · Ruby)</li>
            <li><Icon.Check size={12}/> Tenant header is mandatory; RLS does the rest</li>
            <li><Icon.Check size={12}/> Audit chain root returned on every call</li>
          </ul>
        </div>

        <div className="code-card">
          <div className="code-tabs">
            {Object.keys(CODE).map((k) => (
              <button key={k} className={"code-tab " + (k === tab ? "is-on" : "")}
                      onClick={() => setTab(k)}>
                {k}
              </button>
            ))}
            <span className="code-flex"/>
            <span className="code-lang f-mono">POST /v1/extract</span>
          </div>
          <pre className="code-pre f-mono"><code>{highlight(code)}</code></pre>
        </div>
      </div>
    </section>
  );
}

// Tiny token highlighter — colour-only, no AST
function highlight(src) {
  const lines = src.split("\n");
  return lines.map((line, i) => {
    const tokens = [];
    let rest = line;
    const push = (cls, txt) => tokens.push(<span key={tokens.length} className={cls}>{txt}</span>);

    while (rest.length) {
      let m;
      if ((m = rest.match(/^(#.*)$/))) { push("c-c", m[1]); rest = rest.slice(m[0].length); continue; }
      if ((m = rest.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/))) { push("c-s", m[1]); rest = rest.slice(m[0].length); continue; }
      if ((m = rest.match(/^\b(import|from|const|let|var|await|return|assert|print|new|open)\b/))) { push("c-kw", m[1]); rest = rest.slice(m[0].length); continue; }
      if ((m = rest.match(/^\b(client|synapse|Synapse|os|fs)\b/))) { push("c-id", m[1]); rest = rest.slice(m[0].length); continue; }
      if ((m = rest.match(/^(\.[A-Za-z_][\w]*)/))) { push("c-m", m[1]); rest = rest.slice(m[0].length); continue; }
      if ((m = rest.match(/^(\b\d[\w.]*\b)/))) { push("c-n", m[1]); rest = rest.slice(m[0].length); continue; }
      tokens.push(rest[0]); rest = rest.slice(1);
    }
    return <span key={i}>{tokens}{"\n"}</span>;
  });
}

// ───────────────────────── LOGO WALL ─────────────────────────

const LOGOS = ["Mercator", "Northwind", "Heliotrope", "Quartzly", "Velvet & Co", "Acme Industrial", "Mira Capital"];

function LogoWall() {
  return (
    <section className="section logo-wall">
      <div className="container">
        <p className="logo-eyebrow f-mono">Trusted by engineering teams who refuse to babysit pipelines.</p>
        <div className="logo-row">
          {LOGOS.map((n) => (
            <span key={n} className="logo-word f-display">{n}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── COMPLIANCE STRIP ─────────────────────────

const BADGES = [
  { k: "SOC 2",     v: "Type II",            sub: "annual + continuous" },
  { k: "GDPR",      v: "Art. 28 processor",  sub: "EU + UK DPAs" },
  { k: "HIPAA",     v: "BAA on request",     sub: "PHI workloads" },
  { k: "ISO 27001", v: "certified",          sub: "global ISMS" },
  { k: "Region",    v: "us · eu · apac",     sub: "data residency" },
];

function Compliance() {
  return (
    <section className="section compliance">
      <div className="container">
        <div className="compliance-row">
          {BADGES.map((b) => (
            <div key={b.k} className="compliance-cell">
              <span className="compliance-k f-mono">{b.k}</span>
              <span className="compliance-v">{b.v}</span>
              <span className="compliance-sub f-mono">{b.sub}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── PRICING ─────────────────────────

const PRICING = {
  sandbox: {
    name: "Developer Sandbox", price: "$0", period: "/ month",
    blurb: "Everything you need to wire up Synapse against your own schemas.",
    cta: "Start free",
    features: [
      ["Core extractions",            "100 / month"],
      ["Concurrent pipelines",        "2"],
      ["Schema validation",           "Full"],
      ["Audit ledger",                "30-day retention"],
      ["Postgres RLS isolation",      "Single tenant"],
      ["Webhooks",                    "—"],
      ["Priority routing",            "—"],
      ["SLA",                         "Best effort"],
      ["Support",                     "Community"],
    ],
  },
  production: {
    name: "Production Ledger", price: "$120", period: "/ month",
    blurb: "Designed for teams running real document workloads against real customers.",
    cta: "Deploy production",
    accent: true,
    features: [
      ["Core extractions",            "Unmetered"],
      ["Concurrent pipelines",        "64 — multi-threaded"],
      ["Schema validation",           "Full + draft schemas"],
      ["Audit ledger",                "7-year WORM retention"],
      ["Postgres RLS isolation",      "Per-tenant policies"],
      ["Webhooks",                    "Custom + signed"],
      ["Priority routing",            "p99 < 2.4s"],
      ["SLA",                         "99.95% · uptime credits"],
      ["Support",                     "Shared Slack channel"],
    ],
  },
};

function Pricing() {
  return (
    <section className="section pricing" id="pricing">
      <div className="container">
        <header className="sec-head">
          <span className="eyebrow"><span className="dot"/>Pricing</span>
          <h2>Two plans. <em>Both transparent.</em></h2>
          <p>Sandbox is free forever. Production starts at $120 and never includes a "contact sales" line.</p>
        </header>

        <div className="pricing-grid">
          <PricingCol plan={PRICING.sandbox}/>
          <PricingCol plan={PRICING.production}/>
        </div>

        <p className="pricing-foot f-mono">
          Need volume pricing or on-prem? <a href="#">talk to engineering →</a>
        </p>
      </div>
    </section>
  );
}

function PricingCol({ plan }) {
  return (
    <article className={"pricing-col " + (plan.accent ? "is-accent" : "")}>
      {plan.accent && <span className="pricing-flag f-mono">recommended</span>}
      <header className="pricing-head">
        <h3 className="f-display">{plan.name}</h3>
        <p>{plan.blurb}</p>
        <div className="pricing-price">
          <span className="pricing-amt f-display">{plan.price}</span>
          <span className="pricing-period f-mono">{plan.period}</span>
        </div>
        <button className={"btn " + (plan.accent ? "btn-primary" : "btn-ghost")}>
          {plan.cta} <Icon.Arrow size={12}/>
        </button>
      </header>
      <ul className="pricing-feats">
        {plan.features.map(([k, v]) => (
          <li key={k}>
            <span className="pf-k">{k}</span>
            <span className={"pf-v f-mono " + (v === "—" ? "is-empty" : "")}>{v}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

// ───────────────────────── CTA + FOOTER ─────────────────────────

function CtaBanner() {
  return (
    <section className="section cta-section">
      <div className="container">
        <div className="cta-banner">
          <div className="cta-glow"/>
          <div className="cta-grid"/>
          <div className="cta-body">
            <span className="eyebrow cta-eyebrow"><span className="dot"/>Deploy</span>
            <h2 className="f-display">Ship the secure document container.</h2>
            <p>Initialize a tenant, push a schema, and watch your first document settle into the ledger — usually in under a minute.</p>
            <div className="cta-row">
              <a className="btn btn-primary cta-btn-pri" href="signup.html">
                Initialize a tenant <Icon.Arrow size={12}/>
              </a>
              <a className="btn cta-btn-sec" href="features.html">
                Read the docs <Icon.ArrowUR size={11}/>
              </a>
            </div>
            <code className="cta-code f-mono">
              <span className="c-dim">$</span> npx create-synapse-tenant <span className="c-acc">--region=eu</span>
              <span className="cta-cursor sc-blink">_</span>
            </code>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { h: "Product",  l: [["features.html","Features"], ["how-it-works.html","How it works"], ["dashboard.html","Console"], ["#","API"], ["#","SDKs"], ["#","Changelog"], ["#","Status"]] },
    { h: "Platform", l: [["features.html#architecture","Architecture"], ["features.html","Security"], ["features.html#ledger","Audit ledger"], ["features.html#rls","RLS isolation"]] },
    { h: "Company",  l: [["about.html","About"], ["#","Engineering blog"], ["#","Careers"], ["#","Contact"]] },
    { h: "Legal",    l: [["#","DPA"], ["terms.html","Terms"], ["privacy.html","Privacy"], ["#","Subprocessors"]] },
  ];
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo"><Icon.Logo size={26}/></span>
            <span className="footer-name f-display">Synapse</span>
            <p className="footer-tag">Universal multi-agent document intelligence.</p>
            <p className="footer-meta f-mono">v1.4.2 · build a7c1f0 · all systems normal</p>
          </div>
          {cols.map((c) => (
            <div key={c.h} className="footer-col">
              <span className="footer-h f-mono">{c.h}</span>
              <ul>{c.l.map(([href, txt]) => <li key={txt}><a href={href}>{txt}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="f-mono">© 2026 Synapse Systems Inc. · 1 Hudson Yards, NY</span>
          <span className="f-mono">made with quiet pipelines</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Bento, Architecture, CodeBlock, LogoWall, Compliance, Pricing, CtaBanner, Footer,
});
