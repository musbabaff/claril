'use client';

import { useState, useEffect, useMemo } from 'react';
import { Icon } from '@/components/icons';
import Link from 'next/link';

interface Case {
  id: string;
  subject_name: string;
  case_reference: string;
  primary_value: number;
  status: string;
  created_at: string;
  docCount: number;
  aiCost: number;
  ownerName: string;
  ownerEmail: string;
}

export default function AdminCases() {
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const loadCases = async () => {
    try {
      const res = await fetch('/api/admin/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases);
      }
    } catch (err) {
      console.error('Failed to load admin cases ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch =
        c.subject_name.toLowerCase().includes(search.toLowerCase()) ||
        c.case_reference.toLowerCase().includes(search.toLowerCase()) ||
        c.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        c.ownerEmail.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter ? c.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [cases, search, statusFilter]);

  if (loading) {
    return (
      <div className="p-6 border border-border-subtle bg-bg-surface/50 rounded-xl space-y-6 animate-pulse">
        <div className="h-6 w-1/4 bg-border-subtle rounded" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-border-subtle rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm shadow-sm">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search cases by subject, reference, or owner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-subtle rounded-lg py-2 pl-9 pr-4 text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <span className="absolute left-3 top-2.5 text-text-muted">
            <Icon.Doc size={12} />
          </span>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All Case Statuses</option>
            <option value="pending">Pending</option>
            <option value="extracting">Extracting</option>
            <option value="analyzing">Analyzing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Main Cases Table Grid */}
      <div className="border border-border-subtle rounded-xl overflow-hidden bg-bg-surface/85 backdrop-blur-md shadow-sm">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-bg-surface-2 border-b border-border-subtle/80 text-[10px] uppercase tracking-wider text-text-muted">
                <th className="p-4">Case Reference / Subject</th>
                <th className="p-4">Owner Profile</th>
                <th className="p-4">Pipeline Status</th>
                <th className="p-4">Date created</th>
                <th className="p-4">Documents</th>
                <th className="p-4">Primary value</th>
                <th className="p-4">Billed Cost</th>
                <th className="p-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-text-muted italic">
                    No matching cases found across platform.
                  </td>
                </tr>
              ) : (
                filteredCases.map(c => {
                  // Color codes for status
                  const statusBadge =
                    c.status === 'completed' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/25' :
                    c.status === 'failed' ? 'bg-rose-400/10 text-rose-400 border-rose-400/25' :
                    c.status === 'analyzing' ? 'bg-purple-400/10 text-purple-400 border-purple-400/25' :
                    c.status === 'extracting' ? 'bg-blue-400/10 text-blue-400 border-blue-400/25' :
                    'bg-amber-400/10 text-amber-400 border-amber-400/25';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-bg-surface-2/30 transition-colors duration-150"
                    >
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-text-primary truncate max-w-[180px]" title={c.subject_name}>
                            {c.subject_name}
                          </div>
                          <div className="text-[10px] text-text-muted opacity-80">{c.case_reference}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="text-text-primary font-medium">{c.ownerName}</div>
                          <div className="text-[10px] text-text-muted opacity-75">{c.ownerEmail}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusBadge}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-text-primary">{c.docCount}</td>
                      <td className="p-4 text-text-primary font-semibold">
                        {c.primary_value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-4 text-accent font-semibold">${c.aiCost.toFixed(4)}</td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/dashboard/cases/${c.id}`}
                          className="btn btn-secondary px-2.5 py-1 text-[10px] inline-flex items-center gap-1 rounded"
                        >
                          Open Ledger
                          <Icon.ArrowUR size={10} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
