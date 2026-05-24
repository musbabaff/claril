'use client';

import { useState, useEffect, useMemo } from 'react';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  organization: string;
  caseCount: number;
  aiCost: number;
  created_at: string;
}

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  
  // Selection/editing states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ user: User; newRole: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch platform users:', err);
    }
  };

  const fetchAdminSession = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdminId(user.id);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAdminSession()]);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRoleChange = async (user: User, newRole: string) => {
    if (user.id === currentAdminId) {
      toast.error('Self-demotion block: You cannot downgrade your own administrator role.');
      return;
    }
    setConfirmRoleChange({ user, newRole });
  };

  const executeRoleChange = async () => {
    if (!confirmRoleChange) return;
    const { user, newRole } = confirmRoleChange;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        toast.success(`Operator role updated successfully for ${user.fullName}`);
        setConfirmRoleChange(null);
        await fetchUsers(); // reload users
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update user role.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating operator role.');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.fullName.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        u.organization.toLowerCase().includes(search.toLowerCase());
      
      const matchesRole = roleFilter ? u.role === roleFilter : true;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

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
      {/* Control panel and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border-subtle bg-bg-surface/65 backdrop-blur-sm shadow-sm">
        <div className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Search platform operators by name, organization, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-bg-surface border border-border-subtle rounded-lg py-2 pl-9 pr-4 text-xs font-mono placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <span className="absolute left-3 top-2.5 text-text-muted">
            <Icon.Logo size={12} />
          </span>
        </div>

        <div className="flex gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-accent"
          >
            <option value="">All Operator Roles</option>
            <option value="admin">Administrators</option>
            <option value="reviewer">Reviewers</option>
            <option value="analyst">Analysts</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="border border-border-subtle rounded-xl overflow-hidden bg-bg-surface/85 backdrop-blur-md shadow-sm">
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-bg-surface-2 border-b border-border-subtle/80 text-[10px] uppercase tracking-wider text-text-muted">
                <th className="p-4">Operator Info</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Authorization</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4">Cases count</th>
                <th className="p-4">Compute Cost</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-muted italic">
                    No matching platform operators found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isSelf = user.id === currentAdminId;
                  const roleBadge = 
                    user.role === 'admin' ? 'bg-accent/10 text-accent border-accent/25' :
                    user.role === 'reviewer' ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' :
                    'bg-text-muted/10 text-text-muted border-text-muted/20';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-bg-surface-2/30 transition-colors duration-150 ${
                        isSelf ? 'bg-accent/5' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-text-primary">{user.fullName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.2 text-[8px] font-bold rounded-full bg-accent text-bg-surface uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-text-muted opacity-80">{user.email}</div>
                        </div>
                      </td>
                      <td className="p-4 text-text-muted">{user.organization}</td>
                      <td className="p-4">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${roleBadge}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 font-bold text-text-primary">{user.caseCount}</td>
                      <td className="p-4 text-accent font-semibold">${user.aiCost.toFixed(4)}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Role edit select */}
                          <select
                            value={user.role}
                            disabled={isSelf}
                            onChange={e => handleRoleChange(user, e.target.value)}
                            className="bg-bg-surface border border-border-subtle rounded px-2 py-1 text-[10px] font-mono text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                          >
                            <option value="analyst">Analyst</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            onClick={() => setSelectedUser(user)}
                            className="btn btn-secondary px-2 py-1 text-[10px] flex items-center gap-1 rounded"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Overlays / Modals */}
      {confirmRoleChange && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="p-6 rounded-2xl border border-border-subtle bg-bg-surface max-w-sm w-full space-y-4 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Icon.Shield className="text-accent animate-pulse" size={16} />
              Confirm Operator Authorization Shift
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Are you sure you want to shift <strong>{confirmRoleChange.user.fullName}</strong>&apos;s role to <strong>{confirmRoleChange.newRole.toUpperCase()}</strong>?
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmRoleChange(null)}
                className="btn btn-secondary px-3 py-1.5 text-xs rounded-lg"
              >
                Abort
              </button>
              <button
                onClick={executeRoleChange}
                className="btn btn-primary px-3 py-1.5 text-xs rounded-lg shadow-sm"
              >
                Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detailed Inspectors */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md h-full bg-bg-surface border-l border-border-subtle p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden animate-[slideLeft_0.3s_ease-out]">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-accent/5 rounded-full filter blur-[60px] pointer-events-none" />
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono tracking-widest bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                    Operator Inspector
                  </span>
                  <h3 className="text-base font-extrabold text-text-primary mt-2">
                    {selectedUser.fullName}
                  </h3>
                  <p className="text-[10px] text-text-muted font-mono">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded hover:bg-bg-surface-2 border border-border-subtle/50 text-text-muted"
                >
                  <Icon.Loop size={12} className="rotate-45" />
                </button>
              </div>

              {/* Data fields */}
              <div className="space-y-4 border-t border-border-subtle/50 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border-subtle bg-bg-surface-2/30">
                    <span className="text-[9px] text-text-muted uppercase font-mono">Platform cases</span>
                    <p className="text-sm font-bold font-mono text-text-primary mt-1">{selectedUser.caseCount}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border-subtle bg-bg-surface-2/30">
                    <span className="text-[9px] text-text-muted uppercase font-mono">Billed cost</span>
                    <p className="text-sm font-bold font-mono text-accent mt-1">${selectedUser.aiCost.toFixed(4)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-border-subtle/20 py-2 text-[10px]">
                    <span className="text-text-muted font-mono">Organization</span>
                    <span className="text-text-primary font-semibold font-mono">{selectedUser.organization}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle/20 py-2 text-[10px]">
                    <span className="text-text-muted font-mono">Joined Date</span>
                    <span className="text-text-primary font-mono">{new Date(selectedUser.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle/20 py-2 text-[10px]">
                    <span className="text-text-muted font-mono">Authorization role</span>
                    <span className="text-text-primary font-semibold font-mono">{selectedUser.role.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-subtle/20 py-2 text-[10px]">
                    <span className="text-text-muted font-mono">Operator ID</span>
                    <span className="text-text-muted font-mono select-all truncate max-w-[200px]" title={selectedUser.id}>
                      {selectedUser.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="w-full btn btn-secondary py-2 rounded-lg text-xs"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
