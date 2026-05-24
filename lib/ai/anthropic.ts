import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('Warning: ANTHROPIC_API_KEY is not defined in the environment variables.');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022'; // Use reliable fallback as standard default to prevent API key tier issues, or let's use claude-sonnet-4-5-20250929 as primary and catch errors
export const PRIMARY_MODEL = 'claude-sonnet-4-5-20250929';
export const FALLBACK_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Calculates the cost of a Claude API call in USD.
 * Rates:
 * - Input tokens: $3.00 per million ($0.000003 per token)
 * - Output tokens: $15.00 per million ($0.000015 per token)
 */
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens || 0) * 0.000003;
  const outputCost = (outputTokens || 0) * 0.000015;
  return Number((inputCost + outputCost).toFixed(6));
}
