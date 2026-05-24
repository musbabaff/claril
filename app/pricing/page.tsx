import { Fragment } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CtaBannerLite } from '@/components/landing/sections';
import { Icon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Pricing — Claril',
  description: 'Two plans. Sandbox is free forever. Production starts at $120 and includes everything you actually need.',
};

const PRICE_MATRIX = {
  groups: [
    {
      h: 'Extraction',
      rows: [
        ['Core extractions / month',      '100',                 'Unmetered'],
        ['Concurrent pipelines',          '2',                   '64 — multi-threaded'],
        ['Avg. p99 latency target',       'Best effort',         '2.4s — credited if missed'],
        ['Schema validation',             'Strict',              'Strict + draft schemas'],
        ['Bring your own schema',         'Yes',                 'Yes'],
        ['Self-correction loop',          '1 retry',             'Up to 3 retries · configurable'],
      ],
    },
    {
      h: 'Isolation',
      rows: [
        ['Postgres RLS',                  'Single-tenant',       'Per-tenant policies + sub-tenants'],
        ['Dedicated VPC option',          '—',                   'Yes — single-tenant cluster'],
        ['Region pinning',                'us-east only',        'us · eu · apac'],
        ['Customer-managed KMS',          '—',                   'Yes — AWS / GCP / Azure'],
      ],
    },
    {
      h: 'Audit',
      rows: [
        ['SHA-256 ledger',                '30-day retention',    '7-year WORM retention'],
        ['Independent verification SDK',  '—',                   'Yes'],
        ['Step-level cost tracking',      'Yes',                 'Yes'],
        ['Audit export · CSV / JSONL',    '—',                   'Yes'],
      ],
    },
    {
      h: 'Operations',
      rows: [
        ['Webhooks',                      '—',                   'Custom + signed'],
        ['SLA',                           'Best effort',         '99.95% · uptime credits'],
        ['Support',                       'Community',           'Shared Slack channel'],
        ['Engineering office hours',      '—',                   'Monthly'],
      ],
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <MarketingNav />
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
            {/* Plan headers */}
            <div className="pricing-grid">
              <article className="pricing-col">
                <header className="pricing-head">
                  <h3 className="f-display">Developer Sandbox</h3>
                  <p>Everything you need to wire up Claril against your own schemas.</p>
                  <div className="pricing-price">
                    <span className="pricing-amt f-display">$0</span>
                    <span className="pricing-period f-mono">/ month</span>
                  </div>
                  <Link className="btn btn-ghost" href="/signup">Start free <Icon.Arrow size={12} /></Link>
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
                  <Link className="btn btn-primary" href="/signup">Deploy production <Icon.Arrow size={12} /></Link>
                </header>
              </article>
            </div>

            {/* Feature matrix */}
            <div style={{ marginTop: 28, border: '1px solid var(--hairline)', borderRadius: 14, background: 'var(--surface)', overflow: 'hidden' }}>
              <table className="dash-table" style={{ fontSize: 13.5 }}>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Feature</th>
                    <th>Developer Sandbox</th>
                    <th>Production Ledger</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_MATRIX.groups.map(g => (
                    <Fragment key={g.h}>
                      <tr style={{ background: 'var(--surface-2)', cursor: 'default' }}>
                        <td colSpan={3} className="f-mono" style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--muted)' }}>{g.h}</td>
                      </tr>
                      {g.rows.map(([k, a, b]) => (
                        <tr key={k} style={{ cursor: 'default' }}>
                          <td style={{ color: 'var(--ink-2)' }}>{k}</td>
                          <td className="f-mono" style={{ color: a === '—' ? 'var(--muted-2)' : 'var(--ink)' }}>{a}</td>
                          <td className="f-mono" style={{ color: 'var(--ink)' }}>{b}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="pricing-foot f-mono">
              Need volume pricing, on-prem, or BAA? <a href="#">talk to engineering →</a>
            </p>
          </div>
        </section>

        <CtaBannerLite />
      </main>
      <MarketingFooter />
    </>
  );
}
