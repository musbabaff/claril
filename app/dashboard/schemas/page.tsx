'use client';

import { useState } from 'react';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';

type SchemaField = [string, string, string, string];

interface Schema {
  id: string;
  name: string;
  tag: string;
  updated: string;
  type: string;
  desc: string;
  fields: SchemaField[];
}

const SCHEMA_LIB: Schema[] = [
  { 
    id: "invoice",  
    name: "Invoice",          
    tag: "v2.3", 
    updated: "2d ago",  
    type: "system",
    desc: "Vendor, line items, tax, currency, dues — covers ~98% of B2B invoices.",
    fields: [
      ["vendor",      "string",  "required", "Legal name of the issuing entity"],
      ["invoice_no",  "string",  "required", "Vendor-issued invoice number"],
      ["issued",      "date",    "required", "ISO-8601 date of issue"],
      ["due",         "date",    "required", "ISO-8601 due date"],
      ["currency",    "iso4217", "required", "3-letter currency code"],
      ["subtotal",    "decimal", "required", "Pre-tax amount"],
      ["tax",         "decimal", "required", "Tax amount, defaults to 0"],
      ["total",       "decimal", "required", "Inclusive total"],
      ["line_items",  "array",   "optional", "Itemised lines, max 256"],
      ["payment_terms","string", "optional", "Net 30, 45, etc."],
    ] 
  },
  { 
    id: "stmt",    
    name: "BankStatement",    
    tag: "v1.8", 
    updated: "11d ago", 
    type: "system",
    desc: "Account, period, opening/closing balance, transactions[].",
    fields: [
      ["account",        "string",  "required", "Masked account number"],
      ["institution",    "string",  "required", "Bank or broker name"],
      ["period_start",   "date",    "required", "Statement period start"],
      ["period_end",     "date",    "required", "Statement period end"],
      ["opening_balance","decimal", "required", ""],
      ["closing_balance","decimal", "required", ""],
      ["transactions",   "array",   "required", "Itemised transactions"],
      ["currency",       "iso4217", "required", ""],
    ] 
  },
  { 
    id: "po",      
    name: "PurchaseOrder",    
    tag: "v1.4", 
    updated: "1mo ago", 
    type: "system",
    desc: "Buyer, shipper, line items, ship date, totals.",
    fields: [
      ["po_number",      "string",  "required", ""],
      ["vendor",         "string",  "required", ""],
      ["buyer",          "string",  "required", ""],
      ["ship_date",      "date",    "required", ""],
      ["line_items",     "array",   "required", ""],
      ["total",          "decimal", "required", ""],
    ] 
  },
  { 
    id: "kyc-w9",  
    name: "KYC.W9",           
    tag: "v3.0", 
    updated: "3d ago",  
    type: "system",
    desc: "Form W-9: legal entity, tax classification, TIN, signature.",
    fields: [
      ["legal_name",         "string",  "required", ""],
      ["tax_classification", "enum",    "required", "individual | c_corp | s_corp | …"],
      ["tin",                "string",  "required", "Encrypted at rest"],
      ["signature_present",  "bool",    "required", ""],
      ["signed_at",          "date",    "optional", ""],
    ] 
  },
  { 
    id: "freight", 
    name: "FreightBoL",       
    tag: "v0.9 draft", 
    updated: "today", 
    type: "draft",
    desc: "Bill of Lading. Drafted by Maria · pending review.",
    fields: [
      ["bol_number",     "string",  "required", ""],
      ["shipper",        "string",  "required", ""],
      ["consignee",      "string",  "required", ""],
      ["shipment_date",  "date",    "required", ""],
      ["packages",       "integer", "required", ""],
      ["weight_kg",      "decimal", "required", ""],
    ] 
  },
  { 
    id: "rcpt",    
    name: "Receipt",          
    tag: "v1.1", 
    updated: "2mo ago", 
    type: "system",
    desc: "Merchant, items, payment method, totals.",
    fields: [
      ["merchant",     "string",  "required", ""],
      ["items",        "array",   "optional", ""],
      ["payment_method","string", "optional", ""],
      ["total",        "decimal", "required", ""],
      ["currency",     "iso4217", "required", ""],
    ] 
  },
];

export default function SchemasPage() {
  const [activeId, setActiveId] = useState<string>(SCHEMA_LIB[0].id);
  const [modal, setModal] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [items, setItems] = useState<Schema[]>(SCHEMA_LIB);
  
  const active = items.find((s) => s.id === activeId) ?? items[0];

  const onCreate = (payload: { name: string; desc: string }) => {
    const id = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (items.some((i) => i.id === id)) return;
    setItems([{ id, ...payload, tag: "v0.1 draft", updated: "just now", type: "draft", fields: [] }, ...items]);
    setActiveId(id);
    setModal(null);
  };

  const onDelete = () => {
    setItems(items.filter((i) => i.id !== confirmDel));
    if (activeId === confirmDel) setActiveId(items[0]?.id);
    setConfirmDel(null);
  };

  return (
    <>
      <DashboardTopbar
        crumbs={[{ label: "Acme Industrial · prod" }, { label: "Schemas" }]}
        title="Schemas"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => alert("JSON Import is being compiled. Request a customizable builder view to specify target templates!")}>
              <Icon.Code size={12}/> Import JSON Schema
            </button>
            <button className="btn btn-primary" onClick={() => setModal("create")}>+ New schema</button>
          </>
        }
      />

      <div className="dash-body">
        <div className="split-panel">
          <aside className="split-list">
            <header className="split-list-h">
              <span>{items.length} schemas</span>
              <button onClick={() => setModal("create")}>+ new</button>
            </header>
            <ul className="split-items thin-scroll">
              {items.map((s) => (
                <li key={s.id}
                    className={"split-item " + (s.id === activeId ? "is-on" : "")}
                    onClick={() => setActiveId(s.id)}>
                  <div className="split-item-h">
                    <span>{s.name}</span>
                    <span className="tag">{s.tag}</span>
                  </div>
                  <span className="split-item-meta">{s.fields.length} fields · updated {s.updated}</span>
                </li>
              ))}
            </ul>
          </aside>

          <section className="split-detail">
            {active && (
              <>
                <header className="split-detail-h">
                  <div>
                    <h2>{active.name}</h2>
                    <p className="sub">id: <span style={{ color: "var(--accent-ink)" }}>claril.schemas.{active.id}</span> · {active.tag} · updated {active.updated}</p>
                  </div>
                  <div className="split-detail-actions">
                    <button className="btn btn-ghost" onClick={() => setModal("edit")}>Edit fields</button>
                    <button className="btn btn-ghost" onClick={() => setConfirmDel(active.id)}
                            style={{ color: "var(--err)" }}>Delete</button>
                    <button className="btn btn-primary" onClick={() => alert(`Publishing schema: ${active.name}`)}>
                      Publish v{(parseFloat(active.tag.replace("v","")) + 0.1).toFixed(1)}
                    </button>
                  </div>
                </header>

                <div className="split-detail-body">
                  <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: 14, maxWidth: 600 }}>{active.desc}</p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--hairline)", border: "1px solid var(--hairline)", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                    {[["fields", active.fields.length], ["usage (30d)", "412 cases"], ["pass rate", "98.4%"]].map(([k, v]) => (
                      <div key={k as string} style={{ background: "var(--surface)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span className="f-mono" style={{ fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--muted-2)" }}>{k as string}</span>
                        <span className="f-mono" style={{ fontSize: 16, color: "var(--ink)", fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <table className="schema-field-tbl">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Constraint</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.fields.map(([k, t, c, d]) => (
                        <tr key={k}>
                          <td className="key">{k}</td>
                          <td className="type">{t}</td>
                          <td><span className={c === "required" ? "req" : "opt"}>{c}</span></td>
                          <td style={{ color: "var(--muted)" }}>{d || "—"}</td>
                        </tr>
                      ))}
                      {active.fields.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: 60, color: "var(--muted-2)" }}>
                            Empty schema — click &quot;Edit fields&quot; to add your first field.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {modal === "create" && (
        <CreateSchemaModal onClose={() => setModal(null)} onCreate={onCreate}/>
      )}
      
      {modal === "edit" && active && (
        <EditSchemaModal 
          schema={active} 
          onClose={() => setModal(null)}
          onSave={(fields) => {
            setItems(items.map(i => i.id === active.id ? { ...i, fields, updated: "just now" } : i));
            setModal(null);
          }}
        />
      )}

      {confirmDel && (
        <Modal title="Delete schema" onClose={() => setConfirmDel(null)}
               foot={
                 <>
                   <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancel</button>
                   <button className="auth-submit" style={{ background: "var(--err)", height: 36, padding: "0 14px" }}
                           onClick={onDelete}>Delete schema</button>
                 </>
               }>
          <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.5 }}>
            This will retire <b>{items.find(i => i.id === confirmDel)?.name}</b>. Cases using older versions will continue to work, but no new cases can be created against it.
          </p>
          <p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: 12, fontFamily: "var(--f-mono)" }}>
            Type the schema id to confirm: <b>{confirmDel}</b>
          </p>
          <input className="field-input" placeholder={confirmDel} style={{ width: "100%", marginTop: 8, height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, font: "inherit", fontFamily: "var(--f-mono)", fontSize: 12, background: "var(--surface)", color: "var(--ink)" }}/>
        </Modal>
      )}
    </>
  );
}

function CreateSchemaModal({ onClose, onCreate }: { onClose: () => void; onCreate: (payload: { name: string; desc: string }) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Modal title="New schema" onClose={onClose}
           foot={
             <>
               <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
               <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                       onClick={() => onCreate({ name: name || "Untitled", desc })}>
                 Create draft <Icon.Arrow size={12}/>
               </button>
             </>
           }>
      <div className="field">
        <label>Schema name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ContractAgreement" autoFocus style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)" }}/>
        <span className="hint" style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4, display: "block" }}>Used as the type name in your SDK. PascalCase recommended.</span>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                  placeholder="Short description of what this schema captures." style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)", resize: "none" }}/>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Start from</label>
        <select defaultValue="blank" style={{ width: "100%", height: 36, padding: "0 12px", border: "1px solid var(--hairline-2)", borderRadius: 7, background: "var(--surface)", color: "var(--ink)" }}>
          <option value="blank">Blank schema</option>
          <option>Clone of Invoice (v2.3)</option>
          <option>Clone of BankStatement (v1.8)</option>
          <option>JSON Schema · paste at next step</option>
          <option>pydantic class · paste at next step</option>
        </select>
      </div>
    </Modal>
  );
}

function EditSchemaModal({ schema, onClose, onSave }: { schema: Schema; onClose: () => void; onSave: (fields: SchemaField[]) => void }) {
  const [rows, setRows] = useState<SchemaField[]>(schema.fields ?? []);
  
  const updateRow = (i: number, idx: number, v: string) => {
    const next = rows.map((r, j) => {
      if (j === i) {
        const copy = [...r] as SchemaField;
        copy[idx] = v;
        return copy;
      }
      return r;
    });
    setRows(next);
  };
  
  return (
    <Modal title={`Edit fields — ${schema.name}`} onClose={onClose} wide
           foot={
             <>
               <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
               <button className="auth-submit" style={{ height: 36, padding: "0 14px" }}
                       onClick={() => onSave(rows)}>Save fields</button>
             </>
           }>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="schema-field-tbl" style={{ marginBottom: 12, minWidth: 500 }}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Constraint</th>
              <th>Description</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input value={r[0]} onChange={(e) => updateRow(i, 0, e.target.value)} className="inline-input"/></td>
                <td>
                  <select value={r[1]} onChange={(e) => updateRow(i, 1, e.target.value)} className="inline-input">
                    {["string","integer","decimal","bool","date","iso4217","enum","array"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td>
                  <select value={r[2]} onChange={(e) => updateRow(i, 2, e.target.value)} className="inline-input">
                    <option>required</option>
                    <option>optional</option>
                  </select>
                </td>
                <td><input value={r[3]} onChange={(e) => updateRow(i, 3, e.target.value)} className="inline-input"/></td>
                <td>
                  <button className="copy-btn" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-ghost" style={{ alignSelf: "flex-start" }}
              onClick={() => setRows([...rows, ["new_field", "string", "optional", ""]])}>
        + Add field
      </button>
      <style>{`.inline-input { width: 100%; font: inherit; padding: 4px 6px; border: 1px solid var(--hairline-2); border-radius: 4px; background: var(--surface); color: var(--ink); font-family: var(--f-mono); font-size: 12px; }`}</style>
    </Modal>
  );
}

function Modal({ title, onClose, foot, children, wide }: { title: string; onClose: () => void; foot?: React.ReactNode; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" style={{ maxWidth: wide ? 760 : 520 }} onClick={(e) => e.stopPropagation()}>
        <header className="modal-h">
          <h3>{title}</h3>
          <button className="modal-x" onClick={onClose}>✕</button>
        </header>
        <div className="modal-body">{children}</div>
        {foot && <footer className="modal-foot">{foot}</footer>}
      </div>
    </div>
  );
}
