'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/client';

const SIDEBAR_GROUPS = [
  {
    h: 'workspace',
    items: [
      { id: 'overview',  label: 'Overview',      icon: <Icon.Grid />,   href: '/dashboard' },
      { id: 'cases',     label: 'Cases ledger',  icon: <Icon.Doc />,    href: '/dashboard/cases',   badge: '12' },
      { id: 'schemas',   label: 'Schemas',        icon: <Icon.Code />,   href: '/dashboard/schemas' },
      { id: 'agents',    label: 'Agents',         icon: <Icon.Branch />, href: '/dashboard/agents' },
      { id: 'audit',     label: 'Audit ledger',   icon: <Icon.Hash />,   href: '/dashboard/audit' },
      { id: 'reports',   label: 'Reports',        icon: <Icon.Sparkle />, href: '/dashboard/reports' },
    ],
  },
  {
    h: 'tenant',
    items: [
      { id: 'team',      label: 'Team',           icon: <Icon.Shield />, href: '/dashboard/team' },
      { id: 'keys',      label: 'API keys',       icon: <Icon.Lock />,   href: '/dashboard/keys' },
      { id: 'billing',   label: 'Billing',        icon: <Icon.Sparkle />,href: '/dashboard/billing' },
      { id: 'settings',  label: 'Settings',       icon: <Icon.Bolt />,   href: '/dashboard/settings' },
    ],
  },
];

interface SidebarProps {
  org?: string;
}

export function DashboardSidebar({ org: initialOrg = 'Acme Industrial' }: SidebarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<{
    fullName: string;
    orgName: string;
    role: string;
    subdomain?: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Load public profile via secure server-side API to bypass client RLS recursive policies
          const res = await fetch('/api/profile');
          if (res.ok) {
            const { data } = await res.json();
            if (data) {
              setProfile({
                fullName: data.full_name || user.user_metadata?.full_name || 'Operator User',
                orgName: data.organization_name || user.user_metadata?.organization_name || initialOrg,
                role: data.role || 'analyst',
                subdomain: user.user_metadata?.subdomain || 'claril-dev'
              });
              return;
            }
          }

          setProfile({
            fullName: user.user_metadata?.full_name || 'Operator User',
            orgName: user.user_metadata?.organization_name || initialOrg,
            role: 'analyst',
            subdomain: user.user_metadata?.subdomain || 'claril-dev'
          });
        }
      } catch (err) {
        console.error('Failed to retrieve user profile:', err);
      }
    }
    loadProfile();
  }, [initialOrg]);

  const isCurrent = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const currentOrg = profile?.orgName || initialOrg;
  const currentSubdomain = profile?.subdomain || 'org_4f7a';
  const orgInitials = currentOrg.substring(0, 2).toUpperCase();
  const userFullName = profile?.fullName || 'Elif Karaca';
  const userRole = profile?.role || 'engineering';
  
  // Create dynamic user avatar initials
  const userInitials = userFullName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'EK';

  return (
    <aside className="dash-sidebar">
      <div className="dash-side-head">
        <Link className="dash-side-brand" href="/">
          <span className="nav-brand-mark"><Icon.Logo size={14} /></span>
          <span className="dash-side-brand-name f-display">Claril</span>
        </Link>
        <button className="dash-side-org">
          <span className="dash-side-org-mark f-mono">{orgInitials}</span>
          <span className="dash-side-org-body">
            <span className="dash-side-org-name">{currentOrg}</span>
            <span className="dash-side-org-meta f-mono">{currentSubdomain} · prod</span>
          </span>
          <span className="dash-side-org-caret f-mono">⇅</span>
        </button>
      </div>

      <nav className="dash-side-nav thin-scroll">
        {SIDEBAR_GROUPS.map(group => (
          <div key={group.h} className="dash-side-group">
            <span className="dash-side-group-h f-mono">{group.h}</span>
            {group.items.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={'dash-side-item ' + (isCurrent(item.href) ? 'is-current' : '')}
              >
                <span className="dash-side-icon">{item.icon}</span>
                <span className="dash-side-label">{item.label}</span>
                {item.badge && (
                  <span className="dash-side-badge f-mono">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
        {profile?.role === 'admin' && (
          <div className="dash-side-group border-t border-border-subtle/30 pt-3 mt-3">
            <span className="dash-side-group-h f-mono text-accent">administration</span>
            <Link
              href="/dashboard/admin"
              className={'dash-side-item text-accent ' + (isCurrent('/dashboard/admin') ? 'is-current' : '')}
            >
              <span className="dash-side-icon text-accent"><Icon.Shield /></span>
              <span className="dash-side-label font-semibold">Admin Center</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="dash-side-foot">
        <div className="dash-side-meter">
          <div className="dash-side-meter-row">
            <span className="f-mono">extractions · october</span>
            <span className="f-mono">62%</span>
          </div>
          <div className="dash-side-meter-bar">
            <span style={{ width: '62%' }} />
          </div>
          <div className="dash-side-meter-row sub f-mono">
            <span>6,210 / 10,000</span>
            <Link href="/pricing">upgrade →</Link>
          </div>
        </div>
        <Link className="dash-side-user" href="/dashboard/settings">
          <span className="dash-side-user-av">{userInitials}</span>
          <span className="dash-side-user-body">
            <span>{userFullName}</span>
            <span className="f-mono">{userRole}</span>
          </span>
          <Icon.ArrowUR size={11} />
        </Link>
      </div>
    </aside>
  );
}

