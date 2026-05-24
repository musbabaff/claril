export type AIProvider = 'gemini' | 'anthropic' | 'openai';

export interface AIContentBlock {
  type: 'text' | 'image' | 'document';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string; // Base64 content
  };
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | AIContentBlock[];
}

export interface AICompletionRequest {
  system?: string;
  messages: AIMessage[];
  document?: {
    base64: string;
    name: string;
  };
  jsonMode?: boolean;
  jsonSchema?: Record<string, unknown>;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResult {
  text: string;
  json?: Record<string, unknown> | unknown;
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}
