// shared.jsx — Shared Nav + Footer + tokens + util used by every page.
// Pages import this BEFORE their own scripts.

const SHARED_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "theme": "light"
}/*EDITMODE-END*/;

const SHARED_ACCENTS = {
  gold:   { base: "0.78 0.13 78",  ink: "0.45 0.10 76",  soft: "0.96 0.04 82",  glow: "0.78 0.13 78 / 0.22", hex: "#D7A547" },
  teal:   { base: "0.72 0.11 195", ink: "0.40 0.08 200", soft: "0.95 0.03 200", glow: "0.72 0.11 195 / 0.22", hex: "#3BB0B5" },
  velvet: { base: "0.55 0.18 310", ink: "0.36 0.13 308", soft: "0.95 0.03 310", glow: "0.55 0.18 310 / 0.24", hex: "#7C3FB0" },
  forest: { base: "0.60 0.14 155", ink: "0.36 0.11 155", soft: "0.95 0.03 155", glow: "0.60 0.14 155 / 0.22", hex: "#3F9F6B" },
};

function applySharedTokens(t) {
  const a = SHARED_ACCENTS[t.accent] ?? SHARED_ACCENTS.gold;
  const r = document.documentElement;
  r.style.setProperty("--accent",      `oklch(${a.base})`);
  r.style.setProperty("--accent-ink",  `oklch(${a.ink})`);
  r.style.setProperty("--accent-soft", `oklch(${a.soft})`);
  r.style.setProperty("--accent-glow", `oklch(${a.glow})`);
  r.setAttribute("data-theme", t.theme === "dark" ? "dark" : "light");
}

// Public-marketing nav (used by /, /features, /how-it-works, /pricing, /about)
function MarketingNav({ current }) {
  const links = [
    { href: "features.html",     label: "Platform"     },
    { href: "how-it-works.html", label: "How it works" },
    { href: "features.html#developers", label: "Developers"   },
    { href: "pricing.html",      label: "Pricing"      },
    { href: "about.html",        label: "About"        },
  ];
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="index.html">
          <span className="nav-brand-mark"><Icon.Logo size={16}/></span>
          <span className="nav-brand-name">Synapse</span>
          <span className="nav-brand-ver">v1.4</span>
        </a>
        <ul className="nav-links">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className={current === l.href ? "is-current" : ""}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-cta">
          <span className="nav-status"><span className="pip"/> all systems normal</span>
          <a className="btn btn-ghost" href="login.html">Sign in</a>
          <a className="btn btn-primary" href="signup.html">Initialize <Icon.Arrow size={12}/></a>
        </div>
      </div>
    </header>
  );
}

// Marketing footer
function MarketingFooter() {
  const cols = [
    { h: "Product",  l: [["features.html","Features"], ["how-it-works.html","How it works"], ["#","Console"], ["#","API"], ["#","SDKs"], ["#","Changelog"], ["#","Status"]] },
    { h: "Platform", l: [["features.html#architecture","Architecture"], ["features.html#security","Security"], ["features.html#ledger","Audit ledger"], ["features.html#rls","RLS isolation"]] },
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

// Shared tweaks panel (theme + accent only — for non-landing pages)
function SharedTweaks({ open = false }) {
  const [t, setTweak] = useTweaks(SHARED_TWEAK_DEFAULTS);
  React.useEffect(() => { applySharedTokens(t); }, [t.accent, t.theme]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme"/>
      <TweakRadio label="Mode" value={t.theme}
                  options={["light", "dark"]}
                  onChange={(v) => setTweak("theme", v)}/>
      <TweakColor label="Accent" value={SHARED_ACCENTS[t.accent]?.hex}
                  options={Object.values(SHARED_ACCENTS).map(a => a.hex)}
                  onChange={(hex) => {
                    const name = Object.entries(SHARED_ACCENTS).find(([_, a]) => a.hex === hex)?.[0] ?? "gold";
                    setTweak("accent", name);
                  }}/>
    </TweaksPanel>
  );
}

// Dashboard sidebar nav (used by /dashboard/*)
function DashboardSidebar({ current, org = "Acme Industrial" }) {
  const groups = [
    {
      h: "workspace",
      items: [
        { id: "dashboard",     label: "Overview",         icon: <Icon.Grid/>,    href: "dashboard.html" },
        { id: "cases",         label: "Cases ledger",     icon: <Icon.Doc/>,     href: "cases.html",     badge: "12" },
        { id: "schemas",       label: "Schemas",          icon: <Icon.Code/>,    href: "schemas.html" },
        { id: "agents",        label: "Agents",           icon: <Icon.Branch/>,  href: "agents.html" },
        { id: "audit",         label: "Audit ledger",     icon: <Icon.Hash/>,    href: "audit.html" },
        { id: "reports",       label: "Reports",          icon: <Icon.Sparkle/>, href: "reports.html" },
      ],
    },
    {
      h: "tenant",
      items: [
        { id: "team",          label: "Team",             icon: <Icon.Shield/>,  href: "team.html" },
        { id: "keys",          label: "API keys",         icon: <Icon.Lock/>,    href: "keys.html" },
        { id: "billing",       label: "Billing",          icon: <Icon.Bolt/>,    href: "billing.html" },
        { id: "settings",      label: "Settings",         icon: <Icon.Loop/>,    href: "settings.html" },
      ],
    },
  ];
  return (
    <aside className="dash-sidebar">
      <div className="dash-side-head">
        <a className="dash-side-brand" href="index.html">
          <span className="nav-brand-mark"><Icon.Logo size={14}/></span>
          <span className="dash-side-brand-name f-display">Synapse</span>
        </a>
        <button className="dash-side-org">
          <span className="dash-side-org-mark f-mono">AI</span>
          <span className="dash-side-org-body">
            <span className="dash-side-org-name">{org}</span>
            <span className="dash-side-org-meta f-mono">org_4f7a · prod</span>
          </span>
          <span className="dash-side-org-caret f-mono">⇅</span>
        </button>
      </div>

      <nav className="dash-side-nav thin-scroll">
        {groups.map((g) => (
          <div key={g.h} className="dash-side-group">
            <span className="dash-side-group-h f-mono">{g.h}</span>
            {g.items.map((i) => (
              <a key={i.id} href={i.href}
                 className={"dash-side-item " + (current === i.id ? "is-current" : "")}>
                <span className="dash-side-icon">{i.icon}</span>
                <span className="dash-side-label">{i.label}</span>
                {i.badge && <span className="dash-side-badge f-mono">{i.badge}</span>}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div className="dash-side-foot">
        <div className="dash-side-meter">
          <div className="dash-side-meter-row">
            <span className="f-mono">extractions · october</span>
            <span className="f-mono">62%</span>
          </div>
          <div className="dash-side-meter-bar"><span style={{ width: "62%" }}/></div>
          <div className="dash-side-meter-row sub f-mono">
            <span>6,210 / 10,000</span>
            <a href="pricing.html">upgrade →</a>
          </div>
        </div>
        <a className="dash-side-user" href="#">
          <span className="dash-side-user-av">EK</span>
          <span className="dash-side-user-body">
            <span>Elif Karaca</span>
            <span className="f-mono">engineering</span>
          </span>
          <Icon.ArrowUR size={11}/>
        </a>
      </div>
    </aside>
  );
}

// Dashboard top bar
function DashboardTopbar({ title, crumbs = [], actions }) {
  return (
    <header className="dash-topbar">
      <div className="dash-crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="dash-crumb-sep f-mono">/</span>}
            {c.href
              ? <a href={c.href} className="dash-crumb">{c.label}</a>
              : <span className="dash-crumb is-current">{c.label}</span>}
          </React.Fragment>
        ))}
      </div>
      {title && <h1 className="dash-title f-display">{title}</h1>}
      <div className="dash-topbar-right">{actions}</div>
    </header>
  );
}

Object.assign(window, {
  SHARED_TWEAK_DEFAULTS, SHARED_ACCENTS, applySharedTokens,
  MarketingNav, MarketingFooter, SharedTweaks,
  DashboardSidebar, DashboardTopbar,
});

// Generic dashboard layout used by every authenticated page.
function DashLayoutShared({ current, page, crumbs, actions, children }) {
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
window.DashLayoutShared = DashLayoutShared;
