'use client';

import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  title?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
}

export function DashboardTopbar({ title, crumbs = [], actions }: TopbarProps) {
  return (
    <header className="dash-topbar">
      <div className="dash-crumbs">
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span className="dash-crumb-sep f-mono">/</span>}
            {c.href
              ? <Link href={c.href} className="dash-crumb">{c.label}</Link>
              : <span className="dash-crumb is-current">{c.label}</span>}
          </span>
        ))}
      </div>
      {title && <h1 className="dash-title f-display">{title}</h1>}
      <div className="dash-topbar-right">{actions}</div>
    </header>
  );
}
