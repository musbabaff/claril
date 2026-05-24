'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/client';

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 00-3.79 23.4c.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.42-4.04-1.42-.55-1.38-1.34-1.75-1.34-1.75-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.81 1.3 3.5.99.1-.77.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.13-.3-.54-1.52.12-3.17 0 0 1-.32 3.28 1.23a11.4 11.4 0 016 0c2.27-1.55 3.28-1.23 3.28-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.3c0 .32.22.7.83.58A12 12 0 0012 .3"/>
    </svg>
  );
}

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

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setPwError(true); return; }
    setLoading(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pw,
      });
      if (error) throw error;
      if (data.user) {
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Sign in error:', message);
      setErrorMsg(message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSO = async (provider: 'google' | 'github') => {
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`SSO login error with ${provider}:`, message);
      setErrorMsg(`SSO login failed: ${message}`);
    }
  };

  return (
    <AuthShell>
      <span className="glow-chip auth-eyebrow">welcome back</span>
      <h1 className="auth-h1">Sign in to <em>Claril</em></h1>
      <p className="auth-sub">Continue with your tenant&apos;s identity provider, or use your email.</p>

      {errorMsg && (
        <div className="err" style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--err)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Icon.Bolt size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="auth-sso">
        <button id="sso-google" type="button" onClick={() => handleSSO('google')}><GoogleIcon /> Google</button>
        <button id="sso-github" type="button" onClick={() => handleSSO('github')}><GithubIcon /> GitHub</button>
      </div>
      <div className="auth-divider">or email</div>

      <form className="auth-form" id="login-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="login-email">Work email</label>
          <input
            id="login-email" type="email" placeholder="you@company.com"
            value={email} onChange={e => setEmail(e.target.value)} required
            disabled={loading}
          />
        </div>
        <div className="field">
          <label htmlFor="login-pw">
            <span>Password</span>
            <Link href="/forgot-password">forgot?</Link>
          </label>
          <input
            id="login-pw" type="password" placeholder="••••••••••••"
            className={pwError ? 'is-error' : ''}
            value={pw} onChange={e => { setPw(e.target.value); setPwError(false); }}
            disabled={loading}
            required
          />
          {pwError && (
            <span className="err"><Icon.Bolt size={11} /> Password must be at least 6 characters.</span>
          )}
        </div>
        <label className="checkbox-row">
          <input type="checkbox" id="login-remember" defaultChecked disabled={loading} />
          <span>Remember this device for 30 days. Claril will require re-auth for production tenants.</span>
        </label>
        <button className="auth-submit" id="login-submit" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'} <Icon.Arrow size={12} />
        </button>
      </form>

      <p className="auth-alt">
        First time here? <Link href="/signup">Initialize a tenant →</Link>
      </p>
    </AuthShell>
  );
}
