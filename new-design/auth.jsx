// auth.jsx — Login / Signup / Forgot password pages.
// Page selected via window.AUTH_PAGE = 'login' | 'signup' | 'forgot'.

const { useState: useStateA, useEffect: useEffectA } = React;

function GoogleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>; }
function GithubIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.34-1.75-1.34-1.75-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5.99.1-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.28 1.23a11.4 11.4 0 016 0c2.27-1.55 3.28-1.23 3.28-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.83.58A12 12 0 0012 .3"/></svg>; }

function AsideEditorial({ stats }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-glow"/>
      <div className="auth-aside-grid"/>
      <div className="auth-aside-content">
        <a className="auth-aside-brand" href="index.html">
          <span className="nav-brand-mark"><Icon.Logo size={14}/></span>
          <span>Synapse</span>
        </a>
        <blockquote className="auth-aside-quote">
          "Two weeks after Synapse went live we shut down the <em>invoice triage room</em>.
          The pipeline never lost a tenant boundary. It just kept running."
        </blockquote>
        <div className="auth-aside-attr">
          <span className="auth-aside-attr-av">TK</span>
          <span className="auth-aside-attr-body">
            <b>Tomas Köhler</b>
            <span>VP Engineering · Heliotrope Capital</span>
          </span>
        </div>
      </div>
      <div className="auth-aside-stats">
        {stats.map((s) => (
          <div className="auth-aside-stat" key={s.k}>
            <span className="auth-aside-stat-k">{s.k}</span>
            <span className="auth-aside-stat-v">{s.v}</span>
            <span className="auth-aside-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function AuthShell({ children }) {
  return (
    <div className="auth-page">
      <AsideEditorial stats={[
        { k: "p99 latency",   v: "2.4s",   sub: "claude-3.5-sonnet" },
        { k: "tenants live",  v: "1,284",  sub: "row-bound" },
        { k: "docs / day",    v: "4.2M",   sub: "+18% wow" },
        { k: "ledger root",   v: "sha-256",sub: "a7c1…f0" },
      ]}/>
      <div className="auth-form-col">
        <header className="auth-form-head">
          <a className="nav-brand" href="index.html">
            <span className="nav-brand-mark"><Icon.Logo size={14}/></span>
            <span className="nav-brand-name">Synapse</span>
          </a>
          <span className="nav-status"><span className="pip"/> systems normal</span>
        </header>
        <div className="auth-form-body">{children}</div>
        <footer className="auth-form-foot">
          <span>© 2026 Synapse Systems</span>
          <span><a href="terms.html">Terms</a> · <a href="privacy.html">Privacy</a> · <a href="#">Status</a></span>
        </footer>
      </div>
    </div>
  );
}

// ───────────────────────── LOGIN ─────────────────────────
function LoginPage() {
  const [email, setEmail] = useStateA("");
  const [pw, setPw]   = useStateA("");
  const [pwError, setPwError] = useStateA(false);

  return (
    <AuthShell>
      <span className="glow-chip auth-eyebrow">welcome back</span>
      <h1 className="auth-h1">Sign in to <em>Synapse</em></h1>
      <p className="auth-sub">Continue with your tenant's identity provider, or use your email.</p>

      <div className="auth-sso">
        <button><GoogleIcon/> Google</button>
        <button><GithubIcon/> GitHub</button>
      </div>
      <div className="auth-divider">or email</div>

      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setPwError(pw.length < 6); }}>
        <div className="field">
          <label>Work email</label>
          <input type="email" placeholder="you@company.com" value={email}
                 onChange={(e) => setEmail(e.target.value)} required/>
        </div>
        <div className="field">
          <label>
            <span>Password</span>
            <a href="forgot-password.html">forgot?</a>
          </label>
          <input type="password" placeholder="••••••••••••" value={pw}
                 className={pwError ? "is-error" : ""}
                 onChange={(e) => { setPw(e.target.value); setPwError(false); }}/>
          {pwError && <span className="err"><Icon.Bolt size={11}/> Password must be at least 6 characters.</span>}
        </div>
        <label className="checkbox-row">
          <input type="checkbox" defaultChecked/>
          <span>Remember this device for 30 days. Synapse will require re-auth for production tenants.</span>
        </label>
        <button className="auth-submit" type="submit">
          Sign in <Icon.Arrow size={12}/>
        </button>
      </form>

      <p className="auth-alt">
        First time here? <a href="signup.html">Initialize a tenant →</a>
      </p>
    </AuthShell>
  );
}

// ───────────────────────── SIGNUP ─────────────────────────
function SignupPage() {
  const [step, setStep] = useStateA(0);
  const [form, setForm] = useStateA({
    org: "", subdomain: "", email: "", name: "", pw: "", region: "eu-west-1",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <AuthShell>
      <span className="glow-chip auth-eyebrow">initialize a tenant</span>
      <h1 className="auth-h1">Spin up a <em>Synapse tenant</em></h1>
      <p className="auth-sub">Three steps. Your data plane is provisioned with row-level isolation from the first byte.</p>

      <div className="signup-steps f-mono">
        {["organization", "operator", "region"].map((s, i) => (
          <span key={s} className={"signup-step " + (i === step ? "is-on " : "") + (i < step ? "is-done" : "")}>
            <span className="signup-step-n">{i < step ? "✓" : i + 1}</span>
            <span>{s}</span>
          </span>
        ))}
      </div>

      <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setStep(Math.min(2, step + 1)); }}>
        {step === 0 && <>
          <div className="field">
            <label>Organization name</label>
            <input placeholder="Heliotrope Capital" value={form.org} onChange={set("org")} required autoFocus/>
            <span className="hint">Shown on invoices and the API audit log.</span>
          </div>
          <div className="field">
            <label>Tenant subdomain</label>
            <div className="input-prefix">
              <span>https://</span>
              <input placeholder="heliotrope" value={form.subdomain} onChange={set("subdomain")}/>
              <span style={{ borderRight: 0, borderLeft: "1px solid var(--hairline-2)" }}>.synapse.dev</span>
            </div>
            <span className="hint">URL-safe characters only. Used in your Postgres RLS scope.</span>
          </div>
        </>}
        {step === 1 && <>
          <div className="field">
            <label>Your name</label>
            <input placeholder="Elif Karaca" value={form.name} onChange={set("name")} required/>
          </div>
          <div className="field">
            <label>Work email</label>
            <input type="email" placeholder="elif@heliotrope.capital" value={form.email} onChange={set("email")} required/>
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" placeholder="at least 12 characters" value={form.pw} onChange={set("pw")} required/>
            <span className="hint">A 12-char minimum. WebAuthn enrollment is offered after signup.</span>
          </div>
        </>}
        {step === 2 && <>
          <div className="field">
            <label>Data residency region</label>
            <div className="region-grid">
              {[
                { id: "us-east-1",   label: "US East",  city: "Northern Virginia", iso: "us" },
                { id: "eu-west-1",   label: "EU West",  city: "Frankfurt",         iso: "eu" },
                { id: "ap-south-1",  label: "Asia Pacific", city: "Singapore",     iso: "ap" },
              ].map((r) => (
                <label key={r.id} className={"region-card " + (form.region === r.id ? "is-on" : "")}>
                  <input type="radio" name="region" value={r.id}
                         checked={form.region === r.id}
                         onChange={() => setForm({ ...form, region: r.id })}/>
                  <span className="region-iso f-mono">{r.iso}</span>
                  <span className="region-label">{r.label}</span>
                  <span className="region-city f-mono">{r.city}</span>
                </label>
              ))}
            </div>
            <span className="hint">Documents and ledger entries never leave this region. Cannot be changed after provisioning.</span>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" required/>
            <span>I agree to the <a href="terms.html">Terms of Service</a> and the <a href="#">Data Processing Addendum</a>.</span>
          </label>
        </>}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          {step > 0 && <button type="button" className="btn btn-ghost"
                                style={{ height: 44, flex: 1 }}
                                onClick={() => setStep(step - 1)}>← Back</button>}
          <button className="auth-submit" type="submit" style={{ flex: 2 }}>
            {step < 2 ? "Continue" : "Provision tenant"} <Icon.Arrow size={12}/>
          </button>
        </div>
      </form>

      <p className="auth-alt">
        Already have a tenant? <a href="login.html">Sign in →</a>
      </p>
    </AuthShell>
  );
}

// ───────────────────────── FORGOT ─────────────────────────
function ForgotPage() {
  const [email, setEmail] = useStateA("");
  const [sent, setSent]   = useStateA(false);

  return (
    <AuthShell>
      <span className="glow-chip auth-eyebrow">recover access</span>
      <h1 className="auth-h1">{sent ? <>Check your <em>inbox</em>.</> : <>Reset your <em>password</em></>}</h1>
      <p className="auth-sub">
        {sent
          ? "If an account exists for that email, we've sent a 15-minute recovery link. Check spam if you don't see it."
          : "Enter the email tied to your operator profile. We'll send a single-use recovery link valid for 15 minutes."}
      </p>

      {!sent ? (
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
          <div className="field">
            <label>Work email</label>
            <input type="email" placeholder="you@company.com" value={email}
                   onChange={(e) => setEmail(e.target.value)} required autoFocus/>
          </div>
          <button className="auth-submit" type="submit">
            Send recovery link <Icon.Arrow size={12}/>
          </button>
        </form>
      ) : (
        <div className="forgot-confirm">
          <div className="forgot-confirm-card">
            <Icon.Check size={16}/>
            <div>
              <b>{email || "your address"}</b>
              <span className="f-mono">expires in 15:00</span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ height: 40 }}
                  onClick={() => setSent(false)}>← Try a different email</button>
        </div>
      )}

      <p className="auth-alt">
        Remember it now? <a href="login.html">Back to sign in →</a>
      </p>
    </AuthShell>
  );
}

const PAGES = { login: LoginPage, signup: SignupPage, forgot: ForgotPage };
const Page  = PAGES[window.AUTH_PAGE] ?? LoginPage;

// Token application
applySharedTokens({ accent: "gold", theme: "light" });

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <Page/>
    <SharedTweaks/>
  </>
);
