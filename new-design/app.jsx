// app.jsx — Synapse orchestrator. Nav · Hero · Console · Bento · Architecture
// · Code · Logo wall · Compliance · Pricing · CTA · Footer · Tweaks.

const { useState: useS, useEffect: useE, useMemo: useM } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "gold",
  "theme": "light",
  "typeSet": "serif-grotesk",
  "heroLayout": "centered",
  "consoleLayout": "three-panel",
  "pricingStyle": "matrix"
}/*EDITMODE-END*/;

// ───────── accent palette options ─────────

const ACCENTS = {
  gold:   { base: "0.78 0.13 78",  ink: "0.45 0.10 76",  soft: "0.96 0.04 82",  glow: "0.78 0.13 78 / 0.22", hex: "#D7A547" },
  teal:   { base: "0.72 0.11 195", ink: "0.40 0.08 200", soft: "0.95 0.03 200", glow: "0.72 0.11 195 / 0.22", hex: "#3BB0B5" },
  velvet: { base: "0.55 0.18 310", ink: "0.36 0.13 308", soft: "0.95 0.03 310", glow: "0.55 0.18 310 / 0.24", hex: "#7C3FB0" },
  forest: { base: "0.60 0.14 155", ink: "0.36 0.11 155", soft: "0.95 0.03 155", glow: "0.60 0.14 155 / 0.22", hex: "#3F9F6B" },
};

const TYPE_SETS = {
  "serif-grotesk": { display: '"Newsreader", Georgia, serif',         sans: '"Geist", ui-sans-serif, system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
  "all-grotesk":   { display: '"Geist", ui-sans-serif, system-ui',     sans: '"Geist", ui-sans-serif, system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
  "editorial":     { display: '"Newsreader", "Charter", serif',        sans: '"Newsreader", Georgia, serif',                  mono: '"JetBrains Mono", ui-monospace, monospace' },
  "mono-heavy":    { display: '"JetBrains Mono", ui-monospace',         sans: '"Geist", ui-sans-serif, system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
};

function applyTokens(t) {
  const a = ACCENTS[t.accent] ?? ACCENTS.gold;
  const ts = TYPE_SETS[t.typeSet] ?? TYPE_SETS["serif-grotesk"];
  const r = document.documentElement;
  r.style.setProperty("--accent",       `oklch(${a.base})`);
  r.style.setProperty("--accent-ink",   `oklch(${a.ink})`);
  r.style.setProperty("--accent-soft",  `oklch(${a.soft})`);
  r.style.setProperty("--accent-glow",  `oklch(${a.glow})`);
  r.style.setProperty("--f-display",    ts.display);
  r.style.setProperty("--f-sans",       ts.sans);
  r.style.setProperty("--f-mono",       ts.mono);
  r.setAttribute("data-theme", t.theme === "dark" ? "dark" : "light");
}

// ───────────────────────── NAV ─────────────────────────

function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a className="nav-brand" href="#top">
          <span className="nav-brand-mark"><Icon.Logo size={16}/></span>
          <span className="nav-brand-name">Synapse</span>
          <span className="nav-brand-ver">v1.4</span>
        </a>
        <ul className="nav-links">
          <li><a href="features.html">Platform</a></li>
          <li><a href="how-it-works.html">How it works</a></li>
          <li><a href="#developers">Developers</a></li>
          <li><a href="pricing.html">Pricing</a></li>
          <li><a href="about.html">About</a></li>
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

// ───────────────────────── HERO ─────────────────────────

function Hero({ layout }) {
  return (
    <section className="hero" data-layout={layout} id="top">
      <div className="hero-bg"/>
      <div className="hero-grid-bg"/>

      <div className="hero-inner">
        {layout === "asymmetric" ? <HeroAsymmetric/> :
         layout === "split"      ? <HeroSplit/>      :
                                   <HeroCentered/>}

        <div className="hero-console-wrap">
          <div className="hero-console-shadow"/>
          <SynapseConsole/>
        </div>
      </div>
    </section>
  );
}

function HeroCentered() {
  return (
    <div className="hero-head">
      <span className="glow-chip">claude-3.5-sonnet · live</span>
      <h1 className="hero-h1">
        Unstructured documents,<br/>
        rendered as <em>typed JSON.</em>
      </h1>
      <p className="hero-sub">
        Synapse is a multi-agent extraction platform that turns invoices, statements
        and scans into validated, tenant-isolated, cryptographically logged JSON —
        without leaving a single retry to chance.
      </p>
      <div className="hero-row">
        <button className="btn btn-primary">Initialize a tenant <Icon.Arrow size={12}/></button>
        <button className="btn btn-ghost">View architecture</button>
      </div>
      <div className="hero-meta">
        <span className="hero-meta-cell"><span className="pip"/>p99 · 2.4s</span>
        <span className="hero-meta-cell"><span className="pip"/>SOC 2 Type II</span>
        <span className="hero-meta-cell"><span className="pip"/>row-level isolation</span>
        <span className="hero-meta-cell"><span className="pip"/>SHA-256 ledger</span>
      </div>
    </div>
  );
}

function HeroAsymmetric() {
  return (
    <div className="hero-head">
      <h1 className="hero-h1">
        Documents in.<br/>
        <em>Typed JSON</em> out.<br/>
        Quietly.
      </h1>
      <div className="hero-sub-stack">
        <span className="glow-chip">claude-3.5-sonnet · live</span>
        <p className="hero-sub">
          A multi-agent extraction platform with row-level tenant isolation and a
          cryptographic audit ledger. Run by the people who have stared at one too
          many half-broken pipelines.
        </p>
        <div className="hero-row">
          <button className="btn btn-primary">Initialize a tenant <Icon.Arrow size={12}/></button>
          <button className="btn btn-ghost">Docs <Icon.ArrowUR size={11}/></button>
        </div>
      </div>
    </div>
  );
}

function HeroSplit() {
  return (
    <div className="hero-head">
      <div className="hero-side">
        <div>// platform.synapse</div>
        <div>uptime · 99.97%</div>
        <div>regions · us · eu · apac</div>
        <div>build · a7c1f0</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <span className="glow-chip">claude-3.5-sonnet · live</span>
        <h1 className="hero-h1">
          Multi-agent<br/>
          <em>document</em><br/>
          intelligence.
        </h1>
        <p className="hero-sub">Parser, Verify and Synthesizer agents — coordinated to turn unstructured documents into validated, tenant-bound JSON.</p>
        <div className="hero-row">
          <button className="btn btn-primary">Initialize a tenant <Icon.Arrow size={12}/></button>
          <button className="btn btn-ghost">Architecture →</button>
        </div>
      </div>
      <div className="hero-side r">
        <div>tenants · 1,284</div>
        <div>docs / day · 4.2M</div>
        <div>p99 · 2.4s</div>
        <div>ledger · sha-256</div>
      </div>
    </div>
  );
}

// ───────────────────────── APP ─────────────────────────

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useE(() => { applyTokens(t); }, [t.accent, t.theme, t.typeSet]);

  // accent option chips for the tweaks panel: pass an array of [hex, hex, hex] palettes
  // Display each as a color name option using TweakRadio of accent names.
  return (
    <>
      <Nav/>
      <main>
        <Hero layout={t.heroLayout}/>
        <Bento/>
        <Architecture/>
        <CodeBlock/>
        <LogoWall/>
        <Compliance/>
        <Pricing/>
        <CtaBanner/>
      </main>
      <Footer/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme"/>
        <TweakRadio label="Mode" value={t.theme}
                    options={["light", "dark"]}
                    onChange={(v) => setTweak("theme", v)}/>
        <TweakColor label="Accent" value={ACCENTS[t.accent]?.hex}
                    options={Object.values(ACCENTS).map(a => a.hex)}
                    onChange={(hex) => {
                      const name = Object.entries(ACCENTS).find(([_, a]) => a.hex === hex)?.[0] ?? "gold";
                      setTweak("accent", name);
                    }}/>
        <TweakSelect label="Accent name" value={t.accent}
                     options={Object.keys(ACCENTS)}
                     onChange={(v) => setTweak("accent", v)}/>

        <TweakSection label="Typography"/>
        <TweakSelect label="Type set" value={t.typeSet}
                     options={Object.keys(TYPE_SETS)}
                     onChange={(v) => setTweak("typeSet", v)}/>

        <TweakSection label="Hero"/>
        <TweakRadio label="Layout" value={t.heroLayout}
                    options={["centered", "asymmetric", "split"]}
                    onChange={(v) => setTweak("heroLayout", v)}/>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
