import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata: Metadata = {
  title: 'Privacy Policy — Claril',
  description: 'How Claril processes personal data and tenant content.',
};

const SECTIONS = [
  { p: 'This privacy policy describes how Claril Systems Inc. ("Claril", "we") processes personal data and tenant content when you use the Claril platform. It is written by people who have read other people\'s privacy policies and disliked them. Where a sentence is short, that is intentional.' },
  { h: '1 · Data controller and processor' },
  { p: 'When you sign up directly with Claril, we are the data controller for your account. When you process tenant content through Claril on behalf of your own customers, you are the controller and we are the processor. A Data Processing Addendum is available on every tenant settings page.' },
  { h: '2 · What we process' },
  { list: ['Account data: name, email, organization name, role, hashed credentials.', 'Tenant content: documents you upload and the JSON extracted from them.', 'Operational logs: request IDs, latencies, tenant IDs, audit hashes — never document contents.', 'Billing data: handled by Stripe; we never see card numbers.'] },
  { h: '3 · Row-level isolation' },
  { p: 'Tenant content is stored in PostgreSQL with row-level security policies bound to your tenant. The database refuses to return rows that aren\'t yours, even if our application code asked for them. RLS is the floor, not the ceiling — production tenants may pin their own region, KMS key, or a dedicated cluster.' },
  { h: '4 · Retention' },
  { list: ['Sandbox: ledger entries are retained for 30 days, then purged.', 'Production: ledger entries are retained for 7 years in WORM storage by default.', 'Documents: retained per the lifecycle you configure on your tenant.', 'Account data: retained until you delete your account, plus 30 days.'] },
  { h: '5 · Sub-processors' },
  { p: 'We use AWS (compute, storage), Anthropic (model inference), Stripe (billing), Sentry (errors), and Twilio (notifications). A current list with regions and roles is at claril.dev/subprocessors and is updated 30 days before any change.' },
  { h: '6 · Your rights' },
  { p: 'Depending on your jurisdiction you have rights of access, correction, deletion, restriction, portability, and to object. You can exercise any of them from your tenant settings or by emailing privacy@claril.dev. We aim to respond within 14 days.' },
  { h: '7 · Contact' },
  { p: 'Claril Systems Inc., 1 Hudson Yards, NY 10001. privacy@claril.dev. Our EU representative is registered in Frankfurt.' },
];

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <div className="legal-wrap">
          <div className="legal-meta">Effective · October 2 2026 · Version 4</div>
          <h1>Privacy policy</h1>
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
