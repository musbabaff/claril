import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata: Metadata = {
  title: 'Terms of Service — Claril',
  description: 'Terms governing your use of the Claril platform, written in plain language.',
};

const SECTIONS = [
  { p: 'These terms govern your use of the Claril platform. By creating a tenant or sending a request to api.claril.dev, you agree to them. They are written in plain language. Where they have to be precise, they are precise.' },
  { h: '1 · The service' },
  { p: 'Claril provides a multi-agent document extraction service that turns unstructured documents into validated, tenant-isolated, cryptographically logged JSON. The service is described at claril.dev/features and operationally bounded by the published SLA at claril.dev/sla.' },
  { h: '2 · Your account and tenant' },
  { list: ['You are responsible for keeping your credentials safe and for everything done with your tenant.', 'Tenants are bound to a region at creation and cannot move regions.', 'You may create sub-tenants. Sub-tenants inherit RLS policies from their parent unless explicitly relaxed.'] },
  { h: '3 · Acceptable use' },
  { p: 'You agree not to: violate any law, process personal data you don\'t have a lawful basis for, attempt to bypass the row-level isolation, reverse engineer the agent prompts, or use Claril to build a competing extraction service.' },
  { h: '4 · Fees and billing' },
  { p: 'The Developer Sandbox is free up to the limits at claril.dev/pricing. Production tenants are billed monthly at the rates shown there. Volume pricing is negotiated in writing; nothing in chat or email creates a binding price.' },
  { h: '5 · The audit ledger is binding' },
  { p: 'The SHA-256 audit chain attached to every extraction is the canonical record of what happened on the platform. If a dispute arises between us and you about whether a step occurred, the chain root and corresponding ledger entry resolve it. The verification SDK is open source so you don\'t have to take our word for it.' },
  { h: '6 · Service level agreement' },
  { p: 'Production tenants are covered by a 99.95% uptime SLA, measured monthly. If we miss it, you receive proportional service credits per the published schedule. Sandbox tenants are explicitly best-effort.' },
  { h: '7 · Termination' },
  { p: 'You can close your tenant from the settings page at any time. We can terminate accounts for unpaid invoices after 30 days written notice, or immediately for breach of the acceptable use clause.' },
  { h: '8 · Limitation of liability' },
  { p: 'To the extent permitted by law, our aggregate liability is capped at the fees you paid us in the 12 months before the event giving rise to the claim. Indirect damages, lost profits, and lost data are excluded.' },
  { h: '9 · Governing law' },
  { p: 'These terms are governed by the laws of the State of New York. Disputes go to courts in New York County, unless you are an EU consumer, in which case your local courts apply.' },
];

export default function TermsPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <div className="legal-wrap">
          <div className="legal-meta">Effective · October 2 2026 · Version 4</div>
          <h1>Terms of service</h1>
          {SECTIONS.map((s, i) => (
            <section key={i}>
              {s.h && <h2>{s.h}</h2>}
              {s.p && <p>{s.p}</p>}
              {s.list && <ul>{s.list.map((x, j) => <li key={j}>{x}</li>)}</ul>}
            </section>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
