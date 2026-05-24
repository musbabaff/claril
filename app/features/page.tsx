import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CtaBannerLite } from '@/components/landing/sections';
import { Icon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Platform Features — Claril',
  description: 'Four guarantees composed quietly: tenant row segregation, cryptographic audit ledger, parallel concurrency, and double-loop self-correction.',
};

function MiniRLS() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: '100%', maxWidth: 320, height: 'auto' }}>
      <defs>
        <pattern id="rlsg" width="14" height="14" patternUnits="userSpaceOnUse">
          <path d="M14 0H0V14" fill="none" stroke="var(--hairline)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="320" height="220" fill="url(#rlsg)" />
      {['acme', 'north', 'helio', 'mira', 'velvet', 'quartz'].map((t, i) => {
        const y = 16 + i * 30;
        const isActive = i === 1;
        return (
          <g key={t}>
            <rect x="22" y={y} width="276" height="22" rx="4"
              fill="var(--surface)" stroke={isActive ? 'var(--accent)' : 'var(--hairline-2)'} strokeWidth="1" />
            <text x="34" y={y + 14} fontFamily="var(--f-mono)" fontSize="10" fill="var(--ink-2)">tenant_{t}</text>
            <rect x="160" y={y + 6} width={50 + i * 8} height="10" rx="2"
              fill={isActive ? 'var(--accent)' : 'var(--hairline-strong)'}
              opacity={isActive ? 0.95 : 0.4} />
            {isActive && (
              <g transform={`translate(290, ${y + 11})`}>
                <circle r="3" fill="var(--accent)" />
                <circle r="7" fill="none" stroke="var(--accent)" opacity="0.4">
                  <animate attributeName="r" values="4;10;4" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
          </g>
        );
      })}
      <g transform="translate(160, 200)">
        <rect x="-50" y="-12" width="100" height="20" rx="10" fill="var(--surface)" stroke="var(--accent)" />
        <text x="0" y="2" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="10" fill="var(--accent-ink)">USING (org = current_tenant)</text>
      </g>
    </svg>
  );
}

function MiniLedger() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: '100%', maxWidth: 320, height: 'auto' }}>
      {[0, 1, 2, 3, 4, 5, 6].map(i => {
        const y = 12 + i * 28;
        return (
          <g key={i}>
            <rect x="22" y={y} width="276" height="20" rx="3" fill="var(--surface)" stroke="var(--hairline-2)" />
            <circle cx="32" cy={y + 10} r="3" fill={i < 6 ? 'var(--ok)' : 'var(--accent)'} />
            <text x="44" y={y + 13} fontFamily="var(--f-mono)" fontSize="10.5" fill="var(--ink-2)">step_{i}</text>
            <text x="106" y={y + 13} fontFamily="var(--f-mono)" fontSize="10.5" fill="var(--muted)">sha256:{(0xa7c1f0 + i * 19).toString(16).slice(0, 6)}…</text>
            {i < 6 && <path d={`M160 ${y + 20} L160 ${y + 28}`} stroke="var(--accent)" strokeWidth="1.2" strokeDasharray="2 2" />}
          </g>
        );
      })}
    </svg>
  );
}

function MiniParallel() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: '100%', maxWidth: 320, height: 'auto' }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 18 + i * 30;
        return (
          <g key={i}>
            <rect x="20" y={y - 9} width="32" height="18" rx="4" fill="var(--surface)" stroke="var(--hairline-2)" />
            <text x="36" y={y + 4} textAnchor="middle" fontFamily="var(--f-mono)" fontSize="10" fill="var(--ink-2)">doc·{i + 1}</text>
            <line x1="52" y1={y} x2="270" y2={y} stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 4">
              <animate attributeName="stroke-dashoffset" values="20;0" dur={`${0.8 + i * 0.18}s`} repeatCount="indefinite" />
            </line>
            <rect x={180 + i * 10} y={y - 4} width="8" height="8" rx="1" fill="var(--accent)" />
            <rect x="270" y={y - 9} width="32" height="18" rx="4" fill="var(--accent-soft)"
              stroke="color-mix(in oklab, var(--accent) 30%, transparent)" />
            <text x="286" y={y + 4} textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" fill="var(--accent-ink)">✓</text>
          </g>
        );
      })}
    </svg>
  );
}

function MiniLoop() {
  return (
    <svg viewBox="0 0 320 220" style={{ width: '100%', maxWidth: 320, height: 'auto' }}>
      <g transform="translate(160, 110)">
        <circle r="68" fill="none" stroke="var(--hairline-2)" strokeDasharray="4 4" />
        <path d="M -68 0 A 68 68 0 0 1 48 -48" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
          <animate attributeName="stroke-dasharray" values="0 300;200 300" dur="2.4s" repeatCount="indefinite" />
        </path>
        <path d="M 50 -50 L 44 -42 M 50 -50 L 58 -44" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
        <g transform="translate(-68, 0)">
          <circle r="14" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.4" />
          <text y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="12" fill="var(--accent-ink)">P</text>
        </g>
        <g transform="translate(0, -68)">
          <circle r="14" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.4" />
          <text y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="12" fill="var(--warn)">!</text>
        </g>
        <g transform="translate(68, 0)">
          <circle r="14" fill="var(--surface)" stroke="var(--ok)" strokeWidth="1.4" />
          <text y="4" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="12" fill="var(--ok)">✓</text>
        </g>
        <text x="0" y="88" textAnchor="middle" fontFamily="var(--f-mono)" fontSize="11" fill="var(--muted)">on validation_error → reparse</text>
      </g>
    </svg>
  );
}

const FEATURE_ROWS = [
  {
    id: 'rls', eyebrow: 'row-level isolation', flip: false, Diag: MiniRLS,
    title: <>Tenant boundaries enforced at the <em>database row</em>.</>,
    body: 'Claril runs every read and write through PostgreSQL Row Level Security policies bound to the request\'s tenant. No application code can leak across tenants because the database refuses to return rows that aren\'t theirs.',
    bullets: ['Per-tenant policies, audited monthly', 'RLS context attached at connection time', 'Tested by chaos-engineering tenant swaps', 'Sub-tenants are first-class scopes'],
  },
  {
    id: 'ledger', eyebrow: 'cryptographic ledger', flip: true, Diag: MiniLedger,
    title: <>Every step <em>hashes the one before it</em>.</>,
    body: 'Claril maintains an append-only SHA-256 chain for each document. If a step is altered, every step after it breaks. The chain root is returned on every call so you can verify offline.',
    bullets: ['WORM-mode for 7 years (Production)', 'Hash anchored to the previous step\'s bytes', 'Audit ledger export · CSV or JSONL', 'Independent verification SDK'],
  },
  {
    id: 'parallel', eyebrow: 'concurrency', flip: false, Diag: MiniParallel,
    title: <>Up to <em>64 documents in flight</em>, per tenant.</>,
    body: 'The agent pool is partitioned per tenant. A noisy tenant cannot starve a quiet one. Documents are dispatched to Parser, Verify and Synthesizer workers in parallel with explicit backpressure.',
    bullets: ['Backpressure at 32 in flight, configurable', 'Per-tenant rate buckets', 'Workers run in isolated VMs', 'Hot reload of agent code without dropping pipelines'],
  },
  {
    id: 'loop', eyebrow: 'self-correction', flip: true, Diag: MiniLoop,
    title: <>A second loop catches what the first <em>fluffed</em>.</>,
    body: 'When Verify rejects a Parser output for a schema mismatch, Claril re-invokes the Parser with the validation delta attached. Most retries succeed; the ones that don\'t are flagged for human review with the exact reason.',
    bullets: ['Up to 3 retries with schema delta attached', 'Failure modes emit a structured \'review\' event', 'Configurable per-case', 'Retry surfaced in the audit ledger'],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">platform</span>
            <h1>Four guarantees, <em>composed quietly</em>.</h1>
            <p>Claril is intentionally boring underneath. Boring is what lets you stop watching it.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="feature-rows">
              {FEATURE_ROWS.map(r => (
                <article key={r.id} id={r.id} className={'feature-row ' + (r.flip ? 'flip' : '')}>
                  <div className="feature-copy">
                    <span className="eyebrow"><span className="dot" />{r.eyebrow}</span>
                    <h3>{r.title}</h3>
                    <p>{r.body}</p>
                    <ul>
                      {r.bullets.map(b => (
                        <li key={b}><Icon.Check size={12} />{b}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="feature-visual"><r.Diag /></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CtaBannerLite />
      </main>
      <MarketingFooter />
    </>
  );
}
