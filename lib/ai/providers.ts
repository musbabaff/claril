import { AIProvider } from './types';

export interface ProviderConfig {
  defaultModel: string;
  envKey: string;
  pricing: {
    inputPerToken: number; // USD per token
    outputPerToken: number; // USD per token
  };
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  gemini: {
    defaultModel: 'gemini-2.0-flash',
    envKey: 'GEMINI_API_KEY',
    pricing: {
      inputPerToken: 0, // Free Tier
      outputPerToken: 0, // Free Tier
    },
  },
  anthropic: {
    defaultModel: 'claude-3-5-sonnet-20241022',
    envKey: 'ANTHROPIC_API_KEY',
    pricing: {
      inputPerToken: 0.000003, // $3.00 / M tokens
      outputPerToken: 0.000015, // $15.00 / M tokens
    },
  },
  openai: {
    defaultModel: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
    pricing: {
      inputPerToken: 0.00000015, // $0.15 / M tokens
      outputPerToken: 0.0000006, // $0.60 / M tokens
    },
  },
};

/**
 * Returns a list of providers that have their API keys defined in the environment.
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  
  if (process.env.GEMINI_API_KEY) {
    providers.push('gemini');
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.push('anthropic');
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai');
  }
  
  return providers;
}

/**
 * Resolves the active provider to use, adhering to precedence rules:
 * 1. env.DEFAULT_AI_PROVIDER (if set and active)
 * 2. gemini (for free tier demo)
 * 3. anthropic
 * 4. openai
 */
export function getDefaultProvider(): AIProvider {
  const available = getAvailableProviders();
  
  const envDefault = process.env.DEFAULT_AI_PROVIDER as AIProvider | undefined;
  if (envDefault && available.includes(envDefault)) {
    return envDefault;
  }
  
  if (available.includes('gemini')) return 'gemini';
  if (available.includes('anthropic')) return 'anthropic';
  if (available.includes('openai')) return 'openai';
  
  // Hard fallback if no key is present (allows graceful runtime warning handling)
  return 'gemini';
}

/**
 * Computes USD cost based on token counts and provider rates.
 */
export function calculateAICost(
  provider: AIProvider,
  inputTokens: number,
  outputTokens: number
): number {
  const config = PROVIDER_CONFIGS[provider];
  if (!config) return 0;
  
  const inputCost = (inputTokens || 0) * config.pricing.inputPerToken;
  const outputCost = (outputTokens || 0) * config.pricing.outputPerToken;
  
  return Number((inputCost + outputCost).toFixed(6));
}
