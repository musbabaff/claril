import { UniversalExtractionSchema, UniversalExtraction } from './extraction-schemas';
import { complete } from './complete';
import { AIMessage, AIContentBlock, AICompletionResult } from './types';

export interface ExtractionResult {
  structured_data: UniversalExtraction;
  raw_data: string;
  confidence_score: number;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  provider: string;
  model: string;
}

// Extraction tool JSON-schema matching UniversalExtractionSchema
const EXTRACTION_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    document_type_detected: {
      type: 'string',
      enum: ['invoice', 'identity', 'contract', 'other'],
      description: 'The primary classification of the document.',
    },
    summary: {
      type: 'string',
      description: 'A detailed summary of the document, including its context, purpose, and key takeaways.',
    },
    key_entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the organization, person, or bank.' },
          type: { type: 'string', description: 'Type/role of entity, e.g., Vendor, Client, Issuer, Bank.' },
        },
        required: ['name', 'type'],
      },
      description: 'Key organizations, persons, or institutions involved in the document.',
    },
    key_dates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Context of the date, e.g., Issue Date, Expiry Date, Due Date.' },
          date: { type: 'string', description: 'Date string, preferably YYYY-MM-DD.' },
        },
        required: ['label', 'date'],
      },
      description: 'Critical dates found in the document.',
    },
    key_amounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'What the amount represents, e.g., Subtotal, Total Due, Expiration Fee.' },
          amount: { type: 'number', description: 'Numerical value of the amount.' },
          currency: { type: 'string', description: 'Currency identifier, e.g., USD, AZN, EUR, GBP.' },
        },
        required: ['label', 'amount', 'currency'],
      },
      description: 'Critical monetary or transaction amounts.',
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'A value from 0.0 to 1.0 representing confidence in the readability and completeness of the extraction.',
    },
    anomalies: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any warning signs, mismatched values, suspicious items, or spelling errors detected.',
    },
    financial_enrichment: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Transaction line-item date.' },
              description: { type: 'string', description: 'Line item description or item label.' },
              amount: { type: 'number', description: 'Cost or amount of the item.' },
            },
            required: ['description', 'amount'],
          },
          description: 'Itemized transactions or line items (common for invoices or statements).',
        },
        totals: {
          type: 'object',
          properties: {
            subtotal: { type: 'string', description: 'Subtotal amount' },
            tax: { type: 'string', description: 'Tax or VAT amount' },
            fees: { type: 'string', description: 'Any extra fees' },
            discount: { type: 'string', description: 'Any discount applied' },
            total: { type: 'string', description: 'Grand total amount' },
          },
          description: 'Aggregate totals found, e.g., subtotal, tax, fees, and grand total.',
        },
        balances: {
          type: 'object',
          properties: {
            starting_balance: { type: 'string', description: 'Starting or opening balance' },
            ending_balance: { type: 'string', description: 'Ending or closing balance' },
            current_balance: { type: 'string', description: 'Current or available balance' },
          },
          description: 'Account balance stats, e.g., starting_balance, ending_balance, current_balance.',
        },
      },
    },
    identity_enrichment: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Full name on the ID/passport.' },
        id_number: { type: 'string', description: 'Passport, driving license, SSN, or registration number.' },
        dates: {
          type: 'object',
          properties: {
            birth_date: { type: 'string', description: 'Date of birth (YYYY-MM-DD)' },
            issue_date: { type: 'string', description: 'Date of issue (YYYY-MM-DD)' },
            expiry_date: { type: 'string', description: 'Date of expiry (YYYY-MM-DD)' },
          },
          description: 'Birth date, issue date, expiry date.',
        },
      },
    },
    contract_enrichment: {
      type: 'object',
      properties: {
        parties: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of contracting parties.',
        },
        terms: {
          type: 'object',
          properties: {
            payment_terms: { type: 'string', description: 'Payment terms/due schedule' },
            duration: { type: 'string', description: 'Duration or term of contract' },
            termination: { type: 'string', description: 'Termination notice or conditions' },
            renewal: { type: 'string', description: 'Renewal terms' },
            jurisdiction: { type: 'string', description: 'Applicable law / jurisdiction' },
          },
          description: 'Key contractual terms.',
        },
        clauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string', description: 'Clause section number or title.' },
              text: { type: 'string', description: 'Summary of the clause detail.' },
            },
            required: ['section', 'text'],
          },
          description: 'Significant clauses extracted.',
        },
      },
    },
  },
  required: ['document_type_detected', 'summary', 'confidence'],
};

/**
 * Maps a file extension to its appropriate media type.
 */
function getMediaType(filename: string): { type: 'document' | 'image'; mediaType: string } {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return { type: 'document', mediaType: 'application/pdf' };
    case 'png':
      return { type: 'image', mediaType: 'image/png' };
    case 'jpg':
    case 'jpeg':
      return { type: 'image', mediaType: 'image/jpeg' };
    case 'webp':
      return { type: 'image', mediaType: 'image/webp' };
    case 'gif':
      return { type: 'image', mediaType: 'image/gif' };
    default:
      return { type: 'image', mediaType: 'image/jpeg' };
  }
}

/**
 * Extracts structured data from a document file stored as base64 using model-agnostic complete interface.
 */
export async function extractDocument(
  fileBase64: string,
  filename: string,
  retryCount = 0
): Promise<ExtractionResult> {
  const { type, mediaType } = getMediaType(filename);

  const systemPrompt = `You are a highly precise document extraction system.
Analyze the provided document or image. Extract all details accurately matching the fields and types specified in the JSON schema.
Do not guess values. If a field or detail is not present in the document, omit it or set it to empty.
Ensure all extracted numbers are accurate, especially monetary values and dates.
You MUST return a valid JSON object matching the requested schema. Do not explain anything.`;

  // Create standardized content blocks for vision / multimodal parsing
  const fileBlock: AIContentBlock = {
    type: type === 'document' ? 'document' : 'image',
    source: {
      type: 'base64',
      media_type: mediaType,
      data: fileBase64,
    },
  };

  const messages: AIMessage[] = [
    {
      role: 'user',
      content: [
        fileBlock,
        {
          type: 'text',
          text: `Please analyze the file "${filename}" and extract its contents into a structured JSON object according to the schema. Make sure to identify if the document type is an invoice, identity document, contract, or other, and fill in the corresponding enrichment fields.`,
        },
      ],
    },
  ];

  console.log(`Sending extraction request for ${filename} using the default multi-provider model...`);

  // Call the core complete module in jsonMode with the extraction schema
  const completionResult = await complete({
    system: systemPrompt,
    messages: messages,
    jsonMode: true,
    jsonSchema: EXTRACTION_TOOL_SCHEMA,
    temperature: 0.1,
  });

  return await processExtractionResponse(
    completionResult,
    fileBase64,
    filename,
    systemPrompt,
    messages,
    retryCount
  );
}

/**
 * Processes the response from the complete call, performs Zod verification, and retries if schema errors exist.
 */
async function processExtractionResponse(
  completionResult: AICompletionResult,
  fileBase64: string,
  filename: string,
  systemPrompt: string,
  originalMessages: AIMessage[],
  retryCount: number
): Promise<ExtractionResult> {
  const rawJson = completionResult.json || completionResult.text;

  // 1. Attempt to parse JSON string if not already parsed
  let parsedJson: unknown;
  if (typeof rawJson === 'string') {
    try {
      parsedJson = JSON.parse(rawJson.trim());
    } catch {
      console.warn('Raw string response from AI failed initial parse. Attempting regex extract...');
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedJson = JSON.parse(match[0].trim());
        } catch (innerE) {
          console.error('Regex JSON match failed to parse:', innerE);
        }
      }
    }
  } else {
    parsedJson = rawJson;
  }

  // 2. Validate using Zod
  const validationResult = UniversalExtractionSchema.safeParse(parsedJson);

  if (validationResult.success) {
    return {
      structured_data: validationResult.data,
      raw_data: completionResult.text,
      confidence_score: validationResult.data.confidence,
      tokens_input: completionResult.inputTokens,
      tokens_output: completionResult.outputTokens,
      cost_usd: completionResult.costUsd,
      provider: completionResult.provider,
      model: completionResult.model,
    };
  }

  // 3. Zod validation failed — perform self-correction loop
  const zodErrorString = JSON.stringify(validationResult.error.format(), null, 2);
  console.warn(`Zod Schema Validation failed for ${filename} using ${completionResult.provider}:${completionResult.model}. Errors:\n`, zodErrorString);

  if (retryCount >= 1) {
    throw new Error(`Failed to extract valid structured data matching Zod schemas after self-correction retry. Validation Errors:\n${zodErrorString}`);
  }

  console.log(`Triggering self-correction retry loop for ${filename}...`);

  const assistantResponseContent = typeof completionResult.text === 'string' 
    ? completionResult.text 
    : JSON.stringify(parsedJson || rawJson, null, 2);

  const retryMessages: AIMessage[] = [
    ...originalMessages,
    {
      role: 'assistant',
      content: assistantResponseContent,
    },
    {
      role: 'user',
      content: `Your previous JSON output failed standard schema validation. Please review the specific schema discrepancies below and return a fully corrected, valid JSON object matching the requested schema.

Validation Errors:
${zodErrorString}

Ensure all required fields are included with correct types. Do not write explanations, only a raw valid JSON object.`,
    },
  ];

  let retryResult;
  try {
    retryResult = await complete({
      system: systemPrompt,
      messages: retryMessages,
      jsonMode: true,
      jsonSchema: EXTRACTION_TOOL_SCHEMA,
      temperature: 0.1,
    }, completionResult.provider); // Force the same provider for retry continuity
  } catch (error) {
    console.error('Self-correction API call crashed:', error);
    throw new Error(`Self-correction API call crashed: ${error}`);
  }

  const processedRetry = await processExtractionResponse(
    retryResult,
    fileBase64,
    filename,
    systemPrompt,
    retryMessages,
    retryCount + 1
  );

  // Accumulate token stats and costs from both attempts
  return {
    ...processedRetry,
    tokens_input: completionResult.inputTokens + processedRetry.tokens_input,
    tokens_output: completionResult.outputTokens + processedRetry.tokens_output,
    cost_usd: Number((completionResult.costUsd + processedRetry.cost_usd).toFixed(6)),
  };
}
