'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icons';

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
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <AuthShell>
      {!sent ? (
        <>
          <span className="glow-chip auth-eyebrow">account recovery</span>
          <h1 className="auth-h1">Reset your <em>password</em></h1>
          <p className="auth-sub">
            Enter your work email. If there&apos;s a tenant associated with it, we&apos;ll send a
            signed recovery link. The link expires after 15 minutes.
          </p>
          <form className="auth-form" id="forgot-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="forgot-email">Work email</label>
              <input
                id="forgot-email" type="email" placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus
              />
            </div>
            <button className="auth-submit" id="forgot-submit" type="submit">
              Send recovery link <Icon.Arrow size={12} />
            </button>
          </form>
          <p className="auth-alt">
            Remembered it? <Link href="/login">Back to sign in →</Link>
          </p>
        </>
      ) : (
        <div className="auth-sent">
          <div className="auth-sent-icon">✉</div>
          <h2 className="f-display">Check your inbox</h2>
          <p>
            If <b>{email}</b> matches a Claril tenant, a signed recovery link is on
            its way. It&apos;ll expire in 15 minutes. Check spam if you don&apos;t see it.
          </p>
          <p className="f-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
            Link is signed with your tenant&apos;s HMAC secret. Clicking it will not
            require your current password.
          </p>
          <Link className="btn btn-ghost" href="/login" style={{ marginTop: 8 }}>
            Back to sign in
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
