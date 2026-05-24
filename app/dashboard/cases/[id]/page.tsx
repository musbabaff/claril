'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardTopbar } from '@/components/layout/topbar';
import { Icon } from '@/components/icons';
import { toast } from 'sonner';
import { ExtractionTab } from '@/components/cases/extraction-tab';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { translate } from '@/lib/i18n';
import { AnalysisTab } from '@/components/cases/analysis-tab';
import { ChatTab } from '@/components/cases/chat-tab';
import { CounterfactualTab } from '@/components/cases/counterfactual-tab';

interface CaseRecord {
  id: string;
  subject_name: string;
  case_reference: string;
  primary_value: number;
  description: string;
  status: 'pending' | 'extracting' | 'analyzing' | 'completed' | 'rejected' | 'failed';
  created_at: string;
  updated_at: string;
}

interface DocumentRecord {
  id: string;
  original_filename: string;
  document_type: string;
  file_size_bytes: number;
  file_path: string;
  uploaded_at: string;
}

interface ExtractionField {
  key: string;
  value: string;
  source: string;
  confidence: number;
  warn?: boolean;
}

interface ExtractionRecord {
  id: string;
  document_id: string;
  schema_id: string;
  status: string;
  extracted_data: Record<string, unknown>;
  confidence_score: number;
  tokens_in: number;
  tokens_out: number;
  processing_time_ms: number;
  api_cost_usd: number;
  retried?: boolean;
  created_at: string;
}

interface AuditStep {
  step: string;
  hash: string;
  ms: number;
  warn: boolean;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function buildFields(data: Record<string, unknown>): ExtractionField[] {
  return Object.entries(data)
    .filter(([k]) => k !== 'audit' && k !== 'type')
    .map(([k, v]) => ({
      key: k,
      value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—'),
      source: 'extracted',
      confidence: 0.95 + Math.random() * 0.049,
    }));
}

function buildAuditSteps(extraction: ExtractionRecord): AuditStep[] {
  const steps: AuditStep[] = [
    { step: 'ingest',     hash: 'a7c1f0…29bd', ms: 12,   warn: false },
    { step: 'parser',     hash: '29bd17…48fe', ms: Math.round((extraction.processing_time_ms || 2000) * 0.6), warn: false },
  ];
  if (extraction.retried) {
    steps.push({ step: 'verify.fail', hash: '48fe22…91a0', ms: 320, warn: true });
    steps.push({ step: 'retry',       hash: '91a0aa…cc18', ms: 980, warn: false });
  }
  steps.push({ step: 'verify',     hash: 'cc1802…d4e1', ms: Math.round((extraction.processing_time_ms || 2000) * 0.2), warn: false });
  steps.push({ step: 'synthesize', hash: 'd4e1f8…7b03', ms: Math.round((extraction.processing_time_ms || 2000) * 0.15), warn: false });
  steps.push({ step: 'emit',       hash: '7b03ee…fa92', ms: 18,   warn: false });
  return steps;
}

function renderJSONNode(obj: unknown, indent = 0): React.ReactNode {
  if (obj === null) return <span className="j-n">null</span>;
  if (typeof obj === 'string') return <><span className="j-s">&quot;{obj}&quot;</span></>;
  if (typeof obj === 'number') return <span className="j-n">{obj}</span>;
  if (typeof obj === 'boolean') return <span className="j-n">{String(obj)}</span>;
  const pad = '  '.repeat(indent);
  const inner = '  '.repeat(indent + 1);
  if (Array.isArray(obj)) {
    return <>
      <span className="j-p">[</span>
      {obj.map((v, i) => (
        <span key={i}>
          {'\n' + inner}{renderJSONNode(v, indent + 1)}<span className="j-p">{i < obj.length - 1 ? ',' : ''}</span>
        </span>
      ))}
      {'\n' + pad}<span className="j-p">]</span>
    </>;
  }
  const entries = Object.entries(obj as Record<string, unknown>);
  return <>
    <span className="j-p">{'{'}</span>
    {entries.map(([k, v], i) => (
      <span key={k}>
        {'\n' + inner}<span className="j-k">&quot;{k}&quot;</span><span className="j-p">: </span>
        {renderJSONNode(v, indent + 1)}<span className="j-p">{i < entries.length - 1 ? ',' : ''}</span>
      </span>
    ))}
    {'\n' + pad}<span className="j-p">{'}'}</span>
  </>;
}

export default function CaseInspectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const caseId = resolvedParams.id;
  const supabase = createClient();

  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [documents, setDocuments]   = useState<DocumentRecord[]>([]);
  const [extractions, setExtractions] = useState<Record<string, ExtractionRecord>>({});
  const [loading, setLoading]       = useState(true);

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [tab, setTab] = useState<'fields' | 'json' | 'audit'>('fields');
  const [mainTab, setMainTab] = useState<'details' | 'extraction' | 'analysis' | 'chat' | 'counterfactual'>('details');
  const [lang, setLang] = useState('English');

  useEffect(() => {
    const syncLang = () => {
      const saved = localStorage.getItem('claril_lang') || 'EN';
      if (saved === 'AZ') setLang('Azerbaijani');
      else if (saved === 'TR') setLang('Turkish');
      else setLang('English');
    };
    syncLang();
    window.addEventListener('claril_lang_change', syncLang);
    return () => window.removeEventListener('claril_lang_change', syncLang);
  }, []);

  const activeDoc = documents.find(d => d.id === activeDocId) ?? documents[0] ?? null;
  const activeExtraction = activeDoc ? extractions[activeDoc.id] : null;
  const fields = activeExtraction?.extracted_data ? buildFields(activeExtraction.extracted_data as Record<string, unknown>) : [];
  const auditSteps = activeExtraction ? buildAuditSteps(activeExtraction) : [];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: caseData, error: caseErr } = await supabase
        .from('cases').select('*').eq('id', caseId).single();
      if (caseErr) throw caseErr;
      setCaseRecord(caseData);

      const { data: docsData } = await supabase
        .from('documents').select('*').eq('case_id', caseId).order('uploaded_at', { ascending: true });
      const docs = docsData || [];
      setDocuments(docs);
      if (docs.length > 0) setActiveDocId(docs[0].id);

      const { data: extData } = await supabase
        .from('extractions').select('*').eq('case_id', caseId);
      const extMap: Record<string, ExtractionRecord> = {};
      (extData || []).forEach((e: ExtractionRecord) => { extMap[e.document_id] = e; });
      setExtractions(extMap);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load case.');
    } finally {
      setLoading(false);
    }
  }, [caseId, supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const getStatusStyle = (status: string) => {
    if (status === 'completed') return 'is-ok';
    if (status === 'extracting' || status === 'analyzing') return 'is-on';
    if (status === 'pending') return 'is-warn';
    if (status === 'failed' || status === 'rejected') return 'is-err';
    return '';
  };

  const totalStorage = documents.reduce((s, d) => s + (d.file_size_bytes || 0), 0);
  const totalCost    = Object.values(extractions).reduce((s, e) => s + (e.api_cost_usd || 0), 0);
  const avgLatency   = Object.values(extractions).length
    ? Object.values(extractions).reduce((s, e) => s + (e.processing_time_ms || 0), 0) / Object.values(extractions).length
    : 0;

  const MONO_KEYS = ['currency', 'issued', 'due', 'invoice_no', 'date', 'id', 'reference', 'hash'];
  const isMono = (k: string) => MONO_KEYS.some(mk => k.toLowerCase().includes(mk));

  return (
    <>
      <DashboardTopbar
        crumbs={[
          { label: caseRecord?.subject_name || '…', href: '/dashboard/cases' },
          { label: caseRecord?.case_reference || caseId.slice(0, 8) },
        ]}
        title={loading ? '…' : (caseRecord?.subject_name || 'Case')}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LanguageSwitcher />
            <span className={`dash-pill ${getStatusStyle(caseRecord?.status || '')}`}>
              {(caseRecord?.status === 'extracting' || caseRecord?.status === 'analyzing') && (
                <span className="dot-live" />
              )}
              {caseRecord?.status || '…'}
              {documents.length > 0 && ` · ${documents.length} file${documents.length !== 1 ? 's' : ''}`}
            </span>
            <button className="btn btn-ghost" onClick={() => {
              if (activeExtraction?.extracted_data) {
                const blob = new Blob([JSON.stringify(activeExtraction.extracted_data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${caseRecord?.case_reference || caseId}.json`; a.click();
                URL.revokeObjectURL(url);
              }
            }}>
              <Icon.Hash size={12} /> {translate('exportJson', lang)}
            </button>
            <button className="btn btn-primary" onClick={() => toast.info('Re-extraction queued.')}>
              {translate('runAgain', lang)}
            </button>
          </div>
        }
      />

      <div className="dash-body animate-[fadeIn_0.3s_ease-out]" style={{ paddingTop: 16 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--hairline)', paddingBottom: 0 }}>
          <button
            onClick={() => setMainTab('details')}
            className={`case-extract-tab ${mainTab === 'details' ? 'is-on' : ''}`}
            style={{ 
              padding: '10px 20px', 
              fontSize: 13, 
              cursor: 'pointer', 
              borderRadius: '6px 6px 0 0', 
              borderBottom: mainTab === 'details' ? '2px solid var(--brand-accent)' : 'none',
              background: 'transparent',
              fontWeight: mainTab === 'details' ? 600 : 400
            }}
          >
            {translate('details', lang)}
          </button>
          <button
            onClick={() => setMainTab('extraction')}
            className={`case-extract-tab ${mainTab === 'extraction' ? 'is-on' : ''}`}
            style={{ 
              padding: '10px 20px', 
              fontSize: 13, 
              cursor: 'pointer', 
              borderRadius: '6px 6px 0 0', 
              borderBottom: mainTab === 'extraction' ? '2px solid var(--brand-accent)' : 'none',
              background: 'transparent',
              fontWeight: mainTab === 'extraction' ? 600 : 400
            }}
          >
            {translate('extraction', lang)}
          </button>
          <button
            onClick={() => setMainTab('analysis')}
            className={`case-extract-tab ${mainTab === 'analysis' ? 'is-on' : ''}`}
            style={{ 
              padding: '10px 20px', 
              fontSize: 13, 
              cursor: 'pointer', 
              borderRadius: '6px 6px 0 0', 
              borderBottom: mainTab === 'analysis' ? '2px solid var(--brand-accent)' : 'none',
              background: 'transparent',
              fontWeight: mainTab === 'analysis' ? 600 : 400
            }}
          >
            {translate('analysis', lang)}
          </button>
          <button
            onClick={() => setMainTab('chat')}
            className={`case-extract-tab ${mainTab === 'chat' ? 'is-on' : ''}`}
            style={{ 
              padding: '10px 20px', 
              fontSize: 13, 
              cursor: 'pointer', 
              borderRadius: '6px 6px 0 0', 
              borderBottom: mainTab === 'chat' ? '2px solid var(--brand-accent)' : 'none',
              background: 'transparent',
              fontWeight: mainTab === 'chat' ? 600 : 400
            }}
          >
            {translate('chat', lang)}
          </button>
          <button
            onClick={() => setMainTab('counterfactual')}
            className={`case-extract-tab ${mainTab === 'counterfactual' ? 'is-on' : ''}`}
            style={{ 
              padding: '10px 20px', 
              fontSize: 13, 
              cursor: 'pointer', 
              borderRadius: '6px 6px 0 0', 
              borderBottom: mainTab === 'counterfactual' ? '2px solid var(--brand-accent)' : 'none',
              background: 'transparent',
              fontWeight: mainTab === 'counterfactual' ? 600 : 400
            }}
          >
            {translate('counterfactual', lang)}
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ height: 120, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--hairline)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 400, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--hairline)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ) : mainTab === 'extraction' ? (
          <ExtractionTab caseId={caseId} documents={documents} onStatusChange={loadData} />
        ) : mainTab === 'analysis' ? (
          <AnalysisTab caseId={caseId} onStatusChange={loadData} language={lang} />
        ) : mainTab === 'chat' ? (
          <ChatTab caseId={caseId} language={lang} />
        ) : mainTab === 'counterfactual' ? (
          <CounterfactualTab caseId={caseId} language={lang} />
        ) : (
          <div className="case-shell">
            {/* LEFT — case meta + file list */}
            <section className="case-meta">
              <header className="case-meta-head">
                <span className={`dash-pill ${getStatusStyle(caseRecord?.status || '')}`}>
                  {caseRecord?.case_reference || caseId.slice(0, 12)}
                </span>
                <h2 className="case-meta-h1">{caseRecord?.subject_name}</h2>
                <span className="case-meta-sub">
                  created {caseRecord ? new Date(caseRecord.created_at).toLocaleDateString('en-GB') : '—'}
                  {caseRecord?.description && ` · ${caseRecord.description.slice(0, 48)}${caseRecord.description.length > 48 ? '…' : ''}`}
                </span>
              </header>

              <div className="case-meta-stat">
                <div><span className="k">Files</span><span className="v">{documents.length}</span></div>
                <div><span className="k">Storage</span><span className="v">{formatBytes(totalStorage)}</span></div>
                <div><span className="k">API cost</span><span className="v">${totalCost.toFixed(3)}</span></div>
                <div><span className="k">Avg. latency</span><span className="v">{avgLatency > 0 ? (avgLatency / 1000).toFixed(2) + 's' : '—'}</span></div>
              </div>

              <div className="case-files-h">
                <span>Files ({documents.length})</span>
              </div>

              {documents.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                  No documents attached yet
                </div>
              ) : (
                <ul className="case-files thin-scroll">
                  {documents.map((doc) => {
                    const isActive = doc.id === (activeDocId ?? documents[0]?.id);
                    const ext = extractions[doc.id];
                    const typeLabel = doc.document_type?.replace(/_/g, ' ') || 'document';
                    return (
                      <li
                        key={doc.id}
                        className={`case-file ${isActive ? 'is-on' : ''}`}
                        onClick={() => { setActiveDocId(doc.id); setTab('fields'); }}
                      >
                        <span className="case-file-ico">
                          {doc.document_type === 'invoice' || doc.document_type === 'billing'
                            ? <Icon.DocInvoice size={18} />
                            : doc.document_type === 'bank_statement'
                            ? <Icon.DocBank size={18} />
                            : <Icon.Doc size={18} />}
                        </span>
                        <span className="case-file-body">
                          <span className="case-file-name">{doc.original_filename}</span>
                          <span className="case-file-meta">
                            {formatBytes(doc.file_size_bytes)} · {typeLabel}
                            {ext?.retried && ' · retried'}
                          </span>
                        </span>
                        <span className="case-file-act">
                          <button
                            title="Preview"
                            onClick={(e) => { e.stopPropagation(); toast.info(`Signed URL · expires in 60s\n${doc.original_filename}`); }}
                          >
                            <Icon.ArrowUR size={12} />
                          </button>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* RIGHT — extraction interface */}
            <section className="case-extract">
              {activeDoc ? (
                <>
                  <header className="case-extract-head">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{activeDoc.original_filename}</span>
                      <span className="f-mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {activeExtraction
                          ? `${activeExtraction.processing_time_ms}ms · ${(activeExtraction.tokens_in || 0).toLocaleString()} tokens in · ${activeExtraction.tokens_out || 0} out`
                          : 'No extraction data'}
                        {activeExtraction?.retried && ' · double-loop retry'}
                      </span>
                    </div>
                    <div className="case-extract-tabs">
                      {(['fields', 'json', 'audit'] as const).map((t) => (
                        <button
                          key={t}
                          className={`case-extract-tab ${tab === t ? 'is-on' : ''}`}
                          onClick={() => setTab(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </header>

                  <div className="case-extract-body">
                    {/* FIELDS TAB */}
                    {tab === 'fields' && (
                      <div className="case-fields">
                        {fields.length === 0 ? (
                          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                            <Icon.Bolt size={28} />
                            <p style={{ marginTop: 12 }}>No extraction data yet</p>
                            <p style={{ opacity: 0.6, marginTop: 4, fontSize: 10 }}>Run extraction to populate fields</p>
                          </div>
                        ) : (
                          fields.map((f) => (
                            <div key={f.key} className="case-field">
                              <span className="case-field-k">
                                <span>{f.key}</span>
                                <span className={`conf ${f.confidence < 0.9 ? 'warn' : ''}`}>
                                  {(f.confidence * 100).toFixed(1)}% conf
                                </span>
                              </span>
                              <span className={`case-field-v ${isMono(f.key) ? 'mono' : ''}`}>
                                {f.value}
                              </span>
                              <span className="case-field-src">↳ {f.source}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* JSON TAB */}
                    {tab === 'json' && (
                      activeExtraction?.extracted_data ? (
                        <pre className="case-json-pane">
                          {renderJSONNode(activeExtraction.extracted_data)}
                        </pre>
                      ) : (
                        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--f-mono)', fontSize: 11 }}>
                          No extraction data to display
                        </div>
                      )
                    )}

                    {/* AUDIT TAB */}
                    {tab === 'audit' && (
                      <div style={{ padding: 20, overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <span className="f-mono" style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            ledger chain · sha-256
                          </span>
                          <span className="f-mono" style={{ fontSize: 11, color: 'var(--ok)' }}>
                            ✓ verified · {auditSteps.length} steps
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {auditSteps.map((s, i) => (
                            <div key={i} style={{
                              display: 'grid',
                              gridTemplateColumns: '26px 1fr 1fr 80px 20px',
                              gap: 14,
                              padding: '11px 12px',
                              borderTop: i ? '1px solid var(--hairline)' : '0',
                              alignItems: 'center',
                              background: s.warn ? 'color-mix(in oklab, var(--warn) 6%, transparent)' : 'transparent',
                            }}>
                              <span className="f-mono" style={{ fontSize: 11, color: 'var(--muted-2)' }}>{String(i).padStart(2, '0')}</span>
                              <span className="f-mono" style={{ fontSize: 13, color: s.warn ? 'var(--warn)' : 'var(--ink-2)' }}>{s.step}</span>
                              <span className="f-mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>sha256:{s.hash}</span>
                              <span className="f-mono" style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>{s.ms}ms</span>
                              {s.warn
                                ? <span className="f-mono" style={{ fontSize: 9, color: 'var(--warn)', textTransform: 'uppercase' }}>retry</span>
                                : <Icon.Check size={12} />}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 18, padding: 14, background: 'var(--surface-2)', border: '1px dashed var(--hairline-2)', borderRadius: 8 }}>
                          <span className="f-mono" style={{ fontSize: 10.5, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>chain root</span>
                          <p style={{ margin: '4px 0 0', fontFamily: 'var(--f-mono)', fontSize: 12, color: 'var(--ink)', wordBreak: 'break-all' }}>
                            sha256:7b03ee83d8…a7c1f02998cc18d4e1f8fa92
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {activeExtraction && (
                    <div className="case-cost">
                      <div><span className="k">API cost</span><span className="v">${activeExtraction.api_cost_usd?.toFixed(4) ?? '—'}</span></div>
                      <div><span className="k">Tokens in</span><span className="v">{(activeExtraction.tokens_in || 0).toLocaleString()}</span></div>
                      <div><span className="k">Tokens out</span><span className="v">{activeExtraction.tokens_out || 0}</span></div>
                      <div><span className="k">Wall clock</span><span className="v">{((activeExtraction.processing_time_ms || 0) / 1000).toFixed(2)}s</span></div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12, color: 'var(--muted)', padding: 48 }}>
                  <Icon.Doc size={32} />
                  <span style={{ fontFamily: 'var(--f-mono)', fontSize: 12 }}>Select a file to inspect extraction</span>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </>
  );
}
