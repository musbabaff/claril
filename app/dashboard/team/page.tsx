'use client';

import { useState } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';

interface Member {
  name: string;
  email: string;
  role: string;
  mfa: boolean;
  last: string;
}

const MEMBERS: Member[] = [
  { name: "Elif Karaca",      email: "elif@heliotrope.capital",  role: "owner",  mfa: true,  last: "active now" },
  { name: "Tomas Köhler",     email: "tomas@heliotrope.capital", role: "admin",  mfa: true,  last: "12m ago" },
  { name: "Maria Lima",       email: "maria@heliotrope.capital", role: "developer", mfa: true, last: "1h ago" },
  { name: "Jonas Berg",       email: "jonas@heliotrope.capital", role: "developer", mfa: false, last: "3d ago" },
  { name: "Asha Patel",       email: "asha@heliotrope.capital",  role: "viewer", mfa: true,  last: "2w ago" },
  { name: "auditor@kpmg.com", email: "auditor@kpmg.com",         role: "viewer", mfa: true,  last: "external · time-bound" },
];

const RBAC_ROWS = [
  ["View cases",                ["allow", "allow", "allow", "allow"]],
  ["Create cases",              ["allow", "allow", "allow", "deny"]],
  ["Edit schemas",              ["allow", "allow", "cond", "deny"]],
  ["Publish schema version",    ["allow", "allow", "deny", "deny"]],
  ["Issue API keys",            ["allow", "allow", "cond", "deny"]],
  ["Revoke API keys",           ["allow", "allow", "deny", "deny"]],
  ["Invite members",            ["allow", "allow", "deny", "deny"]],
  ["Change billing plan",       ["allow", "deny", "deny", "deny"]],
  ["Delete tenant",             ["allow", "deny", "deny", "deny"]],
  ["Read audit ledger",         ["allow", "allow", "allow", "allow"]],
  ["Export audit ledger",       ["allow", "allow", "cond", "deny"]],
];

const RBAC_LABELS: Record<string, string> = { allow: "allow", deny: "—", cond: "with approval" };

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [inviteOpen, setInviteOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const sendInvite = (payload: { name: string; email: string; role: string }) => {
    setMembers([...members, { ...payload, mfa: false, last: "invited just now" }]);
    setInviteOpen(false);
  };

  const updateMemberRole = (email: string, role: string) => {
    setMembers(members.map(m => m.email === email ? { ...m, role } : m));
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Team" }]}
        title="Team"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => alert("Auditing access scopes across regional clusters.")}>
              <Icon.Shield size={12}/> Audit access
            </button>
            <button className="btn btn-primary" onClick={() => setInviteOpen(true)}>+ Invite member</button>
          </>
        }
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
        <div className="stat-grid">
          {[
            { k: "Members",          v: String(members.length), sub: "incl. 1 external" },
            { k: "MFA enrolled",     v: `${members.filter(m => m.mfa).length} / ${members.length}`, sub: "WebAuthn or TOTP" },
            { k: "Admin roles",      v: String(members.filter(m => m.role === "owner" || m.role === "admin").length), sub: "policy violations: 0" },
            { k: "Session lifetime", v: "12h",   sub: "shortened from 30d default" },
          ].map((s) => (
            <div className="stat-card" key={s.k}>
              <span className="stat-k">{s.k}</span>
              <span className="stat-v">{s.v}</span>
              <span className="stat-sub"><span className="delta">{s.sub}</span></span>
            </div>
          ))}
        </div>

        <section className="dash-sec" style={{ marginTop: 20 }}>
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Members ({members.length})</h3>
            <div className="dash-sec-actions">
              <input className="search-input" style={{ height: 28, fontSize: 12, padding: "0 10px" }} 
                     placeholder="search members…" value={search} onChange={(e) => setSearch(e.target.value)}/>
              <span className="filter-chip">role · all</span>
            </div>
          </header>
          <div>
            {filteredMembers.map((m) => (
              <div className="member-row" key={m.email}>
                <span className="av is-large">{m.name.split(/\s+/).map(s => s[0]).slice(0, 2).join("")}</span>
                <div className="member-name">
                  <b>{m.name}</b>
                  <span>{m.email}</span>
                </div>
                <select value={m.role} onChange={(e) => updateMemberRole(m.email, e.target.value)}
                        style={{ font: "inherit", fontSize: 12, padding: "5px 9px", border: "1px solid var(--hairline-2)", borderRadius: 6, background: "var(--surface)", color: "var(--ink)", cursor: 'pointer' }}>
                  {["owner","admin","developer","viewer"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <span className={"member-mfa " + (m.mfa ? "is-on" : "is-off")}>
                  {m.mfa ? "✓ MFA on" : "! MFA off"}
                </span>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 11, color: "var(--muted)" }}>{m.last}</span>
                <button className="member-actions" onClick={() => alert(`Settings configured for ${m.name}`)}>⋯</button>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-sec" style={{ marginTop: 22 }}>
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Permissions · RBAC matrix</h3>
            <div className="dash-sec-actions">
              <span className="dash-pill">v4 · in effect</span>
              <button className="btn btn-link" onClick={() => alert("Policy changes require multi-sig approval. Edit via console.config")}>Edit roles →</button>
            </div>
          </header>
          <table className="rbac-grid" style={{ margin: 0, border: 0, borderRadius: 0 }}>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Owner</th>
                <th>Admin</th>
                <th>Developer</th>
                <th>Viewer</th>
              </tr>
            </thead>
            <tbody>
              {RBAC_ROWS.map(([perm, cells]) => (
                <tr key={perm as string}>
                  <td>{perm as string}</td>
                  {(cells as string[]).map((c, i) => (
                    <td key={i} className={c}>{RBAC_LABELS[c]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {inviteOpen && (
        <InviteModal 
          onClose={() => setInviteOpen(false)} 
          onInvite={sendInvite}
        />
      )}
    </>
  );
}

function InviteModal({ onClose, onInvite }: { onClose: () => void; onInvite: (payload: { name: string; email: string; role: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("developer");
  
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>Invite member</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </header>
        <div className="modal-body">
          <div className="field">
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)', marginBottom: 5 }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="teammate@yourcompany.com" autoFocus
                   style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)" }}/>
            <span className="hint" style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4, display: "block" }}>A signed invitation link valid for 7 days is sent to this address.</span>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)', marginBottom: 5 }}>Display name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Maria Lima"
                   style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)" }}/>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)', marginBottom: 5 }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
                    style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)" }}>
              <option value="admin">Admin · everything except billing &amp; deletion</option>
              <option value="developer">Developer · cases + schemas + keys (with approval)</option>
              <option value="viewer">Viewer · read-only across cases &amp; ledger</option>
            </select>
            <span className="hint" style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4, display: "block" }}>Roles can be changed at any time. RBAC matrix below shows exact permissions.</span>
          </div>
          <label className="checkbox-row" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14 }}>
            <input type="checkbox" defaultChecked/>
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Require WebAuthn enrollment before this member can access production tenants.</span>
          </label>
        </div>
        <footer className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                  onClick={() => onInvite({ name: name || email.split("@")[0], email, role })}
                  disabled={!email}>
            Send invitation <Icon.Arrow size={12}/>
          </button>
        </footer>
      </div>
    </div>
  );
}
