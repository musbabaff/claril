import Link from 'next/link';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { ClarilConsole } from '@/components/landing/claril-console';
import { Bento, Architecture, CodeBlock, LogoWall, Compliance, Pricing, CtaBanner } from '@/components/landing/sections';
import { Icon } from '@/components/icons';

export default function HomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        {/* HERO */}
        <section className="hero" id="top">
          <div className="hero-bg" />
          <div className="hero-grid-bg" />
          <div className="hero-inner">
            <div className="hero-head">
              <span className="glow-chip">claude-3.5-sonnet · live</span>
              <h1 className="hero-h1">
                Unstructured documents,<br />
                rendered as <em>typed JSON.</em>
              </h1>
              <p className="hero-sub">
                Claril is a multi-agent extraction platform that turns invoices, statements
                and scans into validated, tenant-isolated, cryptographically logged JSON —
                without leaving a single retry to chance.
              </p>
              <div className="hero-row">
                <Link className="btn btn-primary" href="/signup">
                  Initialize a tenant <Icon.Arrow size={12} />
                </Link>
                <Link className="btn btn-ghost" href="#architecture">View architecture</Link>
              </div>
              <div className="hero-meta">
                <span className="hero-meta-cell"><span className="pip" />p99 · 2.4s</span>
                <span className="hero-meta-cell"><span className="pip" />SOC 2 Type II</span>
                <span className="hero-meta-cell"><span className="pip" />row-level isolation</span>
                <span className="hero-meta-cell"><span className="pip" />SHA-256 ledger</span>
              </div>
            </div>
            <div className="hero-console-wrap">
              <div className="hero-console-shadow" />
              <ClarilConsole />
            </div>
          </div>
        </section>

        <Bento />
        <Architecture />
        <CodeBlock />
        <LogoWall />
        <Compliance />
        <Pricing />
        <CtaBanner />
      </main>
      <MarketingFooter />
    </>
  );
}
