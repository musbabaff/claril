'use client';

import { useState } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  last: string;
  created: string;
  expires?: string;
  revoked?: boolean;
  secret?: string;
}

const INITIAL_KEYS: ApiKey[] = [
  { id: "k_prod_001",  name: "Production · default",  prefix: "sk_live_4f7a_a7c1f0",      scopes: ["extract","schemas:read","ledger:read"],    last: "12s ago",   created: "2024-12-04" },
  { id: "k_etl_002",   name: "ETL pipeline",           prefix: "sk_live_4f7a_b8d217",      scopes: ["extract","webhooks:write"],                last: "1m ago",    created: "2025-02-19" },
  { id: "k_ci_003",    name: "GitHub Actions · CI",    prefix: "sk_test_4f7a_c4e092",      scopes: ["extract","schemas:read"],                  last: "1h ago",    created: "2025-08-30" },
  { id: "k_audit_004", name: "Auditor · KPMG",         prefix: "sk_live_4f7a_d401aa",      scopes: ["ledger:read"],                             last: "3d ago",    created: "2026-03-12", expires: "2026-06-12" },
  { id: "k_legacy_005",name: "Legacy ETL · revoke me", prefix: "sk_live_4f7a_e992cc",      scopes: ["extract"],                                 last: "184d ago",  created: "2024-04-01", revoked: true },
];

export default function KeysPage() {
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [revealed, setRevealed]     = useState<ApiKey | null>(null);
  const [copied, setCopied]         = useState<string | null>(null);
  const [keys, setKeys]             = useState<ApiKey[]>(INITIAL_KEYS);
  const [search, setSearch]         = useState<string>("");

  const createKey = (payload: { name: string; env: string; scopes: string[] }) => {
    const secret = "sk_" + payload.env + "_4f7a_" + Array.from({ length: 24 }).map(() => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    const newK: ApiKey = {
      id: "k_new_" + Date.now(),
      name: payload.name,
      prefix: secret.slice(0, 24),
      scopes: payload.scopes,
      last: "never used",
      created: "just now",
      secret,
    };
    setKeys([newK, ...keys]);
    setRevealed(newK);
    setCreateOpen(false);
  };

  const revoke = (id: string) => {
    if (confirm("Revoking this API key is irreversible. Automated workflows using it will fail immediately. Proceed?")) {
      setKeys(keys.map(k => k.id === id ? { ...k, revoked: true } : k));
    }
  };

  const copy = (id: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  };

  const filteredKeys = keys.filter(k => 
    k.name.toLowerCase().includes(search.toLowerCase()) || 
    k.prefix.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "API keys" }]}
        title="API Keys"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => alert("Loading developer SDK document reference. Claril Python + JS SDKs support direct ingestion hooks.")}>
              <Icon.Code size={12}/> SDK docs
            </button>
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Generate key</button>
          </>
        }
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]">
        {revealed && revealed.secret && (
          <div className="key-create-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>Your new key — copy it now</h3>
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 12.5 }}>
                  Claril never stores the plaintext. Once you close this card, it&apos;s only the prefix you&apos;ll see again.
                </p>
              </div>
              <button className="modal-x" onClick={() => setRevealed(null)}>✕</button>
            </div>
            <div className="key-result" style={{ marginTop: 12 }}>
              <Icon.Lock size={14}/>
              <code style={{ flex: 1, fontFamily: 'var(--f-mono)', fontSize: 13, color: 'var(--ink)' }}>{revealed.secret}</code>
              <button className={"copy-btn " + (copied === "new" ? "is-copied" : "")}
                      onClick={() => copy("new", revealed.secret || "")}>
                {copied === "new" ? "copied" : "copy"}
              </button>
            </div>
          </div>
        )}

        <section className="dash-sec">
          <header className="dash-sec-head">
            <h3 className="dash-sec-title">Active credentials ({keys.filter(k => !k.revoked).length})</h3>
            <div className="dash-sec-actions">
              <input className="search-input" style={{ height: 28, fontSize: 12, padding: "0 10px" }} 
                     placeholder="search keys…" value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
          </header>
          <div>
            {filteredKeys.map((k) => (
              <div key={k.id} className="key-row" style={k.revoked ? { opacity: 0.4 } : {}}>
                <div className="icon"><Icon.Lock size={14}/></div>
                <div className="name">
                  <b>{k.name}</b>
                  <span className="val">
                    <span>{k.prefix}……</span>
                    <button className={"copy-btn " + (copied === k.id ? "is-copied" : "")}
                            onClick={() => copy(k.id, k.prefix + "…")}>
                      {copied === k.id ? "copied" : "copy prefix"}
                    </button>
                  </span>
                </div>
                <div className="scopes">
                  {k.scopes.map((s) => <span key={s} className="scope-tag">{s}</span>)}
                </div>
                <span className="last">last used · {k.last}{k.expires ? ` · expires ${k.expires}` : ""}</span>
                <div className="actions">
                  {k.revoked ? <span className="dash-pill is-err">revoked</span>
                             : <button className="copy-btn" style={{ color: "var(--err)" }}
                                       onClick={() => revoke(k.id)}>revoke</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {createOpen && (
        <CreateKeyModal 
          onClose={() => setCreateOpen(false)} 
          onCreate={createKey}
        />
      )}
    </>
  );
}

function CreateKeyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (payload: { name: string; env: string; scopes: string[] }) => void }) {
  const [name, setName] = useState("");
  const [env, setEnv]   = useState("live");
  const [scopes, setScopes] = useState<Record<string, boolean>>({ extract: true, "schemas:read": true, "ledger:read": false, "webhooks:write": false });
  
  const flip = (k: string) => setScopes({ ...scopes, [k]: !scopes[k] });

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>Generate API key</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </header>
        <div className="modal-body">
          <div className="field">
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)', marginBottom: 5 }}>Key name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production · default" autoFocus
                   style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)" }}/>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)', marginBottom: 5 }}>Environment</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["live", "test"].map((e) => (
                <button key={e} className={"filter-chip " + (env === e ? "is-on" : "")}
                        onClick={() => setEnv(e)} style={{ border: '1px solid var(--hairline-2)', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>{e}</button>
              ))}
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)', marginBottom: 5 }}>Scopes</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {Object.keys(scopes).map((s) => (
                <label key={s} className="checkbox-row" style={{ display: 'flex', alignItems: "center", gap: 8, padding: "8px 10px", border: "1px solid var(--hairline-2)", borderRadius: 7, fontSize: 12.5, cursor: 'pointer' }}>
                  <input type="checkbox" checked={scopes[s]} onChange={() => flip(s)}/>
                  <span className="f-mono" style={{ color: "var(--ink)" }}>{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <footer className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                  onClick={() => onCreate({ name: name || "Untitled", env,
                                            scopes: Object.entries(scopes).filter(([, v]) => v).map(([k]) => k) })}>
            Generate <Icon.Arrow size={12}/>
          </button>
        </footer>
      </div>
    </div>
  );
}
