'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === '/dashboard/admin') return pathname === '/dashboard/admin';
    return pathname.startsWith(href);
  };

  const TABS = [
    { label: 'Overview', href: '/dashboard/admin', icon: <Icon.Grid size={13} /> },
    { label: 'Users', href: '/dashboard/admin/users', icon: <Icon.Shield size={13} /> },
    { label: 'Platform Cases', href: '/dashboard/admin/cases', icon: <Icon.Doc size={13} /> },
    { label: 'AI Usage & Costs', href: '/dashboard/admin/ai-usage', icon: <Icon.Sparkle size={13} /> },
    { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: <Icon.Hash size={13} /> },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: <Icon.Bolt size={13} /> },
  ];

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Premium Glassmorphic Admin Header Card */}
      <div className="p-6 rounded-2xl border border-border-subtle bg-bg-surface backdrop-blur-md relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.2)]">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-accent/5 rounded-full filter blur-[80px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full bg-accent/15 text-accent border border-accent/20 flex items-center gap-1 shadow-sm">
                <Icon.Shield size={10} className="animate-pulse" />
                Administrative Center
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-primary mt-1.5 f-display">
              Claril Platform Administration
            </h1>
            <p className="text-xs text-text-muted max-w-[650px] leading-relaxed">
              Global platform command center for managing analysts, orchestrating multi-agent cost limits, tracking system security events, and customizing system defaults.
            </p>
          </div>
        </div>

        {/* Horizontal Navigation Sub-tabs */}
        <div className="flex flex-wrap gap-1.5 mt-6 border-t border-border-subtle/50 pt-4 overflow-x-auto thin-scroll">
          {TABS.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
                isTabActive(tab.href)
                  ? 'bg-accent/10 text-accent font-semibold border border-accent/20 shadow-[0_0_10px_rgba(20,110,245,0.05)]'
                  : 'text-text-muted hover:bg-bg-surface-2 hover:text-text-primary border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Admin Sub-view Area */}
      <div className="min-h-[500px]">
        {children}
      </div>
    </div>
  );
}
