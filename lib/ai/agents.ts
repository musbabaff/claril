// lib/ai/agents.ts
import { AIMessage } from './types';

export interface AgentConfig {
  name: string;
  role: string;
  icon: string;
  systemPrompt: string;
}

export const AGENT_SPECS: Record<string, AgentConfig> = {
  auditor: {
    name: 'Extraction Auditor',
    role: 'Data Verification & Consistency Auditor',
    icon: 'ShieldCheck',
    systemPrompt: `You are the Extraction Auditor agent. 
Your role is to verify the extracted data consistency, check for missing fields, cross-check related values (e.g. totals match line items sum, dates are valid, references are aligned), and flag any structural anomalies or data omissions.
Provide your reasoning step-by-step in a structured, clear tone. Highlight any warnings or concerns clearly.
Be concise but extremely thorough.`
  },
  risk: {
    name: 'Risk Analyst',
    role: 'Cognitive Risk & Quality Evaluator',
    icon: 'TrendingUp',
    systemPrompt: `You are the Risk Analyst agent.
Your role is to assess the overall risk profile and quality metric of the case based on the extracted documents and case details.
You must output a Risk/Quality Score from 0 (Critical Risk) to 100 (Perfect Quality / Zero Risk).
Assess factors such as extreme transaction volumes, suspicious/missing signatures, inconsistencies, vendor/bank reliability, and general risk exposures.
Explain your reasoning clearly, outlining positive indicators and negative risk vectors.
Ensure you recommend steps to mitigate any identified risks.`
  },
  compliance: {
    name: 'Compliance Checker',
    role: 'Rules completeness & anomaly detector',
    icon: 'FileCheck',
    systemPrompt: `You are the Compliance Checker agent.
Your role is to check the case against completeness rules and standard regulatory/operational compliance.
Verify whether all required legal elements, KYC items, signatures, or disclosures are present in the extractions.
Identify any compliance gaps, potential regulatory violations, formatting errors, or standard operating procedure anomalies.
Provide a clear checklist of compliant items vs violations.`
  },
  synthesizer: {
    name: 'Synthesizer',
    role: 'Case Consolidation & Strategic Recommender',
    icon: 'Cpu',
    systemPrompt: `You are the Synthesizer agent.
Your role is to swallow the analysis reports of the three previous agents (Auditor, Risk Analyst, Compliance Checker), merge their findings, resolve conflicts, and emit a final overall strategic recommendation, overall final score, and high-level bulleted summary.
You must structure your thoughts clearly.
At the end of your analysis, you MUST provide a final JSON block matching this EXACT shape for parsing:
\`\`\`json
{
  "overall_score": <number between 0 and 100>,
  "recommendation": "<text summarizing final decision/action>",
  "key_findings": ["finding 1", "finding 2", ...]
}
\`\`\`
Ensure the JSON block is perfectly formatted at the very end of your response.`
  }
};

/**
 * Utility to construct standard prompt messages for case analysis.
 */
export function buildAgentAnalysisMessages(
  agentName: string,
  caseInfo: { subject_name: string; case_reference?: string; primary_value?: number; description?: string },
  extractions: Array<{ docName: string; docType: string; data: unknown }>,
  previousReports?: Array<{ agent: string; content: string }>,
  language = 'English'
): AIMessage[] {
  let contextStr = `CASE METADATA:
- Subject Entity Name: ${caseInfo.subject_name}
- Reference ID: ${caseInfo.case_reference || 'N/A'}
- Primary Value / Metric: ${caseInfo.primary_value !== undefined ? caseInfo.primary_value : 'N/A'}
- Description: ${caseInfo.description || 'N/A'}

EXTRACTED DOCUMENTS DATA:
`;

  extractions.forEach((ext, i) => {
    contextStr += `\n[Document #${i + 1}] Name: ${ext.docName} | Type: ${ext.docType}\nExtracted JSON Payload:\n${JSON.stringify(ext.data, null, 2)}\n`;
  });

  if (previousReports && previousReports.length > 0) {
    contextStr += `\nPREVIOUS SPECIALIZED AGENT REPORTS:\n`;
    previousReports.forEach(r => {
      contextStr += `\n--- REPORT BY: ${r.agent} ---\n${r.content}\n`;
    });
  }

  return [
    {
      role: 'user',
      content: `Analyze the case data below. Respond in ${language}.
      
${contextStr}

Begin your analysis now. Run step-by-step and produce a thorough report.`
    }
  ];
}
