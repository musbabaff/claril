// pages.jsx — Marketing/legal pages: Features, How-it-works, Pricing, About, Privacy, Terms.
// Page selected via window.PAGE = 'features' | 'how' | 'pricing' | 'about' | 'privacy' | 'terms'.

// ─── small visual primitive used inside feature/visual cards ───

function MiniRLS() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: "100%", maxWidth: 320, height: "auto" }}>
      <defs>
        <pattern id="rlsg" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14 0H0V14" fill="none" stroke="var(--hairline)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="320" height="220" fill="url(#rlsg)"/>
      {["acme","north","helio","mira","velvet","quartz"].map((t, i) => {
        const y = 16 + i * 30;
        const isActive = i === 1;
        return (
          <g key={t}>
            <rect x="22" y={y} width="276" height="22" rx="4"
                  fill="var(--surface)" stroke={isActive ? "var(--accent)" : "var(--hairline-2)"}
                  strokeWidth="1"/>
            <text x="34" y={y+14} fontFamily="var(--f-mono)" fontSize="10" fill="var(--ink-2)">tenant_{t}</text>
            <rect x="160" y={y+6} width={50 + i * 8} height="10" rx="2"
                  fill={isActive ? "var(--accent)" : "var(--hairline-strong)"}
                  opacity={isActive ? 0.95 : 0.4}/>
            {isActive && (
              <g transform={`translate(290, ${y+11})`}>
                <circle r="3" fill="var(--accent)"/>
                <circle r="7" fill="none" stroke="var(--accent)" opacity="0.4">
                  <animate attributeName="r" values="4;10;4" dur="1.8s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite"/>
                </circle>
              </g>
            )}
          </g>
        );
      })}
      <g transform="translate(160, 200)">
        <rect x="-50" y="-12" width="100" height="20" rx="10" fill="var(--surface)" stroke="var(--accent)"/>
        <text x="0" y="2" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="10" fill="var(--accent-ink)">USING (org = current_tenant)</text>
      </g>
    </svg>
  );
}

function MiniLedger() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: "100%", maxWidth: 320, height: "auto" }}>
      {[0,1,2,3,4,5,6].map((i) => {
        const y = 12 + i * 28;
        return (
          <g key={i}>
            <rect x="22" y={y} width="276" height="20" rx="3"
                  fill="var(--surface)" stroke="var(--hairline-2)"/>
            <circle cx="32" cy={y+10} r="3" fill={i < 6 ? "var(--ok)" : "var(--accent)"}/>
            <text x="44" y={y+13} fontFamily="var(--f-mono)" fontSize="10.5" fill="var(--ink-2)">step_{i}</text>
            <text x="106" y={y+13} fontFamily="var(--f-mono)" fontSize="10.5" fill="var(--muted)">sha256:{(0xa7c1f0 + i * 19).toString(16).slice(0, 6)}…</text>
            {i < 6 && <path d={`M160 ${y+20} L160 ${y+28}`} stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="2 2"/>}
          </g>
        );
      })}
    </svg>
  );
}

function MiniParallel() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: "100%", maxWidth: 320, height: "auto" }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 18 + i * 30;
        return (
          <g key={i}>
            <rect x="20" y={y-9} width="32" height="18" rx="4" fill="var(--surface)" stroke="var(--hairline-2)"/>
            <text x="36" y={y+4} textAnchor="middle" fontFamily="var(--f-mono)" fontSize="10" fill="var(--ink-2)">doc·{i+1}</text>
            <line x1="52" y1={y} x2="270" y2={y} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 4">
              <animate attributeName="stroke-dashoffset" values="20;0" dur={(0.8 + i * 0.18) + "s"} repeatCount="indefinite"/>
            </line>
            <rect x={180 + i * 10} y={y-4} width="8" height="8" rx="1" fill="var(--accent)"/>
            <rect x="270" y={y-9} width="32" height="18" rx="4" fill="var(--accent-soft)" stroke={"color-mix(in oklab, var(--accent) 30%, transparent)"}/>
            <text x="286" y={y+4} textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" fill="var(--accent-ink)">✓</text>
          </g>
        );
      })}
    </svg>
  );
}

function MiniLoop() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: "100%", maxWidth: 320, height: "auto" }}>
      <g transform="translate(160, 110)">
        <circle r="68" fill="none" stroke="var(--hairline-2)" strokeDasharray="4 4"/>
        <path d="M -68 0 A 68 68 0 0 1 48 -48" fill="none" stroke="var(--accent)" strokeWidth="2"
              strokeLinecap="round">
          <animate attributeName="stroke-dasharray" values="0 300;200 300" dur="2.4s" repeatCount="indefinite"/>
        </path>
        <path d="M 50 -50 L 44 -42 M 50 -50 L 58 -44" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
        <g transform="translate(-68, 0)">
          <circle r="14" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.4"/>
          <text y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="12" fill="var(--accent-ink)">P</text>
        </g>
        <g transform="translate(0, -68)">
          <circle r="14" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.4"/>
          <text y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="12" fill="var(--warn)">!</text>
        </g>
        <g transform="translate(68, 0)">
          <circle r="14" fill="var(--surface)" stroke="var(--ok)" strokeWidth="1.4"/>
          <text y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="12" fill="var(--ok)">✓</text>
        </g>
        <text x="0" y="88" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" fill="var(--muted)">on validation_error → reparse</text>
      </g>
    </svg>
  );
}

// ───────────────────────── FEATURES ─────────────────────────

const FEATURE_ROWS = [
  { id: "rls",     eyebrow: "row-level isolation",
    title: <>Tenant boundaries enforced at the <em>database row</em>.</>,
    body:  "Synapse runs every read and write through PostgreSQL Row Level Security policies bound to the request's tenant. No application code can leak across tenants because the database refuses to return rows that aren't theirs.",
    bullets: ["Per-tenant policies, audited monthly", "RLS context attached at connection time", "Tested by chaos-engineering tenant swaps", "Sub-tenants are first-class scopes"],
    Diag: MiniRLS, flip: false },
  { id: "ledger",  eyebrow: "cryptographic ledger",
    title: <>Every step <em>hashes the one before it</em>.</>,
    body:  "Synapse maintains an append-only SHA-256 chain for each document. If a step is altered, every step after it breaks. The chain root is returned on every call so you can verify offline.",
    bullets: ["WORM-mode for 7 years (Production)", "Hash anchored to the previous step's bytes", "Audit ledger export · CSV or JSONL", "Independent verification SDK"],
    Diag: MiniLedger, flip: true },
  { id: "parallel",eyebrow: "concurrency",
    title: <>Up to <em>64 documents in flight</em>, per tenant.</>,
    body:  "The agent pool is partitioned per tenant. A noisy tenant cannot starve a quiet one. Documents are dispatched to Parser, Verify and Synthesizer workers in parallel with explicit backpressure.",
    bullets: ["Backpressure at 32 in flight, configurable", "Per-tenant rate buckets", "Workers run in isolated VMs", "Hot reload of agent code without dropping pipelines"],
    Diag: MiniParallel, flip: false },
  { id: "loop",    eyebrow: "self-correction",
    title: <>A second loop catches what the first <em>fluffed</em>.</>,
    body:  "When Verify rejects a Parser output for a schema mismatch, Synapse re-invokes the Parser with the validation delta attached. Most retries succeed; the ones that don't are flagged for human review with the exact reason.",
    bullets: ["Up to 3 retries with schema delta attached", "Failure modes emit a structured 'review' event", "Configurable per-case", "Retry surfaced in the audit ledger"],
    Diag: MiniLoop, flip: true },
];

function FeaturesPage() {
  return (
    <>
      <MarketingNav current="features.html"/>
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">platform</span>
            <h1>Four guarantees, <em>composed quietly</em>.</h1>
            <p>Synapse is intentionally boring underneath. Boring is what lets you stop watching it.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="feature-rows">
              {FEATURE_ROWS.map((r) => (
                <article key={r.id} id={r.id} className={"feature-row " + (r.flip ? "flip" : "")}>
                  <div className="feature-copy">
                    <span className="eyebrow"><span className="dot"/>{r.eyebrow}</span>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                    <ul>
                      {r.bullets.map((b) => <li key={b}><Icon.Check size={12}/>{b}</li>)}
                    </ul>
                  </div>
                  <div className="feature-visual"><r.Diag/></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CtaBannerLite/>
      </main>
      <MarketingFooter/>
      <SharedTweaks/>
    </>
  );
}

function CtaBannerLite() {
  return (
    <section className="section cta-section">
      <div className="container">
        <div className="cta-banner">
          <div className="cta-glow"/><div className="cta-grid"/>
          <div className="cta-body">
            <span className="eyebrow cta-eyebrow"><span className="dot"/>Try it</span>
            <h2 className="f-display">Initialize a tenant in a minute.</h2>
            <p>The Developer Sandbox is free forever. No credit card.</p>
            <div className="cta-row">
              <a className="btn btn-primary cta-btn-pri" href="signup.html">Initialize a tenant <Icon.Arrow size={12}/></a>
              <a className="btn cta-btn-sec" href="how-it-works.html">How it works <Icon.ArrowUR size={11}/></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── HOW IT WORKS ─────────────────────────

const HOW_STEPS = [
  { n: "01", title: "Upload",
    body: "Send a file via SDK, CLI, or the dashboard's drag-and-drop. The ingress gateway binds it to the tenant scope before it touches the agent plane.",
    visual: <>
      <b>POST /v1/extract</b>
      <span>multipart/form-data · 284 KB</span>
      <span>tenant: <span className="accent">org_4f7a</span></span>
      <span className="ok">✓ bound · sha256:a7c1f0…</span>
    </>
  },
  { n: "02", title: "Parser",
    body: "OCR is performed, the layout is segmented, and the Parser agent (claude-3.5-sonnet) walks the document producing a draft extraction.",
    visual: <>
      <b>parser.run(file)</b>
      <span>ocr · layout · type detection</span>
      <span className="accent">draft → 12 fields</span>
      <span className="ok">✓ 1.84s · 4,860 tokens in</span>
    </>
  },
  { n: "03", title: "Verify",
    body: "The Verify agent checks the draft against your schema, runs cross-field assertions (totals add up, dates are coherent), and emits a delta if anything fails.",
    visual: <>
      <b>verify.match(schema)</b>
      <span>pydantic · cross-field assertions</span>
      <span className="accent">subtotal + tax == total · ok</span>
      <span className="ok">✓ passed in 0.41s</span>
    </>
  },
  { n: "04", title: "Self-correct (if needed)",
    body: "On a validation error, the loop kicks in. Synapse re-invokes the Parser with the delta, up to three times. Most retries succeed; the rest are flagged for review.",
    visual: <>
      <b>retry.with(schema_delta)</b>
      <span>attempt 2 of 3</span>
      <span className="accent">delta: total mismatch</span>
      <span className="ok">✓ corrected · 0.98s</span>
    </>
  },
  { n: "05", title: "Synthesize",
    body: "The Synthesizer agent emits a strictly-typed JSON object — guaranteed to match the schema. If it can't, Synapse refuses to return anything (no half-data).",
    visual: <>
      <b>synthesizer.emit()</b>
      <span>strict · pydantic Invoice</span>
      <span className="accent">{"{ total: 19893.60, ... }"}</span>
      <span className="ok">✓ 1.45s</span>
    </>
  },
  { n: "06", title: "Ledger + webhook",
    body: "Each step is hashed and chained. The document, schema, and audit chain root are written to your tenant's WORM ledger. A signed webhook fires with the final JSON.",
    visual: <>
      <b>ledger.append(chain)</b>
      <span>sha256 · WORM · 7yr</span>
      <span className="accent">root: 7b03ee…fa92</span>
      <span className="ok">✓ webhook delivered</span>
    </>
  },
];

function HowPage() {
  return (
    <>
      <MarketingNav current="how-it-works.html"/>
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">how it works</span>
            <h1>From upload to <em>typed JSON</em>, in six steps.</h1>
            <p>Most documents settle in under three seconds. Every step is hashed and tenant-bound.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="steps-list">
              {HOW_STEPS.map((s) => (
                <article className="step-card" key={s.n}>
                  <div className="step-n">{s.n}</div>
                  <div className="step-body">
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                  <div className="step-visual">{s.visual}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CtaBannerLite/>
      </main>
      <MarketingFooter/>
      <SharedTweaks/>
    </>
  );
}

// ───────────────────────── PRICING (full matrix) ─────────────────────────

const PRICE_MATRIX = {
  groups: [
    { h: "Extraction",
      rows: [
        ["Core extractions / month",       "100",                 "Unmetered"],
        ["Concurrent pipelines",           "2",                   "64 — multi-threaded"],
        ["Avg. p99 latency target",        "Best effort",         "2.4s — credited if missed"],
        ["Schema validation",              "Strict",              "Strict + draft schemas"],
        ["Bring your own schema",          "Yes",                 "Yes"],
        ["Self-correction loop",           "1 retry",             "Up to 3 retries · configurable"],
      ] },
    { h: "Isolation",
      rows: [
        ["Postgres RLS",                   "Single-tenant",       "Per-tenant policies + sub-tenants"],
        ["Dedicated VPC option",           "—",                   "Yes — single-tenant cluster"],
        ["Region pinning",                 "us-east only",        "us · eu · apac"],
        ["Customer-managed KMS",           "—",                   "Yes — AWS / GCP / Azure"],
      ] },
    { h: "Audit",
      rows: [
        ["SHA-256 ledger",                 "30-day retention",    "7-year WORM retention"],
        ["Independent verification SDK",   "—",                   "Yes"],
        ["Step-level cost tracking",       "Yes",                 "Yes"],
        ["Audit export · CSV / JSONL",     "—",                   "Yes"],
      ] },
    { h: "Operations",
      rows: [
        ["Webhooks",                       "—",                   "Custom + signed"],
        ["SLA",                            "Best effort",         "99.95% · uptime credits"],
        ["Support",                        "Community",           "Shared Slack channel"],
        ["Engineering office hours",       "—",                   "Monthly"],
      ] },
  ]
};

function PricingPage() {
  return (
    <>
      <MarketingNav current="pricing.html"/>
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">pricing</span>
            <h1>Transparent. <em>No contact-sales line.</em></h1>
            <p>Two plans. Sandbox is free forever. Production starts at $120 and includes everything you actually need.</p>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="pricing-grid">
              <article className="pricing-col">
                <header className="pricing-head">
                  <h3 className="f-display">Developer Sandbox</h3>
                  <p>Everything you need to wire up Synapse against your own schemas.</p>
                  <div className="pricing-price">
                    <span className="pricing-amt f-display">$0</span>
                    <span className="pricing-period f-mono">/ month</span>
                  </div>
                  <a className="btn btn-ghost" href="signup.html">Start free <Icon.Arrow size={12}/></a>
                </header>
              </article>
              <article className="pricing-col is-accent">
                <span className="pricing-flag f-mono">recommended</span>
                <header className="pricing-head">
                  <h3 className="f-display">Production Ledger</h3>
                  <p>Designed for teams running real document workloads against real customers.</p>
                  <div className="pricing-price">
                    <span className="pricing-amt f-display">$120</span>
                    <span className="pricing-period f-mono">/ month</span>
                  </div>
                  <a className="btn btn-primary" href="signup.html">Deploy production <Icon.Arrow size={12}/></a>
                </header>
              </article>
            </div>

            <div style={{ marginTop: 28, border: "1px solid var(--hairline)", borderRadius: 14, background: "var(--surface)", overflow: "hidden" }}>
              <table className="dash-table" style={{ fontSize: 13.5 }}>
                <thead><tr>
                  <th style={{ width: "40%" }}>Feature</th>
                  <th>Developer Sandbox</th>
                  <th>Production Ledger</th>
                </tr></thead>
                <tbody>
                  {PRICE_MATRIX.groups.map((g) => (
                    <React.Fragment key={g.h}>
                      <tr style={{ background: "var(--surface-2)", cursor: "default" }}>
                        <td colSpan="3" className="mono" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>{g.h}</td>
                      </tr>
                      {g.rows.map(([k, a, b]) => (
                        <tr key={k} style={{ cursor: "default" }}>
                          <td style={{ color: "var(--ink-2)" }}>{k}</td>
                          <td className="mono" style={{ color: a === "—" ? "var(--muted-2)" : "var(--ink)" }}>{a}</td>
                          <td className="mono" style={{ color: "var(--ink)" }}>{b}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="pricing-foot f-mono">
              Need volume pricing, on-prem, or BAA? <a href="#">talk to engineering →</a>
            </p>
          </div>
        </section>

        <CtaBannerLite/>
      </main>
      <MarketingFooter/>
      <SharedTweaks/>
    </>
  );
}

// ───────────────────────── ABOUT ─────────────────────────

function AboutPage() {
  return (
    <>
      <MarketingNav current="about.html"/>
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">about synapse</span>
            <h1>We make pipelines that <em>stop being your problem</em>.</h1>
            <p>Synapse was founded in 2024 by a small team that had spent too many weekends fixing the same document-ingestion stack. We are still small. We intend to stay that way.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="about-grid">
              {[
                { k: "Founded",          v: "2024",     d: "Brooklyn, NY · Berlin, DE" },
                { k: "People",           v: "21",       d: "engineering-led, on purpose" },
                { k: "Tenants live",     v: "1,284",    d: "across 6 regions" },
                { k: "Docs processed",   v: "412M",     d: "since launch · always row-bound" },
                { k: "SOC 2 / ISO 27001",v: "certified",d: "annual + continuous" },
                { k: "Open source",      v: "audit SDK",d: "independent ledger verification" },
              ].map((c) => (
                <div className="about-card" key={c.k}>
                  <span className="k">{c.k}</span>
                  <div className="v">{c.v}</div>
                  <p>{c.d}</p>
                </div>
              ))}
            </div>

            <div style={{ maxWidth: 720, margin: "60px auto", display: "flex", flexDirection: "column", gap: 22 }}>
              <h2 className="f-display" style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>Operating principles</h2>
              {[
                ["Boring infrastructure is a feature.", "Customers don't pay us to chase the new thing. They pay us so document ingestion stops being the thing that wakes them up."],
                ["The ledger is sacred.", "We never edit a step. We never re-order one. If we change a schema, that's a new chain. Predictability beats convenience."],
                ["Tenants are walls, not labels.", "Row-level security is the floor. Anything above it — VPCs, KMS keys, region pins — is a customer choice, never a default we forgot."],
                ["No contact-sales line.", "Pricing is on the website. The SLA is on the website. The DPA is on the website. If a feature isn't, it doesn't exist yet."],
              ].map(([h, b]) => (
                <div key={h}>
                  <h3 style={{ fontFamily: "var(--f-display)", fontSize: 20, fontWeight: 500, margin: "0 0 4px" }}>{h}</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaBannerLite/>
      </main>
      <MarketingFooter/>
      <SharedTweaks/>
    </>
  );
}

// ───────────────────────── LEGAL ─────────────────────────

function LegalPage({ title, sections }) {
  const isPrivacy = title.toLowerCase() === "privacy policy";
  return (
    <>
      <MarketingNav current={isPrivacy ? "privacy.html" : "terms.html"}/>
      <main>
        <div className="legal-wrap">
          <div className="legal-meta">Effective · October 2 2026 · Version 4</div>
          <h1>{title}</h1>
          {sections.map((s, i) => (
            <section key={i}>
              {s.h && <h2>{s.h}</h2>}
              {s.p && <p>{s.p}</p>}
              {s.list && (
                <ul>{s.list.map((x, j) => <li key={j}>{x}</li>)}</ul>
              )}
            </section>
          ))}
        </div>
      </main>
      <MarketingFooter/>
      <SharedTweaks/>
    </>
  );
}

const PRIVACY_SECTIONS = [
  { p: "This privacy policy describes how Synapse Systems Inc. (\"Synapse\", \"we\") processes personal data and tenant content when you use the Synapse platform. It is written by people who have read other people's privacy policies and disliked them. Where a sentence is short, that is intentional." },

  { h: "1 · Data controller and processor" },
  { p: "When you sign up directly with Synapse, we are the data controller for your account. When you process tenant content through Synapse on behalf of your own customers, you are the controller and we are the processor. A Data Processing Addendum is available on every tenant settings page." },

  { h: "2 · What we process" },
  { list: [
      "Account data: name, email, organization name, role, hashed credentials.",
      "Tenant content: documents you upload and the JSON extracted from them.",
      "Operational logs: request IDs, latencies, tenant IDs, audit hashes — never document contents.",
      "Billing data: handled by Stripe; we never see card numbers.",
  ] },

  { h: "3 · Row-level isolation" },
  { p: <>Tenant content is stored in PostgreSQL with row-level security policies bound to your tenant. The database refuses to return rows that aren't yours, even if our application code asked for them. RLS is the floor, not the ceiling — production tenants may pin their own region, KMS key, or a dedicated cluster.</> },

  { h: "4 · Retention" },
  { list: [
      "Sandbox: ledger entries are retained for 30 days, then purged.",
      "Production: ledger entries are retained for 7 years in WORM storage by default.",
      "Documents: retained per the lifecycle you configure on your tenant.",
      "Account data: retained until you delete your account, plus 30 days.",
  ] },

  { h: "5 · Sub-processors" },
  { p: "We use AWS (compute, storage), Anthropic (model inference), Stripe (billing), Sentry (errors), and Twilio (notifications). A current list with regions and roles is at synapse.dev/subprocessors and is updated 30 days before any change." },

  { h: "6 · Your rights" },
  { p: "Depending on your jurisdiction you have rights of access, correction, deletion, restriction, portability, and to object. You can exercise any of them from your tenant settings or by emailing privacy@synapse.dev. We aim to respond within 14 days." },

  { h: "7 · Contact" },
  { p: "Synapse Systems Inc., 1 Hudson Yards, NY 10001. privacy@synapse.dev. Our EU representative is registered in Frankfurt." },
];

const TERMS_SECTIONS = [
  { p: "These terms govern your use of the Synapse platform. By creating a tenant or sending a request to api.synapse.dev, you agree to them. They are written in plain language. Where they have to be precise, they are precise." },

  { h: "1 · The service" },
  { p: "Synapse provides a multi-agent document extraction service that turns unstructured documents into validated, tenant-isolated, cryptographically logged JSON. The service is described at synapse.dev/features and operationally bounded by the published SLA at synapse.dev/sla." },

  { h: "2 · Your account and tenant" },
  { list: [
      "You are responsible for keeping your credentials safe and for everything done with your tenant.",
      "Tenants are bound to a region at creation and cannot move regions.",
      "You may create sub-tenants. Sub-tenants inherit RLS policies from their parent unless explicitly relaxed.",
  ] },

  { h: "3 · Acceptable use" },
  { p: "You agree not to: violate any law, process personal data you don't have a lawful basis for, attempt to bypass the row-level isolation, reverse engineer the agent prompts, or use Synapse to build a competing extraction service." },

  { h: "4 · Fees and billing" },
  { p: "The Developer Sandbox is free up to the limits at synapse.dev/pricing. Production tenants are billed monthly at the rates shown there. Volume pricing is negotiated in writing; nothing in chat or email creates a binding price." },

  { h: "5 · The audit ledger is binding" },
  { p: <>The SHA-256 audit chain attached to every extraction is the canonical record of what happened on the platform. If a dispute arises between us and you about whether a step occurred, the chain root and corresponding ledger entry resolve it. The verification SDK is open source so you don't have to take our word for it.</> },

  { h: "6 · Service level agreement" },
  { p: "Production tenants are covered by a 99.95% uptime SLA, measured monthly. If we miss it, you receive proportional service credits per the published schedule. Sandbox tenants are explicitly best-effort." },

  { h: "7 · Termination" },
  { p: "You can close your tenant from the settings page at any time. We can terminate accounts for unpaid invoices after 30 days written notice, or immediately for breach of the acceptable use clause." },

  { h: "8 · Limitation of liability" },
  { p: "To the extent permitted by law, our aggregate liability is capped at the fees you paid us in the 12 months before the event giving rise to the claim. Indirect damages, lost profits, and lost data are excluded." },

  { h: "9 · Governing law" },
  { p: "These terms are governed by the laws of the State of New York. Disputes go to courts in New York County, unless you are an EU consumer, in which case your local courts apply." },
];

// ───────────────────────── ROOT ─────────────────────────

const PAGES = {
  features: FeaturesPage,
  how:      HowPage,
  pricing:  PricingPage,
  about:    AboutPage,
  privacy:  () => <LegalPage title="Privacy policy" sections={PRIVACY_SECTIONS}/>,
  terms:    () => <LegalPage title="Terms of service" sections={TERMS_SECTIONS}/>,
};

const Page = PAGES[window.PAGE] ?? FeaturesPage;

applySharedTokens({ accent: "gold", theme: "light" });
ReactDOM.createRoot(document.getElementById("root")).render(<Page/>);
