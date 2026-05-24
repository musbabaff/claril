'use client';

import * as React from 'react';

type Domain = 'financial' | 'legal' | 'clinical';

interface DomainData {
  fileName: string;
  fileDesc: string;
  fileSize: string;
  agent1: string;
  agent1Status: string;
  agent2: string;
  agent2Status: string;
  preview: string;
}

const domainData: Record<Domain, DomainData> = {
  financial: {
    fileName: 'consolidated_balance.pdf',
    fileDesc: 'Consolidated balance sheets',
    fileSize: '1.4 MB',
    agent1: 'RegistryCheck',
    agent1Status: 'PASSED',
    agent2: 'ArithmeticCheck',
    agent2Status: 'RUNNING',
    preview: JSON.stringify(
      {
        entity: 'Claril Inc',
        assets: 1482000.0,
        risk_score: 0.032,
        audit_trail: 'verified',
      },
      null,
      2
    ),
  },
  legal: {
    fileName: 'lease_agreement_v4.pdf',
    fileDesc: 'Commercial lease agreement',
    fileSize: '2.8 MB',
    agent1: 'ClauseExtractor',
    agent1Status: 'PASSED',
    agent2: 'SignatureVerify',
    agent2Status: 'RUNNING',
    preview: JSON.stringify(
      {
        parties: ['Sydnar Tech', 'Hexagon LLC'],
        lease_term: '60_months',
        signature_detected: true,
        liability_limit: 5000000,
      },
      null,
      2
    ),
  },
  clinical: {
    fileName: 'patient_discharge_log.txt',
    fileDesc: 'Unstructured discharge log',
    fileSize: '420 KB',
    agent1: 'ICD10Mapper',
    agent1Status: 'PASSED',
    agent2: 'DosageCrossCheck',
    agent2Status: 'RUNNING',
    preview: JSON.stringify(
      {
        patient_id: 'pat_99812',
        diagnoses: ['J45.909', 'I10'],
        rx_prescribed: 'Albuterol_90mcg',
        dosage_conflict: false,
      },
      null,
      2
    ),
  },
};

export function DomainSwitcher() {
  const [activeDomain, setActiveDomain] = React.useState<Domain>('financial');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [renderedDomain, setRenderedDomain] = React.useState<Domain>('financial');

  const handleTabChange = (domain: Domain) => {
    if (domain === activeDomain) return;
    setIsTransitioning(true);
    setActiveDomain(domain);
    setTimeout(() => {
      setRenderedDomain(domain);
      setIsTransitioning(false);
    }, 150);
  };

  const current = domainData[renderedDomain];

  return (
    <div className="relative w-full rounded-[10px] border border-slate-800 bg-[#12151A] p-6 shadow-2xl overflow-hidden transition-all duration-300 hover:border-slate-700">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {/* Dashboard Topbar Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex gap-2">
          {(['financial', 'legal', 'clinical'] as Domain[]).map((tab) => {
            const isActive = activeDomain === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-3 py-1.5 rounded-[4px] font-mono text-[10px] font-semibold transition-all uppercase border ${
                  isActive
                    ? 'bg-[#00C8FF]/10 text-[#00C8FF] border-[#00C8FF]/20'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                {tab === 'financial' ? 'Financials' : tab === 'legal' ? 'Legal' : 'Clinical'}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="h-2 w-2 rounded-full bg-slate-700" />
          <span className="h-2 w-2 rounded-full bg-slate-700" />
        </div>
      </div>

      {/* Inner Ingest/Verification Display */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-[300px] transition-opacity duration-150 ${
          isTransitioning ? 'opacity-40 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
      >
        {/* Left Panel: Ingestion Document Card */}
        <div className="border border-slate-800 bg-[#090B0E]/60 p-4 rounded-[6px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="font-mono text-[10px] text-slate-400">INGEST_STREAM</span>
              <span className="font-mono text-[9px] text-slate-500">{current.fileSize}</span>
            </div>
            
            <div className="flex items-center gap-3 bg-[#12151A] border border-slate-800 p-3 rounded-[4px]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-[#00C8FF]/10 text-[#00C8FF]">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs font-semibold truncate text-white">
                  {current.fileName}
                </div>
                <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                  {current.fileDesc}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-6">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
              <span>Parser Status</span>
              <span className="text-emerald-500 font-bold">READY</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Processing Agents & Verified Live Payload */}
        <div className="border border-slate-800 bg-[#090B0E]/60 p-4 rounded-[6px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="font-mono text-[10px] text-slate-400">ACTIVE AGENTS</span>
              <span className="font-mono text-[9px] text-slate-500">2 NODES ACTIVE</span>
            </div>

            <div className="space-y-2.5">
              {/* Agent Node 1 */}
              <div className="flex items-center justify-between bg-[#12151A] border border-slate-800 p-2.5 rounded-[4px]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs font-semibold text-white">
                    {current.agent1}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-900/50 px-1.5 py-0.5 rounded">
                  {current.agent1Status}
                </span>
              </div>

              {/* Agent Node 2 */}
              <div className="flex items-center justify-between bg-[#12151A] border border-slate-800 p-2.5 rounded-[4px]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#00C8FF] animate-pulse" />
                  <span className="font-mono text-xs font-semibold text-white">
                    {current.agent2}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-[#00A8D6] font-bold bg-[#00C8FF]/10 border border-[#00C8FF]/20 px-1.5 py-0.5 rounded animate-pulse">
                  {current.agent2Status}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-slate-950/80 border border-slate-800 p-3 rounded-[4px] font-mono text-[10px] leading-relaxed overflow-hidden max-h-[110px] overflow-y-auto">
            <div className="text-[#00C8FF] font-semibold mb-1">{"// Live Schema Output"}</div>
            <pre className="text-slate-300 font-mono whitespace-pre-wrap">{current.preview}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
