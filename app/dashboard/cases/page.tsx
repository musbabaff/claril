'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  ChevronRight, 
  Clock
} from 'lucide-react';

interface CaseRecord {
  id: string;
  subject_name: string;
  case_reference: string;
  primary_value: number;
  status: 'pending' | 'extracting' | 'analyzing' | 'completed' | 'rejected' | 'failed';
  created_at: string;
  documents?: { id: string }[];
}

export default function CasesLedger() {
  const supabase = createClient();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCases() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('cases')
          .select('*, documents(id)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setCases(data as unknown as CaseRecord[]);
      } catch (err) {
        console.error('Error loading cases ledger:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [supabase]);

  const filteredCases = cases.filter(c => 
    c.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.case_reference && c.case_reference.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'extracting':
      case 'analyzing':
        return 'bg-info/10 text-info border-info/20 animate-pulse';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
      case 'failed':
        return 'bg-danger/10 text-danger border-danger/20';
      default:
        return 'bg-text-muted/10 text-text-secondary border-border-subtle';
    }
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-sans text-xl font-semibold tracking-tight text-text-primary">Case Processing Ledger</h2>
          <p className="text-xs text-text-secondary mt-1">Review active cognitive extractions, analysis status, and final scores.</p>
        </div>
        <Link
          href="/dashboard/cases/new"
          className="inline-flex h-9 items-center justify-center rounded-[6px] bg-brand-primary dark:bg-text-primary text-bg-surface dark:text-bg-base px-4 text-xs font-semibold hover:opacity-90 transition-opacity gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Document Case</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Filter by subject or reference ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-[6px] border border-border-default bg-bg-surface pl-10 pr-4 text-sm focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>
      </div>

      {/* Table Ledger Panel */}
      <div className="border border-border-default bg-bg-surface rounded-[8px] overflow-hidden shadow-sm transition-colors duration-200">
        {loading ? (
          <div className="divide-y divide-border-subtle">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-bg-base rounded w-1/4" />
                  <div className="h-3 bg-bg-base rounded w-1/3" />
                </div>
                <div className="h-8 bg-bg-base rounded w-20" />
              </div>
            ))}
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-base border-b border-border-subtle text-[11px] font-semibold uppercase tracking-wider text-text-secondary font-mono">
                  <th className="py-3 px-6">Subject Entity</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Primary Metric</th>
                  <th className="py-3 px-4 text-center font-mono">Documents</th>
                  <th className="py-3 px-4 text-center">Extraction Status</th>
                  <th className="py-3 px-4">Date Added</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-bg-base/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-sm text-text-primary">{c.subject_name}</div>
                      <div className="text-[10px] text-text-muted mt-0.5">Workflow Container</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-text-secondary">
                      {c.case_reference || '—'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-xs text-text-primary tabular-nums">
                      {c.primary_value !== null ? Number(c.primary_value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center font-mono text-xs text-text-primary bg-bg-base border border-border-subtle px-2.5 py-0.5 rounded-[4px] font-semibold">
                        {c.documents?.length || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyles(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-xs text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-text-muted" />
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/dashboard/cases/${c.id}`}
                        className="inline-flex h-8 items-center justify-center rounded-[6px] border border-border-default bg-bg-surface px-3 text-xs font-semibold text-text-secondary hover:text-brand-accent hover:border-brand-accent/30 transition-colors gap-1 group-hover:border-border-default"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-[8px] bg-bg-base text-text-muted mb-4 border border-border-subtle">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="font-sans text-base font-semibold text-text-primary">No cases created yet</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto mt-2 leading-relaxed">
              Synthesize your documents with multi-agent pipelines. Create a new case container to start document extraction.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/cases/new"
                className="inline-flex h-9 items-center justify-center rounded-[6px] bg-brand-accent text-bg-base px-4 text-xs font-semibold hover:opacity-90 transition-opacity gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Upload First Case</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
