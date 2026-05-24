'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@/components/icons';

interface Log {
  id: string;
  created_at: string;
  action: string;
  metadata: Record<string, unknown>;
  case_id: string | null;
  userName: string;
  userRole: string;
}

interface Profile {
  id: string;
  name: string;
}

export default function AdminAudit() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Expandable row state (logId -> boolean)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setActions(data.uniqueActions);
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(log.metadata).toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter ? log.action === actionFilter : true;
      const matchesUser = userFilter ? log.userName === userFilter : true; // filter by formatted name matching dropdown

      return matchesSearch && matchesAction && matchesUser;
    });
  }, [logs, search, actionFilter, userFilter]);

  const handleExportCSV = () => {
    // Generate CSV query string based on filters
    let url = '/api/admin/audit?format=csv';
    if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
    
    // Find filtered user id to map accurately
    const targetProf = profiles.find(p => p.name === userFilter);
    if (targetProf) url += `&user_id=${targetProf.id}`;

    // Force browser direct download
    window.open(url, '_blank');
  };

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
      {/* Filters and CSV Export action card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm shadow-sm">
        <div className="flex-1 max-w-sm relative">
          <input
            type="text"
            placeholder="Search logs, metadata keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-subtle rounded-lg py-2 pl-9 pr-4 text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <span className="absolute left-3 top-2.5 text-text-muted">
            <Icon.Hash size={12} />
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All Security Actions</option>
            {actions.map(act => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          {/* User Filter */}
          <select
            value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All Platform Operators</option>
            {profiles.map(p => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            className="btn btn-primary px-3 py-2 text-xs font-mono flex items-center gap-1.5 rounded-lg shadow-sm"
          >
            <Icon.Sparkle size={13} className="text-amber-400" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Interactive Audit Logs list */}
      <div className="border border-border-subtle rounded-xl overflow-hidden bg-bg-surface/85 backdrop-blur-md shadow-sm">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-bg-surface-2 border-b border-border-subtle/80 text-[10px] uppercase tracking-wider text-text-muted">
                <th className="p-4 w-6"></th>
                <th className="p-4">Operator Name</th>
                <th className="p-4">Operator role</th>
                <th className="p-4">Logged Action</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Metadata Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-text-muted italic">
                    No matching security audit entries recorded.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isExpanded = !!expandedRows[log.id];
                  
                  // Label style based on action
                  const actionStyle =
                    log.action.startsWith('DANGER_ZONE') ? 'text-rose-400 bg-rose-500/10 border-rose-500/25' :
                    log.action.startsWith('USER_ROLE') ? 'text-blue-400 bg-blue-500/10 border-blue-500/25' :
                    'text-text-muted bg-bg-surface border-border-subtle';

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className={`hover:bg-bg-surface-2/20 transition-colors duration-150 cursor-pointer ${
                          isExpanded ? 'bg-bg-surface-2/10' : ''
                        }`}
                        onClick={() => toggleRow(log.id)}
                      >
                        <td className="p-4">
                          <span className={`text-[10px] text-text-muted transform inline-block transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}>
                            ▶
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-text-primary">{log.userName}</td>
                        <td className="p-4">
                          <span className="px-1.5 py-0.5 rounded text-[8px] border border-border-subtle text-text-muted">
                            {log.userRole.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${actionStyle}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-text-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            className="btn btn-secondary px-2.5 py-1 text-[10px] rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(log.id);
                            }}
                          >
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable JSON Detail Area */}
                      {isExpanded && (
                        <tr className="bg-black/15">
                          <td colSpan={6} className="p-4">
                            <div className="space-y-2 p-4 rounded-lg border border-border-subtle bg-bg-surface-2/50 select-text selection:bg-accent/15">
                              <div className="flex justify-between items-center text-[10px] text-text-muted border-b border-border-subtle/30 pb-2 font-mono">
                                <span>Event ID: {log.id}</span>
                                <span>Target Case Ref: {log.case_id || 'System level'}</span>
                              </div>
                              <pre className="text-[10px] text-text-primary leading-relaxed whitespace-pre-wrap font-mono max-h-[250px] overflow-y-auto thin-scroll">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
