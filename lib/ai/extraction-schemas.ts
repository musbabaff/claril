import { z } from 'zod';

// Key Entity Schema
export const KeyEntitySchema = z.object({
  name: z.string().describe('The name of the entity, e.g., company name, person name, bank name'),
  type: z.string().describe('The type of the entity, e.g., Organization, Individual, Bank, Government Body'),
});

// Key Date Schema
export const KeyDateSchema = z.object({
  label: z.string().describe('The context of the date, e.g., Issue Date, Expiry Date, Transaction Date'),
  date: z.string().describe('The date in ISO format YYYY-MM-DD, or string representation if exact ISO cannot be parsed'),
});

// Key Amount Schema
export const KeyAmountSchema = z.object({
  label: z.string().describe('The context of the amount, e.g., Total Paid, Subtotal, Invoice Amount, Fees'),
  amount: z.number().describe('The numerical value of the amount'),
  currency: z.string().describe('The currency code or symbol, e.g., USD, EUR, AZN, GBP'),
});

// --- Type-Specific Enrichments ---

// Financial Enrichment Schema
export const FinancialEnrichmentSchema = z.object({
  transactions: z.array(
    z.object({
      date: z.string().optional().describe('Date of the transaction'),
      description: z.string().describe('Description of transaction or item'),
      amount: z.number().describe('Amount associated with this transaction or item line'),
    })
  ).optional().describe('Individual line items or transaction records from the document'),
  totals: z.record(z.union([z.number(), z.string()])).optional().describe('Aggregated financial totals, e.g. Subtotal, Tax, Fees, Grand Total'),
  balances: z.record(z.union([z.number(), z.string()])).optional().describe('Account balance details, e.g. Beginning Balance, Ending Balance'),
}).optional();

// Identity Enrichment Schema
export const IdentityEnrichmentSchema = z.object({
  name: z.string().optional().describe('Full name identified in the identity document'),
  id_number: z.string().optional().describe('ID number, Passport number, Driver license number, etc.'),
  dates: z.record(z.string()).optional().describe('Key dates for identity, e.g. Date of Birth, Date of Issue, Expiry Date'),
}).optional();

// Structured Text / Contract Enrichment Schema
export const ContractEnrichmentSchema = z.object({
  parties: z.array(z.string()).optional().describe('Parties involved in the contract or agreement'),
  terms: z.record(z.union([z.string(), z.number()])).optional().describe('Key terms such as payment terms, duration, termination conditions'),
  clauses: z.array(
    z.object({
      section: z.string().describe('Section header or number, e.g. Section 1.2'),
      text: z.string().describe('Brief summary or exact text of the clause'),
    })
  ).optional().describe('Crucial clauses extracted (e.g. indemnity, liability limitations)'),
}).optional();

// --- Universal Base Schema ---
// Combines base metadata with potential optional enrichments
export const UniversalExtractionSchema = z.object({
  document_type_detected: z.enum(['invoice', 'identity', 'contract', 'other']).describe('The detected category of the document'),
  summary: z.string().describe('A high-quality executive summary of the document, explaining its nature, purpose, and key facts'),
  key_entities: z.array(KeyEntitySchema).default([]).describe('Important entities found (e.g., vendor, client, issuer, holder, banks)'),
  key_dates: z.array(KeyDateSchema).default([]).describe('Important dates (e.g., issue date, due date, statement date, date of birth, expiry date)'),
  key_amounts: z.array(KeyAmountSchema).default([]).describe('Important monetary amounts (e.g., total, subtotal, balance, limit, monthly payment)'),
  confidence: z.number().min(0).max(1).describe('Confidence score from 0.0 to 1.0 based on data readability and extraction quality'),
  anomalies: z.array(z.string()).default([]).describe('Any potential issues, red flags, warning signals, typos, or mismatches detected in the document'),
  
  // Dynamic type-specific enrichments
  financial_enrichment: FinancialEnrichmentSchema,
  identity_enrichment: IdentityEnrichmentSchema,
  contract_enrichment: ContractEnrichmentSchema,
});

export type UniversalExtraction = z.infer<typeof UniversalExtractionSchema>;
export type KeyEntity = z.infer<typeof KeyEntitySchema>;
export type KeyDate = z.infer<typeof KeyDateSchema>;
export type KeyAmount = z.infer<typeof KeyAmountSchema>;
