'use client';

import { useState, useEffect } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'org' | 'tenants' | 'webhooks' | 'danger';

interface SettingsBlockProps {
  title: string;
  desc?: string;
  children: React.ReactNode;
  foot?: React.ReactNode;
}

function SettingsBlock({ title, desc, children, foot }: SettingsBlockProps) {
  return (
    <div className="settings-block">
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {children}
      {foot && <div className="settings-foot">{foot}</div>}
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('analyst');
  const [subdomain, setSubdomain] = useState('acme');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserEmail(user.email || '');

        // Load public profile via secure server-side API to bypass client RLS recursive policies
        const res = await fetch('/api/profile');
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setFullName(data.full_name || '');
            setOrgName(data.organization_name || '');
            setUserRole(data.role || 'analyst');
            if (data.organization_name) {
              setSubdomain(data.organization_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'acme');
            }
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication session expired.');
        return;
      }

      // Save public profile via secure server-side API to bypass client RLS recursive policies
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          organization_name: orgName,
          role: userRole
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save settings.');
      }

      toast.success('Profile settings saved successfully!');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred while updating profile.';
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (!fullName) return 'EK';
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // ------------------------------------------------------------------
  // SUB-COMPONENTS RENDERED WITHIN PAGE STATE
  // ------------------------------------------------------------------

  // 1. Profile Panel
  const renderProfile = () => (
    <SettingsBlock 
      title="Profile" 
      desc="This information appears on case activity and the audit ledger."
      foot={
        <>
          <button className="btn btn-ghost" onClick={() => { setFullName(''); setOrgName(''); }}>Reset</button>
          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <span className="av is-large" style={{ width: 64, height: 64, fontSize: 18 }}>
          {getInitials()}
        </span>
        <div>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 13.5 }}>
            Avatar derived from your initials. Upload a custom one — used in the team list and audit log.
          </p>
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => alert("Avatar uploading is disabled in sandbox mode.")}>
            Upload image
          </button>
        </div>
      </div>
      <div className="grid">
        <div className="field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="E.g., Elif Karaca"/>
        </div>
        <div className="field">
          <label>Work email</label>
          <input value={userEmail} disabled style={{ background: "var(--bg-alt)", color: "var(--muted)" }}/>
          <span className="hint">Email changes go through your IdP.</span>
        </div>
        <div className="field">
          <label>Title / Role</label>
          <input value={userRole.toUpperCase()} disabled style={{ background: "var(--bg-alt)", color: "var(--muted)" }}/>
          <span className="hint">Permitted role hierarchy from database.</span>
        </div>
        <div className="field">
          <label>Timezone</label>
          <select defaultValue="Europe/Istanbul">
            <option>Europe/Istanbul</option>
            <option>Europe/Berlin</option>
            <option>America/New_York</option>
            <option>Asia/Singapore</option>
          </select>
        </div>
        <div className="field">
          <label>Locale</label>
          <select defaultValue="en-GB">
            <option>en-GB</option>
            <option>en-US</option>
            <option>de-DE</option>
            <option>tr-TR</option>
          </select>
        </div>
      </div>
    </SettingsBlock>
  );

  // 2. Security Panel
  const [mfaKeys, setMfaKeys] = useState([
    { id: "1", name: "YubiKey 5C", added: "2025-08-30", lastUsed: "12s ago", detail: "last used 12s ago" },
    { id: "2", name: "1Password TOTP", added: "2025-01-04", lastUsed: "fallback only", detail: "fallback only" }
  ]);

  const handleAddMfa = () => {
    const name = prompt("Enter WebAuthn Key Name (e.g. Google Pixel Key):");
    if (name) {
      setMfaKeys([...mfaKeys, {
        id: Date.now().toString(),
        name,
        added: new Date().toISOString().split('T')[0],
        lastUsed: "never used yet",
        detail: "newly added key"
      }]);
      toast.success("Successfully registered WebAuthn key!");
    }
  };

  const handleRemoveMfa = (id: string) => {
    if (confirm("Are you sure you want to remove this WebAuthn factor?")) {
      setMfaKeys(mfaKeys.filter(k => k.id !== id));
      toast.success("MFA factor removed.");
    }
  };

  const renderSecurity = () => (
    <>
      <SettingsBlock 
        title="Password" 
        desc="Required for fallback when WebAuthn is unavailable."
        foot={<button className="btn btn-primary" onClick={() => toast.success("Password update link dispatched to work email.")}>Update password</button>}
      >
        <div className="grid">
          <div className="field"><label>Current password</label><input type="password"/></div>
          <div className="field"><label>New password</label><input type="password"/></div>
        </div>
      </SettingsBlock>

      <SettingsBlock title="Multi-factor authentication" desc="WebAuthn keys are checked first; TOTP is a fallback.">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {mfaKeys.map((key) => (
            <div 
              key={key.id} 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "12px 14px", 
                background: "var(--surface-2)", 
                borderRadius: 8, 
                border: "1px solid var(--hairline)" 
              }}
            >
              <div>
                <b style={{ fontSize: 13.5, color: "var(--ink)" }}>{key.name}</b>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>
                  added {key.added} · {key.detail}
                </p>
              </div>
              <button className="copy-btn" style={{ color: "var(--err)" }} onClick={() => handleRemoveMfa(key.id)}>
                remove
              </button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={handleAddMfa}>
            + Add WebAuthn key
          </button>
        </div>
      </SettingsBlock>
    </>
  );

  // 3. Notifications Panel
  const renderNotifications = () => {
    const channels = [
      ["Case completes",         "email + slack"],
      ["Schema validation fails","slack"],
      ["Quota >80%",             "email"],
      ["API key revoked",        "email + slack"],
      ["Team member invited",    "email"],
      ["Billing receipts",       "email"],
    ];
    return (
      <SettingsBlock 
        title="Notifications" 
        desc="Choose where each event lands. Audit ledger entries are always immutable; this only controls humans."
        foot={<button className="btn btn-primary" onClick={() => toast.success("Notification preferences updated successfully!")}>Save preferences</button>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: 10, overflow: "hidden" }}>
          {channels.map(([k, v]) => (
            <label key={k} style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10, padding: "12px 14px", background: "var(--surface)", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{k}</span>
              <select defaultValue={v} style={{ font: "inherit", padding: "6px 10px", border: "1px solid var(--hairline-2)", borderRadius: 6, background: "var(--surface-2)", fontFamily: "var(--f-mono)", fontSize: 12 }}>
                <option>off</option>
                <option>email</option>
                <option>slack</option>
                <option>email + slack</option>
                <option>webhook</option>
              </select>
            </label>
          ))}
        </div>
      </SettingsBlock>
    );
  };

  // 4. Org Panel
  const renderOrg = () => (
    <SettingsBlock 
      title="Organization" 
      desc="Visible on invoices and the API audit log."
      foot={<button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>Save changes</button>}
    >
      <div className="grid">
        <div className="field">
          <label>Legal name</label>
          <input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Industrial Co."/>
        </div>
        <div className="field">
          <label>Tax ID</label>
          <input defaultValue="DE 812 567 894" className="f-mono"/>
        </div>
        <div className="field" style={{ gridColumn: "1 / -1" }}>
          <label>Billing address</label>
          <textarea rows={3} defaultValue={"1 Hudson Yards\nNew York, NY 10001\nUnited States"}/>
        </div>
        <div className="field">
          <label>Tenant subdomain</label>
          <div className="input-prefix">
            <span>https://</span>
            <input value={subdomain} onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}/>
            <span style={{ borderRight: 0, borderLeft: "1px solid var(--hairline-2)" }}>.claril.dev</span>
          </div>
        </div>
        <div className="field">
          <label>Industry</label>
          <select defaultValue="manufacturing">
            <option>manufacturing</option>
            <option>finance</option>
            <option>healthcare</option>
            <option>logistics</option>
            <option>other</option>
          </select>
        </div>
      </div>
    </SettingsBlock>
  );

  // 5. Tenants Panel
  const renderTenants = () => {
    const TENANTS = [
      { id: "org_4f7a",      name: "Acme Industrial · prod", region: "eu-west-1", state: "primary" },
      { id: "org_4f7a_eu2",  name: "Acme Industrial · prod-secondary", region: "eu-central-1", state: "warm-standby" },
      { id: "org_4f7a_test", name: "Acme Industrial · sandbox", region: "us-east-1",  state: "sandbox" },
    ];
    return (
      <SettingsBlock title="Tenants &amp; regions" desc="Each tenant is bound to a region. RLS policies follow the tenant; data never crosses regions.">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TENANTS.map((t) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "32px 1fr auto auto", gap: 12, alignItems: "center", padding: "14px 16px", border: "1px solid var(--hairline)", borderRadius: 10, background: "var(--surface)" }}>
              <span className="region-iso">{t.region.slice(0, 2).toUpperCase()}</span>
              <div>
                <b style={{ fontSize: 13.5 }}>{t.name}</b>
                <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: 11, fontFamily: "var(--f-mono)" }}>{t.id} · {t.region}</p>
              </div>
              <span className={`dash-pill ${t.state === "primary" ? "is-on" : "is-ok"}`}>{t.state}</span>
              <button className="copy-btn" onClick={() => toast.info(`Orchestration routing for tenant ${t.id} requested.`)}>manage</button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={() => toast.info("Creating tenant in isolated region is disabled in sandbox tier.")}>
            + Add tenant in another region
          </button>
        </div>
      </SettingsBlock>
    );
  };

  // 6. Webhooks Panel
  const [webhooks, setWebhooks] = useState([
    { url: "https://acme.dev/claril/case-complete", events: 3, last: "200 · 218ms · 12s ago", state: "on" as const },
    { url: "https://acme.dev/claril/audit-export",   events: 1, last: "200 · 89ms · 1d ago",   state: "on" as const },
    { url: "https://acme.dev/claril/x-legacy",       events: 5, last: "504 · 8m ago · backing off", state: "warn" as const },
  ]);

  const handleAddWebhook = () => {
    const url = prompt("Enter Webhook Destination Endpoint URL:");
    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        toast.error("Endpoint must be a valid HTTP or HTTPS address.");
        return;
      }
      setWebhooks([...webhooks, {
        url,
        events: 0,
        last: "Pending initial payload",
        state: "on"
      }]);
      toast.success("Webhook endpoint registered. Signature key dispatched.");
    }
  };

  const renderWebhooks = () => (
    <SettingsBlock title="Webhooks" desc="Claril signs every webhook with your tenant's secret. Failed deliveries retry with exponential backoff for 24h.">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {webhooks.map((w, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 200px 80px", gap: 14, alignItems: "center", padding: "14px 16px", border: "1px solid var(--hairline)", borderRadius: 10, background: "var(--surface)" }}>
            <span className="f-mono" style={{ fontSize: 12.5, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {w.url}
            </span>
            <span className="f-mono" style={{ fontSize: 11, color: "var(--muted)" }}>{w.events} events</span>
            <span className="f-mono" style={{ fontSize: 11, color: w.state === "warn" ? "var(--warn)" : "var(--muted)" }}>{w.last}</span>
            <span className={`dash-pill ${w.state === "warn" ? "is-warn" : "is-ok"}`}>{w.state}</span>
          </div>
        ))}
        <button className="btn btn-primary" style={{ alignSelf: "flex-start", marginTop: 6 }} onClick={handleAddWebhook}>
          + Add webhook
        </button>
      </div>
    </SettingsBlock>
  );

  // 7. Danger Zone
  const [confirmSubdomain, setConfirmSubdomain] = useState('');

  const handleDeleteTenant = () => {
    if (confirmSubdomain === subdomain) {
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 3000)),
        {
          loading: 'Draining worker pipelines and zeroing storage arrays...',
          success: 'Tenant permanently purged. Subdomain released.',
          error: 'Purge failed.'
        }
      );
    } else {
      toast.error("Subdomain mismatch. Confirmation rejected.");
    }
  };

  const renderDanger = () => (
    <SettingsBlock 
      title="Delete tenant" 
      desc="This shuts down all pipelines and seals the audit ledger. The ledger remains queryable for 90 days, then is permanently destroyed." 
      foot={null}
    >
      <div className="settings-block danger-zone" style={{ border: 0, padding: 0, background: "transparent" }}>
        <ul style={{ margin: "0 0 18px", padding: "0 0 0 18px", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.7 }}>
          <li>All workers are drained and shut down within 5 minutes.</li>
          <li>Open invoices remain payable; no further usage is billed.</li>
          <li>Document blobs in object storage are encrypted-zeroed within 24h.</li>
          <li>The audit ledger is sealed (no more appends) and retained for 90 days for legal continuity, then destroyed.</li>
        </ul>
        <div className="field" style={{ maxWidth: 360 }}>
          <label>Type the tenant subdomain to confirm</label>
          <input 
            placeholder={subdomain} 
            className="f-mono"
            value={confirmSubdomain}
            onChange={(e) => setConfirmSubdomain(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button 
            className="btn-danger" 
            disabled={confirmSubdomain !== subdomain}
            onClick={handleDeleteTenant}
          >
            Delete tenant permanently
          </button>
        </div>
      </div>
    </SettingsBlock>
  );

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Settings" }]}
        title="Settings"
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
        <div className="settings-shell">
          <aside className="settings-side">
            <span className="h">account</span>
            <a className={tab === "profile" ? "is-on" : ""} onClick={() => setTab("profile")}>
              <Icon.Shield size={14}/> Profile
            </a>
            <a className={tab === "security" ? "is-on" : ""} onClick={() => setTab("security")}>
              <Icon.Lock size={14}/> Security
            </a>
            <a className={tab === "notifications" ? "is-on" : ""} onClick={() => setTab("notifications")}>
              <Icon.Sparkle size={14}/> Notifications
            </a>
            <span className="h">organization</span>
            <a className={tab === "org" ? "is-on" : ""} onClick={() => setTab("org")}>
              <Icon.Grid size={14}/> Organization
            </a>
            <a className={tab === "tenants" ? "is-on" : ""} onClick={() => setTab("tenants")}>
              <Icon.Branch size={14}/> Tenants &amp; regions
            </a>
            <a className={tab === "webhooks" ? "is-on" : ""} onClick={() => setTab("webhooks")}>
              <Icon.Code size={14}/> Webhooks
            </a>
            <span className="h">danger</span>
            <a className={tab === "danger" ? "is-on" : ""} onClick={() => setTab("danger")} style={{ color: "var(--err)" }}>
              <Icon.Bolt size={14}/> Delete tenant
            </a>
          </aside>

          <div className="settings-form">
            {loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-4 bg-bg-base rounded w-1/4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="h-10 bg-bg-base rounded" />
                  <div className="h-10 bg-bg-base rounded" />
                </div>
              </div>
            ) : (
              <>
                {tab === "profile" && renderProfile()}
                {tab === "security" && renderSecurity()}
                {tab === "notifications" && renderNotifications()}
                {tab === "org" && renderOrg()}
                {tab === "tenants" && renderTenants()}
                {tab === "webhooks" && renderWebhooks()}
                {tab === "danger" && renderDanger()}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
