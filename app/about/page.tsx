import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CtaBannerLite } from '@/components/landing/sections';

export const metadata: Metadata = {
  title: 'About — Claril',
  description: 'Claril was founded in 2024 to make document-ingestion pipelines that stop being your problem.',
};

const ABOUT_CARDS = [
  { k: 'Founded',           v: '2024',      d: 'Brooklyn, NY · Berlin, DE' },
  { k: 'People',            v: '21',        d: 'engineering-led, on purpose' },
  { k: 'Tenants live',      v: '1,284',     d: 'across 6 regions' },
  { k: 'Docs processed',    v: '412M',      d: 'since launch · always row-bound' },
  { k: 'SOC 2 / ISO 27001', v: 'certified', d: 'annual + continuous' },
  { k: 'Open source',       v: 'audit SDK', d: 'independent ledger verification' },
];

const PRINCIPLES = [
  ['Boring infrastructure is a feature.', 'Customers don\'t pay us to chase the new thing. They pay us so document ingestion stops being the thing that wakes them up.'],
  ['The ledger is sacred.', 'We never edit a step. We never re-order one. If we change a schema, that\'s a new chain. Predictability beats convenience.'],
  ['Tenants are walls, not labels.', 'Row-level security is the floor. Anything above it — VPCs, KMS keys, region pins — is a customer choice, never a default we forgot.'],
  ['No contact-sales line.', 'Pricing is on the website. The SLA is on the website. The DPA is on the website. If a feature isn\'t, it doesn\'t exist yet.'],
];

export default function AboutPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">about claril</span>
            <h1>We make pipelines that <em>stop being your problem</em>.</h1>
            <p>Claril was founded in 2024 by a small team that had spent too many weekends fixing the same document-ingestion stack. We are still small. We intend to stay that way.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="about-grid">
              {ABOUT_CARDS.map(c => (
                <div className="about-card" key={c.k}>
                  <span className="k">{c.k}</span>
                  <div className="v">{c.v}</div>
                  <p>{c.d}</p>
                </div>
              ))}
            </div>

            <div style={{ maxWidth: 720, margin: '60px auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <h2 className="f-display" style={{ fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', margin: 0 }}>Operating principles</h2>
              {PRINCIPLES.map(([h, b]) => (
                <div key={h}>
                  <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 500, margin: '0 0 4px' }}>{h}</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 15, lineHeight: 1.6 }}>{b}</p>
                </div>
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
