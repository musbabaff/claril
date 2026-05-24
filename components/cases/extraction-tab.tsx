'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Play, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  Coins, 
  Database, 
  Cpu, 
  FileText, 
  FileSpreadsheet, 
  CreditCard,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { UniversalExtraction } from '@/lib/ai/extraction-schemas';

interface DocumentRecord {
  id: string;
  original_filename: string;
  document_type: string;
  file_size_bytes: number;
  file_path: string;
  uploaded_at: string;
}

interface ExtractionRecord {
  id: string;
  document_id: string;
  case_id: string;
  status: 'processing' | 'completed' | 'failed';
  raw_data: unknown;
  structured_data: UniversalExtraction | null;
  confidence_score: number | null;
  error_message: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface ExtractionTabProps {
  caseId: string;
  documents: DocumentRecord[];
  onStatusChange?: () => void;
}

export function ExtractionTab({ caseId, documents, onStatusChange }: ExtractionTabProps) {
  const supabase = createClient();
  const [extractions, setExtractions] = useState<ExtractionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'enrichment' | 'raw'>('overview');

  // Fetch extractions
  const fetchExtractions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('extractions')
        .select('*')
        .eq('case_id', caseId);

      if (error) throw error;
      setExtractions(data || []);
    } catch (err) {
      console.error('Error fetching extractions:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, supabase]);

  // Handle run extraction trigger
  const handleRunExtraction = async () => {
    if (extracting) return;
    setExtracting(true);
    const toastId = toast.loading('Initializing cognitive layout extraction pipeline...');

    try {
      const response = await fetch(`/api/cases/${caseId}/extract`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete extraction process.');
      }

      toast.success(
        `Extraction batch processed: ${result.successCount} succeeded, ${result.failureCount} failed.`, 
        { id: toastId }
      );
      
      await fetchExtractions();
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'An error occurred during extraction run.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setExtracting(false);
    }
  };

  // Set initial selected document if none is selected
  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  // 1. Initial Load & Realtime subscription
  useEffect(() => {
    fetchExtractions();

    const channel = supabase
      .channel(`extractions-case-channel-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extractions',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          console.log('Realtime change received for extraction:', payload);
          fetchExtractions();
          if (onStatusChange) {
            onStatusChange();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, supabase, fetchExtractions, onStatusChange]);

  // 2. 2-Second Polling Fallback when any extraction is running
  const hasRunningExtractions = extractions.some((ext) => ext.status === 'processing') || extracting;

  useEffect(() => {
    if (!hasRunningExtractions) return;

    const interval = setInterval(() => {
      console.log('Polling fallback: Refreshing extractions...');
      fetchExtractions();
      if (onStatusChange) {
        onStatusChange();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [hasRunningExtractions, fetchExtractions, onStatusChange]);

  // Calculations for cost ledger
  const totalCost = extractions.reduce((sum, ext) => sum + (ext.cost_usd || 0), 0);
  const totalInputTokens = extractions.reduce((sum, ext) => sum + (ext.tokens_input || 0), 0);
  const totalOutputTokens = extractions.reduce((sum, ext) => sum + (ext.tokens_output || 0), 0);

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const selectedExtraction = extractions.find((e) => e.document_id === selectedDocId);

  // Helper formatting size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'invoice':
      case 'bank_statement':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'id_document':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading && extractions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-accent" />
        <span className="text-xs text-text-secondary font-mono uppercase tracking-wider">Loading Extraction Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cost & Run Trigger Header Section */}
      <div className="p-6 rounded-[8px] border border-border-default bg-bg-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-brand-accent" />
            <h3 className="font-sans text-sm font-bold text-text-primary uppercase tracking-tight">Cognitive Extraction Ledger</h3>
          </div>
          <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
            Extracts structural metadata from documents using Claude Vision. Uses domain-agnostic JSON schemas dynamically enriched by document classification.
          </p>
        </div>

        {/* Action Button & Metadata metrics */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
          {extractions.length > 0 && (
            <div className="bg-bg-base border border-border-subtle p-3 rounded-[6px] flex items-center gap-4 text-left shrink-0">
              <div className="p-2 rounded bg-brand-accent/5 border border-brand-accent/15">
                <Coins className="h-4.5 w-4.5 text-brand-accent" />
              </div>
              <div>
                <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-text-muted">Batch Incurred Cost</div>
                <div className="font-mono text-xs font-semibold text-text-primary mt-0.5">
                  ${totalCost.toFixed(4)} <span className="text-[10px] text-text-muted">USD</span>
                </div>
                <div className="text-[8px] text-text-muted font-mono mt-0.5">
                  {totalInputTokens.toLocaleString()} in / {totalOutputTokens.toLocaleString()} out
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleRunExtraction}
            disabled={extracting || documents.length === 0}
            className="inline-flex h-11 items-center justify-center rounded-[6px] bg-brand-accent text-bg-base font-semibold text-xs px-5 hover:opacity-95 disabled:opacity-40 transition-all gap-2 shadow-md cursor-pointer select-none"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Extracting Batch...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{extractions.length > 0 ? 'Re-run Ingestion' : 'Run Batch Ingestion'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: Left Documents List, Right Visualizer Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side - Ingested files index */}
        <div className="lg:col-span-1 border border-border-default bg-bg-surface rounded-[8px] overflow-hidden shadow-sm">
          <div className="bg-bg-base/40 border-b border-border-subtle px-4 py-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-secondary">Document Scope</span>
          </div>

          <div className="divide-y divide-border-subtle">
            {documents.map((doc) => {
              const ext = extractions.find((e) => e.document_id === doc.id);
              const isSelected = doc.id === selectedDocId;

              // Compute status colors
              let badgeColor = 'bg-text-muted/10 text-text-secondary border-border-subtle';
              let badgeText = 'Pending';
              
              if (ext?.status === 'processing') {
                badgeColor = 'bg-warning/10 text-warning border-warning/20';
                badgeText = 'Processing';
              } else if (ext?.status === 'completed') {
                badgeColor = 'bg-success/10 text-success border-success/20';
                badgeText = `Extracted (${Math.round((ext.confidence_score || 0.95) * 100)}%)`;
              } else if (ext?.status === 'failed') {
                badgeColor = 'bg-danger/10 text-danger border-danger/20';
                badgeText = 'Failed';
              }

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`w-full p-4 flex items-center justify-between text-left transition-all border-l-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-bg-base/60 border-brand-accent' 
                      : 'border-transparent hover:bg-bg-base/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className={`p-2 rounded border transition-colors ${
                      isSelected ? 'bg-bg-surface border-brand-accent/30 text-brand-accent' : 'bg-bg-base border-border-subtle text-text-secondary'
                    }`}>
                      {getDocIcon(doc.document_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary truncate">{doc.original_filename}</div>
                      <div className="text-[9px] text-text-muted mt-1 font-mono uppercase tracking-wide">
                        {formatBytes(doc.file_size_bytes)}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wider font-mono flex items-center gap-1 ${badgeColor}`}>
                      {ext?.status === 'processing' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-warning animate-ping" />
                      )}
                      <span>{badgeText}</span>
                    </span>
                    <ChevronRight className={`h-3 w-3 text-text-muted transition-transform ${isSelected ? 'translate-x-0.5 text-brand-accent' : ''}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side - Extraction Inspector visualizer */}
        <div className="lg:col-span-2 border border-border-default bg-bg-surface rounded-[8px] shadow-sm min-h-[480px] flex flex-col">
          
          {!selectedDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-muted">
              <Database className="h-10 w-10 text-text-muted/40 mb-3" />
              <span className="text-xs font-semibold text-text-primary">No Document Selected</span>
              <p className="text-[11px] mt-1 max-w-xs">Select an ingested resource on the left panel to inspect raw and structured layouts.</p>
            </div>
          ) : !selectedExtraction ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="h-10 w-10 bg-bg-base border border-border-subtle rounded-[6px] flex items-center justify-center text-text-muted mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-text-primary">Document Not Extracted</span>
              <p className="text-[11px] text-text-secondary mt-1.5 max-w-sm leading-relaxed">
                Metadata for &quot;{selectedDoc.original_filename}&quot; has not been extracted yet. Click &quot;Run Batch Ingestion&quot; to trigger cognitive analyses on this case.
              </p>
            </div>
          ) : selectedExtraction.status === 'processing' ? (
            <div className="flex-1 p-6 flex flex-col justify-between">
              {/* Skeleton Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-16 bg-bg-base rounded animate-pulse" />
                    <div className="h-4 w-40 bg-bg-base rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-bg-base rounded animate-pulse" />
                </div>
                
                {/* Skeleton Data Blocks */}
                <div className="space-y-4 pt-4">
                  <div className="h-3 w-full bg-bg-base rounded animate-pulse" />
                  <div className="h-3 w-5/6 bg-bg-base rounded animate-pulse" />
                  <div className="h-3 w-4/6 bg-bg-base rounded animate-pulse" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-6">
                    <div className="h-16 bg-bg-base rounded animate-pulse" />
                    <div className="h-16 bg-bg-base rounded animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Pulsing loading footer status */}
              <div className="p-4 bg-bg-base border border-border-subtle rounded-[6px] flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
                <span className="text-[11px] font-mono font-semibold text-brand-accent tracking-wider uppercase">Ingesting file layout & structural mapping...</span>
              </div>
            </div>
          ) : selectedExtraction.status === 'failed' ? (
            <div className="flex-1 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 text-danger border-b border-border-subtle pb-4">
                  <AlertCircle className="h-5 w-5" />
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wide">Extraction Process Crashed</h4>
                </div>

                <div className="p-4 bg-danger/5 border border-danger/10 rounded-[6px] font-mono text-[11px] text-danger leading-relaxed break-words whitespace-pre-wrap">
                  {selectedExtraction.error_message || 'An unexpected internal SDK error occurred while calling Claude Vision.'}
                </div>

                <p className="text-[11px] text-text-secondary leading-relaxed">
                  This issue might be caused by document format corruptions, API rate limits, or Anthropic client configuration errors. Click below to retry the extraction batch.
                </p>
              </div>

              <button
                onClick={handleRunExtraction}
                disabled={extracting}
                className="mt-6 w-full inline-flex h-9 items-center justify-center rounded-[6px] border border-danger/30 hover:border-danger text-danger bg-danger/5 font-semibold text-xs transition-colors cursor-pointer"
              >
                Retry Ingestion Run
              </button>
            </div>
          ) : (
            // Completed state - Structured Data Inspector!
            (() => {
              const rawData = selectedExtraction.raw_data as Record<string, unknown> | null | undefined;
              const provider = rawData && typeof rawData === 'object' && 'provider' in rawData 
                ? String(rawData.provider) 
                : 'anthropic';
              const modelName = rawData && typeof rawData === 'object' && 'model' in rawData
                ? String(rawData.model)
                : 'claude-3-5-sonnet-20241022';

              return (
                <div className="flex-1 flex flex-col animate-[fadeIn_0.2s_ease-out]">
                  {/* Completed Inspector Header */}
                  <div className="p-6 border-b border-border-subtle bg-bg-base/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="px-2 py-0.5 rounded-[4px] bg-brand-accent/10 border border-brand-accent/25 text-brand-accent text-[9px] font-mono font-bold uppercase tracking-wider">
                          {selectedExtraction.structured_data?.document_type_detected || 'classified'}
                        </span>
                        
                        {provider === 'gemini' && (
                          <span className="px-2 py-0.5 rounded-[4px] bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-[9px] font-mono font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(6,182,212,0.15)] flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>{modelName}</span>
                          </span>
                        )}
                        {provider === 'anthropic' && (
                          <span className="px-2 py-0.5 rounded-[4px] bg-amber-950/40 border border-amber-500/30 text-amber-400 text-[9px] font-mono font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(245,158,11,0.15)] flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            <span>{modelName}</span>
                          </span>
                        )}
                        {provider === 'openai' && (
                          <span className="px-2 py-0.5 rounded-[4px] bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider shadow-[0_0_8px_rgba(16,185,129,0.15)] flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            <span>{modelName}</span>
                          </span>
                        )}

                        <span className="text-xs font-semibold text-text-primary truncate max-w-[200px] sm:max-w-none">
                          {selectedDoc.original_filename}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-muted font-mono mt-1.5 flex items-center gap-1.5">
                        <span>Speed: {selectedExtraction.completed_at && selectedExtraction.started_at ? 
                          `${Math.round((new Date(selectedExtraction.completed_at).getTime() - new Date(selectedExtraction.started_at).getTime()) / 1000)}s` 
                          : 'N/A'}
                        </span>
                        <span>•</span>
                        <span>Cost: ${selectedExtraction.cost_usd ? selectedExtraction.cost_usd.toFixed(4) : '0.0000'} USD</span>
                      </div>
                    </div>

                {/* Confidence score indicator */}
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-text-muted font-bold">Model Confidence</span>
                    <span className="text-xs font-mono font-bold text-success">
                      {Math.round((selectedExtraction.confidence_score || 0.95) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-24 bg-bg-base border border-border-subtle rounded-full overflow-hidden shrink-0">
                    <div 
                      className="h-full bg-gradient-to-r from-warning to-success rounded-full"
                      style={{ width: `${(selectedExtraction.confidence_score || 0.95) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Sub tabs: Overview, Enrichments, Raw JSON */}
              <div className="px-6 border-b border-border-subtle bg-bg-base/10 flex gap-4">
                <button
                  onClick={() => setActiveSubTab('overview')}
                  className={`py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 cursor-pointer ${
                    activeSubTab === 'overview' ? 'border-brand-accent text-brand-accent font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveSubTab('enrichment')}
                  className={`py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 cursor-pointer ${
                    activeSubTab === 'enrichment' ? 'border-brand-accent text-brand-accent font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Type Enrichments
                </button>
                <button
                  onClick={() => setActiveSubTab('raw')}
                  className={`py-2.5 text-[11px] font-mono uppercase tracking-wider border-b-2 cursor-pointer ${
                    activeSubTab === 'raw' ? 'border-brand-accent text-brand-accent font-bold' : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Raw Response
                </button>
              </div>

              {/* Inspector Content */}
              <div className="p-6 flex-1 overflow-auto max-h-[500px]">
                {activeSubTab === 'overview' && (
                  <div className="space-y-6 animate-[fadeIn_0.15s_ease-out]">
                    {/* Summary */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Executive Summary</h5>
                      <p className="text-xs text-text-secondary leading-relaxed bg-bg-base/30 border border-border-subtle p-3 rounded-[6px]">
                        {selectedExtraction.structured_data?.summary || 'No summary extracted.'}
                      </p>
                    </div>

                    {/* Entities */}
                    <div className="space-y-2.5">
                      <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Key Entities Identified</h5>
                      {selectedExtraction.structured_data?.key_entities && selectedExtraction.structured_data.key_entities.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedExtraction.structured_data.key_entities.map((ent, idx) => (
                            <div key={idx} className="p-2.5 rounded-[6px] border border-border-subtle bg-bg-base/20 flex items-center justify-between text-xs">
                              <span className="font-medium text-text-primary truncate mr-2">{ent.name}</span>
                              <span className="px-1.5 py-0.5 rounded-[4px] bg-bg-elevated border border-border-default text-text-muted text-[8px] font-mono uppercase tracking-wider font-bold">
                                {ent.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-text-muted">No entities extracted.</div>
                      )}
                    </div>

                    {/* Dates & Amounts split table */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dates */}
                      <div className="space-y-2.5">
                        <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Critical Dates</h5>
                        {selectedExtraction.structured_data?.key_dates && selectedExtraction.structured_data.key_dates.length > 0 ? (
                          <div className="border border-border-subtle rounded-[6px] overflow-hidden text-xs">
                            <table className="w-full text-left font-sans divide-y divide-border-subtle">
                              <thead className="bg-bg-base/30">
                                <tr>
                                  <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold">Label</th>
                                  <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold">Date</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-subtle bg-bg-base/5">
                                {selectedExtraction.structured_data.key_dates.map((dateObj, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 text-text-secondary truncate max-w-[120px]">{dateObj.label}</td>
                                    <td className="p-2 font-mono text-text-primary font-medium">{dateObj.date}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-[11px] text-text-muted">No dates extracted.</div>
                        )}
                      </div>

                      {/* Amounts */}
                      <div className="space-y-2.5">
                        <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Extracted Amounts</h5>
                        {selectedExtraction.structured_data?.key_amounts && selectedExtraction.structured_data.key_amounts.length > 0 ? (
                          <div className="border border-border-subtle rounded-[6px] overflow-hidden text-xs">
                            <table className="w-full text-left font-sans divide-y divide-border-subtle">
                              <thead className="bg-bg-base/30">
                                <tr>
                                  <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold">Label</th>
                                  <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold text-right">Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-subtle bg-bg-base/5">
                                {selectedExtraction.structured_data.key_amounts.map((amt, idx) => (
                                  <tr key={idx}>
                                    <td className="p-2 text-text-secondary truncate max-w-[120px]">{amt.label}</td>
                                    <td className="p-2 font-mono text-text-primary font-bold text-right">
                                      {amt.currency} {amt.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-[11px] text-text-muted">No amounts extracted.</div>
                        )}
                      </div>
                    </div>

                    {/* Anomalies and Warnings */}
                    {selectedExtraction.structured_data?.anomalies && selectedExtraction.structured_data.anomalies.length > 0 && (
                      <div className="p-3 bg-warning/5 border border-warning/15 rounded-[6px] space-y-2">
                        <div className="flex items-center gap-2 text-warning font-mono text-[9px] font-bold uppercase tracking-wider">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Detected Layout Anomalies & Discrepancies</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-xs text-text-secondary">
                          {selectedExtraction.structured_data.anomalies.map((anom: string, idx: number) => (
                            <li key={idx} className="leading-relaxed">{anom}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'enrichment' && (
                  <div className="space-y-6 animate-[fadeIn_0.15s_ease-out]">
                    {/* Invoice/Financial Specific */}
                    {selectedExtraction.structured_data?.document_type_detected === 'invoice' && (
                      <div className="space-y-6">
                        {/* Transaction lines */}
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Line Item Transactions</h5>
                          {selectedExtraction.structured_data.financial_enrichment?.transactions && 
                          selectedExtraction.structured_data.financial_enrichment.transactions.length > 0 ? (
                            <div className="border border-border-subtle rounded-[6px] overflow-hidden text-xs">
                              <table className="w-full text-left font-sans divide-y divide-border-subtle">
                                <thead className="bg-bg-base/30">
                                  <tr>
                                    <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold">Date</th>
                                    <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold">Description</th>
                                    <th className="p-2 font-mono text-[9px] uppercase tracking-wider text-text-muted font-bold text-right">Line Cost</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle bg-bg-base/5 font-mono">
                                  {selectedExtraction.structured_data.financial_enrichment.transactions.map((t, idx) => (
                                    <tr key={idx} className="hover:bg-bg-base/10 transition-colors">
                                      <td className="p-2 text-text-muted text-[10px]">{t.date || '—'}</td>
                                      <td className="p-2 text-text-secondary font-sans text-xs max-w-[200px] truncate">{t.description}</td>
                                      <td className="p-2 text-text-primary font-bold text-right">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-[11px] text-text-muted p-2 border border-dashed border-border-subtle rounded-[6px] text-center">No transactions / line items found.</div>
                          )}
                        </div>

                        {/* Financial Totals & Balances */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Totals */}
                          <div className="space-y-2.5">
                            <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Financial Totals Summary</h5>
                            {selectedExtraction.structured_data.financial_enrichment?.totals && 
                            Object.keys(selectedExtraction.structured_data.financial_enrichment.totals).length > 0 ? (
                              <div className="p-4 bg-bg-base/30 border border-border-subtle rounded-[6px] space-y-2 text-xs font-mono">
                                {Object.entries(selectedExtraction.structured_data.financial_enrichment.totals).map(([key, val]) => (
                                  <div key={key} className="flex justify-between items-center py-1 border-b border-border-subtle/30 last:border-0">
                                    <span className="text-text-secondary capitalize font-sans">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-text-primary font-bold">{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-text-muted">No specific totals mapped.</div>
                            )}
                          </div>

                          {/* Balances */}
                          <div className="space-y-2.5">
                            <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Account Balances</h5>
                            {selectedExtraction.structured_data.financial_enrichment?.balances && 
                            Object.keys(selectedExtraction.structured_data.financial_enrichment.balances).length > 0 ? (
                              <div className="p-4 bg-bg-base/30 border border-border-subtle rounded-[6px] space-y-2 text-xs font-mono">
                                {Object.entries(selectedExtraction.structured_data.financial_enrichment.balances).map(([key, val]) => (
                                  <div key={key} className="flex justify-between items-center py-1 border-b border-border-subtle/30 last:border-0">
                                    <span className="text-text-secondary capitalize font-sans">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-text-primary font-semibold">{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-text-muted">No account balances extracted.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Identity Specific */}
                    {selectedExtraction.structured_data?.document_type_detected === 'identity' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-[6px] border border-border-subtle bg-bg-base/20 space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <div className="text-[9px] font-mono uppercase text-text-muted font-bold">Extracted Holder Name</div>
                              <div className="mt-1 font-semibold text-text-primary text-sm">
                                {selectedExtraction.structured_data.identity_enrichment?.name || '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono uppercase text-text-muted font-bold">Document / ID Number</div>
                              <div className="mt-1 font-mono font-bold text-text-primary text-sm tracking-wider">
                                {selectedExtraction.structured_data.identity_enrichment?.id_number || '—'}
                              </div>
                            </div>
                          </div>

                          {selectedExtraction.structured_data.identity_enrichment?.dates && 
                          Object.keys(selectedExtraction.structured_data.identity_enrichment.dates).length > 0 && (
                            <div className="pt-3 border-t border-border-subtle/50">
                              <div className="text-[9px] font-mono uppercase text-text-muted font-bold mb-2">Registered ID Dates</div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
                                {Object.entries(selectedExtraction.structured_data.identity_enrichment.dates).map(([label, val]) => (
                                  <div key={label} className="p-2 rounded bg-bg-elevated border border-border-subtle/35">
                                    <div className="text-[8px] text-text-muted capitalize font-sans">{label.replace(/_/g, ' ')}</div>
                                    <div className="text-xs font-semibold text-text-primary mt-0.5">{String(val)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Contract Specific */}
                    {selectedExtraction.structured_data?.document_type_detected === 'contract' && (
                      <div className="space-y-6">
                        {/* Contracting Parties */}
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Contracting Parties</h5>
                          {selectedExtraction.structured_data.contract_enrichment?.parties && 
                          selectedExtraction.structured_data.contract_enrichment.parties.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedExtraction.structured_data.contract_enrichment.parties.map((party: string, idx: number) => (
                                <span key={idx} className="px-2.5 py-1 rounded bg-bg-base border border-border-subtle text-text-secondary text-xs font-medium">
                                  {party}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-text-muted">No contracting parties extracted.</div>
                          )}
                        </div>

                        {/* Key Terms */}
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Negotiated Terms</h5>
                          {selectedExtraction.structured_data.contract_enrichment?.terms && 
                          Object.keys(selectedExtraction.structured_data.contract_enrichment.terms).length > 0 ? (
                            <div className="p-4 bg-bg-base/30 border border-border-subtle rounded-[6px] space-y-2.5 text-xs">
                              {Object.entries(selectedExtraction.structured_data.contract_enrichment.terms).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-start py-1 border-b border-border-subtle/25 last:border-0 gap-4">
                                  <span className="text-text-secondary font-medium shrink-0 capitalize">{key.replace(/_/g, ' ')}</span>
                                  <span className="text-text-primary text-right font-semibold">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-text-muted">No negotiated terms found.</div>
                          )}
                        </div>

                        {/* Critical Clauses */}
                        <div className="space-y-2.5">
                          <h5 className="text-[10px] font-mono uppercase font-bold tracking-wider text-text-muted">Clauses & Sections</h5>
                          {selectedExtraction.structured_data.contract_enrichment?.clauses && 
                          selectedExtraction.structured_data.contract_enrichment.clauses.length > 0 ? (
                            <div className="space-y-3">
                              {selectedExtraction.structured_data.contract_enrichment.clauses.map((c, idx) => (
                                <div key={idx} className="p-3 bg-bg-base/20 border border-border-subtle rounded-[6px] text-xs">
                                  <div className="font-mono text-[9px] font-bold text-brand-accent uppercase tracking-wider">{c.section}</div>
                                  <p className="mt-1 text-text-secondary leading-relaxed">{c.text}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[11px] text-text-muted">No critical clauses indexed.</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Other Documents (fallback) */}
                    {selectedExtraction.structured_data?.document_type_detected === 'other' && (
                      <div className="p-8 text-center text-text-muted text-xs border border-dashed border-border-subtle rounded-[6px]">
                        <Info className="h-6 w-6 mx-auto mb-2 text-text-muted/65" />
                        <span>Enrichments are unavailable for generic/other documents. Layout summary and entities are indexed in the Overview tab.</span>
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'raw' && (
                  <div className="space-y-3 animate-[fadeIn_0.15s_ease-out]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-text-muted">
                      <span>JSON PAYLOAD STRUCT</span>
                      <span className="text-brand-accent">READ-ONLY</span>
                    </div>
                    <pre className="font-mono text-[10px] p-4 bg-bg-elevated/40 border border-border-subtle rounded-[6px] overflow-auto select-all max-h-[350px] leading-relaxed text-text-secondary">
                      {JSON.stringify(selectedExtraction.structured_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}

        </div>

      </div>
    </div>
  );
}
