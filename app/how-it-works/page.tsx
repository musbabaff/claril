import type { Metadata } from 'next';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { CtaBannerLite } from '@/components/landing/sections';

export const metadata: Metadata = {
  title: 'How It Works — Claril',
  description: 'From upload to typed JSON in six steps. Most documents settle in under three seconds.',
};

const HOW_STEPS = [
  {
    n: '01', title: 'Upload',
    body: 'Send a file via SDK, CLI, or the dashboard\'s drag-and-drop. The ingress gateway binds it to the tenant scope before it touches the agent plane.',
    visual: (
      <>
        <b>POST /v1/extract</b>
        <span>multipart/form-data · 284 KB</span>
        <span>tenant: <span className="accent">org_4f7a</span></span>
        <span className="ok">✓ bound · sha256:a7c1f0…</span>
      </>
    ),
  },
  {
    n: '02', title: 'Parser',
    body: 'OCR is performed, the layout is segmented, and the Parser agent (claude-3.5-sonnet) walks the document producing a draft extraction.',
    visual: (
      <>
        <b>parser.run(file)</b>
        <span>ocr · layout · type detection</span>
        <span className="accent">draft → 12 fields</span>
        <span className="ok">✓ 1.84s · 4,860 tokens in</span>
      </>
    ),
  },
  {
    n: '03', title: 'Verify',
    body: 'The Verify agent checks the draft against your schema, runs cross-field assertions (totals add up, dates are coherent), and emits a delta if anything fails.',
    visual: (
      <>
        <b>verify.match(schema)</b>
        <span>pydantic · cross-field assertions</span>
        <span className="accent">subtotal + tax == total · ok</span>
        <span className="ok">✓ passed in 0.41s</span>
      </>
    ),
  },
  {
    n: '04', title: 'Self-correct (if needed)',
    body: 'On a validation error, the loop kicks in. Claril re-invokes the Parser with the delta, up to three times. Most retries succeed; the rest are flagged for review.',
    visual: (
      <>
        <b>retry.with(schema_delta)</b>
        <span>attempt 2 of 3</span>
        <span className="accent">delta: total mismatch</span>
        <span className="ok">✓ corrected · 0.98s</span>
      </>
    ),
  },
  {
    n: '05', title: 'Synthesize',
    body: 'The Synthesizer agent emits a strictly-typed JSON object — guaranteed to match the schema. If it can\'t, Claril refuses to return anything (no half-data).',
    visual: (
      <>
        <b>synthesizer.emit()</b>
        <span>strict · pydantic Invoice</span>
        <span className="accent">{'{ total: 19893.60, ... }'}</span>
        <span className="ok">✓ 1.45s</span>
      </>
    ),
  },
  {
    n: '06', title: 'Ledger + webhook',
    body: 'Each step is hashed and chained. The document, schema, and audit chain root are written to your tenant\'s WORM ledger. A signed webhook fires with the final JSON.',
    visual: (
      <>
        <b>ledger.append(chain)</b>
        <span>sha256 · WORM · 7yr</span>
        <span className="accent">root: 7b03ee…fa92</span>
        <span className="ok">✓ webhook delivered</span>
      </>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <MarketingNav />
      <main>
        <section className="page-hero">
          <div className="page-hero-inner">
            <span className="glow-chip">how it works</span>
            <h1>From upload to <em>typed JSON</em>, in six steps.</h1>
            <p>Most documents settle in under three seconds. Every step is hashed and tenant-bound.</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="steps-list">
              {HOW_STEPS.map(s => (
                <article className="step-card" key={s.n}>
                  <div className="step-n">{s.n}</div>
                  <div className="step-body">
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                  <div className="step-visual">{s.visual}</div>
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
