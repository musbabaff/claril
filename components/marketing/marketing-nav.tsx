'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';

const NAV_LINKS = [
  { href: '/features',      label: 'Platform'      },
  { href: '/how-it-works',  label: 'How it works'  },
  { href: '/features#developers', label: 'Developers'   },
  { href: '/pricing',       label: 'Pricing'        },
  { href: '/about',         label: 'About'          },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="nav-brand" href="/">
          <span className="nav-brand-mark"><Icon.Logo size={16} /></span>
          <span className="nav-brand-name">Claril</span>
          <span className="nav-brand-ver">v1.4</span>
        </Link>

        <ul className="nav-links">
          {NAV_LINKS.map(l => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={pathname === l.href || pathname.startsWith(l.href.split('#')[0]) && l.href !== '/' ? 'is-current' : ''}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-cta">
          <span className="nav-status">
            <span className="pip" />
            all systems normal
          </span>
          <Link className="btn btn-ghost" href="/login">Sign in</Link>
          <Link className="btn btn-primary" href="/signup">
            Initialize <Icon.Arrow size={12} />
          </Link>
        </div>
      </div>
    </header>
  );
}
