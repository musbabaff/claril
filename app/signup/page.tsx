'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/client';

const AUTH_STATS = [
  { k: 'p99 latency',  v: '2.4s',   sub: 'claude-3.5-sonnet' },
  { k: 'tenants live', v: '1,284',  sub: 'row-bound' },
  { k: 'docs / day',   v: '4.2M',   sub: '+18% wow' },
  { k: 'ledger root',  v: 'sha-256', sub: 'a7c1…f0' },
];

function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-glow" />
      <div className="auth-aside-grid" />
      <div className="auth-aside-content">
        <Link className="auth-aside-brand" href="/">
          <span className="nav-brand-mark"><Icon.Logo size={14} /></span>
          <span>Claril</span>
        </Link>
        <blockquote className="auth-aside-quote">
          &ldquo;Two weeks after Claril went live we shut down the <em>invoice triage room</em>.
          The pipeline never lost a tenant boundary. It just kept running.&rdquo;
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
        {AUTH_STATS.map(s => (
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

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <AuthAside />
      <div className="auth-form-col">
        <header className="auth-form-head">
          <Link className="nav-brand" href="/">
            <span className="nav-brand-mark"><Icon.Logo size={14} /></span>
            <span className="nav-brand-name">Claril</span>
          </Link>
          <span className="nav-status"><span className="pip" /> systems normal</span>
        </header>
        <div className="auth-form-body">{children}</div>
        <footer className="auth-form-foot">
          <span>© 2026 Claril</span>
          <span>
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <a href="#">Status</a>
          </span>
        </footer>
      </div>
    </div>
  );
}

const REGIONS = [
  { id: 'us-east-1',  label: 'US East',      city: 'Northern Virginia', iso: 'us' },
  { id: 'eu-west-1',  label: 'EU West',      city: 'Frankfurt',         iso: 'eu' },
  { id: 'ap-south-1', label: 'Asia Pacific',  city: 'Singapore',         iso: 'ap' },
];

const STEPS = [
  { t: 'organization', d: 'org details' },
  { t: 'operator',     d: 'your details' },
  { t: 'region',       d: 'data residency' },
];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    org: '', subdomain: '', email: '', name: '', pw: '', region: 'eu-west-1',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) {
      if (step === 0) {
        if (!form.org.trim()) {
          setErrorMsg('Organization name is required.');
          return;
        }
        const subPattern = /^[a-zA-Z0-9-]+$/;
        if (!form.subdomain.trim()) {
          setErrorMsg('Tenant subdomain is required.');
          return;
        }
        if (!subPattern.test(form.subdomain)) {
          setErrorMsg('Subdomain must contain only alphanumeric characters and hyphens.');
          return;
        }
      }
      if (step === 1) {
        if (form.pw.length < 12) {
          setErrorMsg('Password must be at least 12 characters long.');
          return;
        }
      }
      setErrorMsg('');
      setStep(s => s + 1);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.pw,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: form.name,
            organization_name: form.org,
            subdomain: form.subdomain,
            region: form.region,
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        // Create profile public row
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: form.name,
            organization_name: form.org,
            role: 'analyst',
          });
        if (profileError) {
          console.warn("Profile table insert failed (might be auto-created by trigger):", profileError.message);
        }

        if (data.session) {
          window.location.href = '/dashboard';
        } else {
          alert('Provisioning complete! Please check your email to confirm your account and log in.');
          window.location.href = '/login';
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Sign up error:', message);
      setErrorMsg(message || 'An error occurred during tenant provisioning.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <span className="glow-chip auth-eyebrow">initialize a tenant</span>
      <h1 className="auth-h1">Spin up a <em>Claril tenant</em></h1>
      <p className="auth-sub">Three steps. Your data plane is provisioned with row-level isolation from the first byte.</p>

      <div className="signup-steps f-mono">
        {STEPS.map((s, i) => (
          <span key={s.t} className={'signup-step ' + (i === step ? 'is-on ' : '') + (i < step ? 'is-done' : '')}>
            <span className="signup-step-n">{i < step ? '✓' : i + 1}</span>
            <span>{s.t}</span>
          </span>
        ))}
      </div>

      {errorMsg && (
        <div className="err" style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--err)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Icon.Bolt size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form className="auth-form" id="signup-form" onSubmit={handleSubmit}>
        {step === 0 && (
          <>
            <div className="field">
              <label htmlFor="signup-org">Organization name</label>
              <input id="signup-org" placeholder="Heliotrope Capital" value={form.org} onChange={set('org')} required autoFocus disabled={loading} />
              <span className="hint">Shown on invoices and the API audit log.</span>
            </div>
            <div className="field">
              <label htmlFor="signup-subdomain">Tenant subdomain</label>
              <div className="input-prefix">
                <span>https://</span>
                <input id="signup-subdomain" placeholder="heliotrope" value={form.subdomain} onChange={set('subdomain')} required disabled={loading} />
                <span style={{ borderRight: 0, borderLeft: '1px solid var(--hairline-2)' }}>.claril.dev</span>
              </div>
              <span className="hint">URL-safe characters only. Used in your Postgres RLS scope.</span>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="field">
              <label htmlFor="signup-name">Your name</label>
              <input id="signup-name" placeholder="Elif Karaca" value={form.name} onChange={set('name')} required autoFocus disabled={loading} />
            </div>
            <div className="field">
              <label htmlFor="signup-email">Work email</label>
              <input id="signup-email" type="email" placeholder="elif@heliotrope.capital" value={form.email} onChange={set('email')} required disabled={loading} />
            </div>
            <div className="field">
              <label htmlFor="signup-pw">Password</label>
              <input id="signup-pw" type="password" placeholder="at least 12 characters" value={form.pw} onChange={set('pw')} required disabled={loading} />
              <span className="hint">A 12-char minimum. WebAuthn enrollment is offered after signup.</span>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="field">
              <label>Data residency region</label>
              <div className="region-grid">
                {REGIONS.map(r => (
                  <label
                    key={r.id}
                    htmlFor={`region-${r.id}`}
                    className={'region-card ' + (form.region === r.id ? 'is-on' : '')}
                  >
                    <input
                      type="radio" id={`region-${r.id}`} name="region" value={r.id}
                      checked={form.region === r.id}
                      onChange={() => setForm(f => ({ ...f, region: r.id }))}
                      disabled={loading}
                    />
                    <span className="region-iso f-mono">{r.iso}</span>
                    <span className="region-label">{r.label}</span>
                    <span className="region-city f-mono">{r.city}</span>
                  </label>
                ))}
              </div>
              <span className="hint">Documents and ledger entries never leave this region. Cannot be changed after provisioning.</span>
            </div>
            <label className="checkbox-row">
              <input type="checkbox" id="signup-terms" required disabled={loading} />
              <span>I agree to the <Link href="/terms">Terms of Service</Link> and the <a href="#">Data Processing Addendum</a>.</span>
            </label>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {step > 0 && (
            <button type="button" id="signup-back" className="btn btn-ghost"
              style={{ height: 44, flex: 1 }}
              onClick={() => { setErrorMsg(''); setStep(s => s - 1); }} disabled={loading}>← Back</button>
          )}
          <button className="auth-submit" id="signup-submit" type="submit" style={{ flex: 2 }} disabled={loading}>
            {loading ? 'Provisioning...' : step < 2 ? 'Continue' : 'Provision tenant'} <Icon.Arrow size={12} />
          </button>
        </div>
      </form>

      <p className="auth-alt">
        Already have a tenant? <Link href="/login">Sign in →</Link>
      </p>
    </AuthShell>
  );
}
