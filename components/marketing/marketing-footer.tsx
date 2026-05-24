'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';

const FOOTER_COLS = [
  {
    h: 'Product',
    l: [
      ['/features',          'Features'],
      ['/how-it-works',      'How it works'],
      ['/dashboard',         'Console'],
      ['#',                  'API'],
      ['#',                  'SDKs'],
      ['#',                  'Changelog'],
      ['#',                  'Status'],
    ],
  },
  {
    h: 'Platform',
    l: [
      ['/features#architecture', 'Architecture'],
      ['/features#security',     'Security'],
      ['/features#ledger',       'Audit ledger'],
      ['/features#rls',          'RLS isolation'],
    ],
  },
  {
    h: 'Company',
    l: [
      ['/about',   'About'],
      ['#',        'Engineering blog'],
      ['#',        'Careers'],
      ['#',        'Contact'],
    ],
  },
  {
    h: 'Legal',
    l: [
      ['#',        'DPA'],
      ['/terms',   'Terms'],
      ['/privacy', 'Privacy'],
      ['#',        'Subprocessors'],
    ],
  },
] as const;

export function MarketingFooter() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="footer-logo"><Icon.Logo size={26} /></span>
            <span className="footer-name f-display">Claril</span>
            <p className="footer-tag">Universal multi-agent document intelligence.</p>
            <p className="footer-meta f-mono">v1.4.2 · build a7c1f0 · all systems normal</p>
          </div>
          {FOOTER_COLS.map(col => (
            <div key={col.h} className="footer-col">
              <span className="footer-h f-mono">{col.h}</span>
              <ul>
                {col.l.map(([href, txt]) => (
                  <li key={txt}>
                    <Link href={href}>{txt}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span className="f-mono">© 2026 Claril — A Sydnar Technologies product</span>
          <span className="f-mono">made with quiet pipelines</span>
        </div>
      </div>
    </footer>
  );
}
