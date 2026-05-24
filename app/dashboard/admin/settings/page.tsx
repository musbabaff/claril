'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';

interface PlatformSettings {
  default_ai_provider: string;
  max_file_size_mb: number;
  registration_open: boolean;
}

interface ProviderStatus {
  gemini: boolean;
  anthropic: boolean;
  openai: boolean;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings values
  const [settings, setSettings] = useState<PlatformSettings>({
    default_ai_provider: 'gemini',
    max_file_size_mb: 25,
    registration_open: true,
  });

  const [providers, setProviders] = useState<ProviderStatus>({
    gemini: false,
    anthropic: false,
    openai: false,
  });

  // Modals for Danger Zone
  const [confirmDangerAction, setConfirmDangerAction] = useState<'CLEAR_FAILED_CASES' | 'RESET_AUDIT_LOGS' | null>(null);
  const [dangerZoneInput, setDangerZoneInput] = useState('');

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setProviders(data.providerStatus);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        toast.success('Global platform configurations saved successfully.');
        await loadSettings();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update system variables.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDangerZoneAction = async () => {
    if (dangerZoneInput !== 'CONFIRM') {
      toast.error("Invalid verification. Please type 'CONFIRM' exactly.");
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmDangerAction }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Destructive action executed successfully.');
        setConfirmDangerAction(null);
        setDangerZoneInput('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Destructive action execution failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network failure executing danger zone operation.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 border border-border-subtle bg-bg-surface/50 rounded-xl space-y-6 animate-pulse">
        <div className="h-6 w-1/4 bg-border-subtle rounded" />
        <div className="h-[250px] bg-border-subtle rounded" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-[fadeIn_0.25s_ease-out]">
      {/* Left Form: General Platform Variables */}
      <div className="lg:col-span-2 p-6 rounded-xl border border-border-subtle bg-bg-surface/85 backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
            <Icon.Bolt size={14} className="text-accent" />
            Global Platform Configuration
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">Modify default platform behaviors and limits</p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 font-mono text-xs">
          {/* Default AI provider */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-text-muted uppercase">Default AI Complete Provider</label>
            <select
              value={settings.default_ai_provider}
              onChange={e => setSettings(prev => ({ ...prev, default_ai_provider: e.target.value }))}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent text-text-primary"
            >
              <option value="gemini">Gemini Network (Recommended / Free Tier)</option>
              <option value="anthropic">Anthropic Claude API</option>
              <option value="openai">OpenAI GPT Engine</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max file size */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-muted uppercase">Max Document Size (MB)</label>
              <input
                type="number"
                min={1}
                max={200}
                value={settings.max_file_size_mb}
                onChange={e => setSettings(prev => ({ ...prev, max_file_size_mb: parseInt(e.target.value) || 25 }))}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent text-text-primary"
              />
            </div>

            {/* Registration open switch */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-text-muted uppercase">Public Registration Open</label>
              <select
                value={settings.registration_open ? 'true' : 'false'}
                onChange={e => setSettings(prev => ({ ...prev, registration_open: e.target.value === 'true' }))}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2.5 focus:outline-none focus:border-accent text-text-primary"
              >
                <option value="true">Open (Anyone can register)</option>
                <option value="false">Closed (Invite/Admin only)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle/50 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary px-4 py-2.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              {saving ? (
                <>
                  <Icon.Loop className="animate-spin" size={13} />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Icon.Bolt size={13} />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: AI provider active status & Destructive Zone */}
      <div className="space-y-6">
        {/* AI provider keys active status */}
        <div className="p-5 rounded-xl border border-border-subtle bg-bg-surface/85 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wide flex items-center gap-1.5">
              <Icon.Sparkle size={14} className="text-purple-400 animate-pulse" />
              API Key Status Monitoring
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">Environmental provider key check</p>
          </div>

          <div className="space-y-3 font-mono text-[10px]">
            {Object.entries(providers).map(([provider, isConfigured]) => {
              const badgeStyle = isConfigured
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : 'text-text-muted bg-border-subtle/20 border-border-subtle/40';

              const nameColor =
                provider === 'anthropic' ? 'text-orange-400' :
                provider === 'openai' ? 'text-emerald-400' :
                'text-accent';

              return (
                <div key={provider} className="flex justify-between items-center p-3 rounded bg-bg-surface border border-border-subtle/50">
                  <span className={`font-bold capitalize ${nameColor}`}>{provider}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${badgeStyle}`}>
                    {isConfigured ? 'ACTIVE' : 'MISSING'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-5 rounded-xl border border-rose-500/30 bg-bg-surface/85 backdrop-blur-md space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
              <Icon.Shield size={14} />
              Danger Zone Operations
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">Irreversible system action panel</p>
          </div>

          <div className="space-y-2 pt-2">
            {/* Clear failed cases */}
            <button
              onClick={() => setConfirmDangerAction('CLEAR_FAILED_CASES')}
              className="w-full btn border border-rose-500/40 hover:bg-rose-500/10 text-rose-400 py-2.5 text-xs rounded-lg font-mono"
            >
              Clear Failed Cases
            </button>

            {/* Reset audit logs */}
            <button
              onClick={() => setConfirmDangerAction('RESET_AUDIT_LOGS')}
              className="w-full btn border border-rose-500/40 hover:bg-rose-500/10 text-rose-400 py-2.5 text-xs rounded-lg font-mono"
            >
              Reset Audit Trail Logs
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone Confirmation Modal */}
      {confirmDangerAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="p-6 rounded-2xl border border-rose-500/30 bg-bg-surface max-w-sm w-full space-y-4 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 font-mono">
              <Icon.Shield size={16} className="text-rose-400 animate-pulse" />
              CONFIRM DESTRUCTIVE OPERATION
            </h3>
            <p className="text-xs text-text-muted leading-relaxed font-mono">
              Are you sure you want to execute: <strong>{confirmDangerAction}</strong>? This action is absolutely irreversible and permanent.
            </p>
            <div className="space-y-1.5 font-mono text-[10px]">
              <label className="text-text-muted uppercase">Type &apos;CONFIRM&apos; to verify:</label>
              <input
                type="text"
                placeholder="Type CONFIRM here"
                value={dangerZoneInput}
                onChange={e => setDangerZoneInput(e.target.value)}
                className="w-full bg-bg-surface border border-border-subtle rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-rose-400 font-mono text-text-primary"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setConfirmDangerAction(null);
                  setDangerZoneInput('');
                }}
                className="btn btn-secondary px-3 py-1.5 text-xs rounded-lg font-mono"
              >
                Abort
              </button>
              <button
                onClick={handleDangerZoneAction}
                disabled={dangerZoneInput !== 'CONFIRM'}
                className="btn bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-bg-surface px-3 py-1.5 text-xs rounded-lg font-bold font-mono"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
