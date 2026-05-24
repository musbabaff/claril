import { GoogleGenerativeAI, Content, Part, Schema } from '@google/generative-ai';
import { AICompletionRequest, AICompletionResult, AIProvider } from './types';
import { PROVIDER_CONFIGS, getDefaultProvider, calculateAICost } from './providers';

/**
 * Gemini Provider Adapter
 */
async function completeGemini(req: AICompletionRequest, modelName: string): Promise<AICompletionResult> {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: req.system,
  });

  const contents: Content[] = [];

  // 1. Process messages content into Gemini parts format
  for (const msg of req.messages) {
    if (msg.role === 'system') continue; // Handled as systemInstruction

    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: Part[] = [];

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else {
      for (const block of msg.content) {
        if (block.type === 'text') {
          parts.push({ text: block.text || '' });
        } else if (block.type === 'image' || block.type === 'document') {
          if (block.source && block.source.type === 'base64') {
            parts.push({
              inlineData: {
                mimeType: block.source.media_type,
                data: block.source.data,
              },
            });
          }
        }
      }
    }

    // Append to existing or create new contents block
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts.push(...parts);
    } else {
      contents.push({ role, parts });
    }
  }

  // 2. Prepare generation config
  const generationConfig: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: Schema;
  } = {};
  if (req.temperature !== undefined) generationConfig.temperature = req.temperature;
  if (req.maxTokens !== undefined) generationConfig.maxOutputTokens = req.maxTokens;
  
  if (req.jsonMode) {
    generationConfig.responseMimeType = 'application/json';
    if (req.jsonSchema) {
      generationConfig.responseSchema = req.jsonSchema as unknown as Schema;
    }
  }

  // 3. Call Gemini API with retry for rate limits
  let result;
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      result = await model.generateContent({
        contents,
        generationConfig,
      });
      break; // Success, exit retry loop
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 429 && attempt < maxRetries) {
        // Parse retry delay from error message, default to escalating waits
        const retryMatch = String(error.message || '').match(/retry in ([\d.]+)s/i);
        const waitSeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) + 5 : (60 * (attempt + 1));
        console.warn(`Gemini rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${waitSeconds}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
      } else {
        throw err; // Non-retryable error or max retries exceeded
      }
    }
  }
  if (!result) {
    throw new Error('Gemini API call failed after all retry attempts.');
  }

  const responseText = result.response.text();
  
  // Extract token usage stats
  const inputTokens = result.response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = result.response.usageMetadata?.candidatesTokenCount || 0;
  const costUsd = calculateAICost('gemini', inputTokens, outputTokens);

  let json: unknown = undefined;
  if (req.jsonMode) {
    try {
      json = JSON.parse(responseText.trim());
    } catch {
      console.error('Failed to parse Gemini JSON output');
      // Attempt regex extraction as fallback
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          json = JSON.parse(jsonMatch[0].trim());
        } catch (innerE) {
          console.error('Failed to parse Gemini JSON regex match:', innerE);
        }
      }
    }
  }

  return {
    text: responseText,
    json,
    provider: 'gemini',
    model: modelName,
    inputTokens,
    outputTokens,
    costUsd,
  };
}

/**
 * Anthropic Provider Adapter
 */
async function completeAnthropic(req: AICompletionRequest, modelName: string): Promise<AICompletionResult> {
  const { anthropic } = await import('./anthropic');

  type AnthropicContentBlock = 
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

  interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string | AnthropicContentBlock[];
  }

  const anthropicMessages: AnthropicMessage[] = [];

  for (const msg of req.messages) {
    if (msg.role === 'system') continue;

    let content: string | AnthropicContentBlock[];
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else {
      content = msg.content.map((block): AnthropicContentBlock => {
        if (block.type === 'text') {
          return { type: 'text', text: block.text || '' };
        } else if (block.type === 'image') {
          return {
            type: 'image',
            source: {
              type: 'base64',
              media_type: block.source?.media_type || 'image/jpeg',
              data: block.source?.data || '',
            },
          };
        } else if (block.type === 'document') {
          return {
            type: 'document',
            source: {
              type: 'base64',
              media_type: block.source?.media_type || 'application/pdf',
              data: block.source?.data || '',
            },
          };
        }
        return { type: 'text', text: '' };
      });
    }

    anthropicMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content,
    });
  }

  const systemPrompt = req.system || '';
  const tools: Array<{
    name: string;
    description?: string;
    input_schema: Record<string, unknown>;
  }> = [];
  let toolChoice: { type: 'tool'; name: string } | undefined = undefined;

  // Use Tool Use to enforce schema for JSON mode in Anthropic
  if (req.jsonMode && req.jsonSchema) {
    tools.push({
      name: 'submit_extracted_data',
      description: 'Submit the final extracted structured JSON data matching the requested schema.',
      input_schema: req.jsonSchema,
    });
    toolChoice = { type: 'tool', name: 'submit_extracted_data' };
  }

  const response = await anthropic.messages.create({
    model: modelName,
    max_tokens: req.maxTokens || 4000,
    system: systemPrompt,
    messages: anthropicMessages as unknown as import('@anthropic-ai/sdk').Anthropic.MessageCreateParams['messages'],
    ...(tools.length > 0 ? { tools: tools as unknown as import('@anthropic-ai/sdk').Anthropic.MessageCreateParams['tools'], tool_choice: toolChoice as unknown as import('@anthropic-ai/sdk').Anthropic.MessageCreateParams['tool_choice'] } : {}),
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = calculateAICost('anthropic', inputTokens, outputTokens);

  let responseText = '';
  let json: unknown = undefined;

  if (tools.length > 0) {
    const toolUse = response.content.find(
      (block): block is import('@anthropic-ai/sdk').Anthropic.ToolUseBlock => 
        block.type === 'tool_use' && block.name === 'submit_extracted_data'
    );
    if (toolUse) {
      json = toolUse.input;
      responseText = JSON.stringify(json, null, 2);
    } else {
      const textBlock = response.content.find(
        (block): block is import('@anthropic-ai/sdk').Anthropic.TextBlock => block.type === 'text'
      );
      responseText = textBlock ? textBlock.text : '';
    }
  } else {
    const textBlock = response.content.find(
      (block): block is import('@anthropic-ai/sdk').Anthropic.TextBlock => block.type === 'text'
    );
    responseText = textBlock ? textBlock.text : '';
    if (req.jsonMode) {
      try {
        json = JSON.parse(responseText.trim());
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            json = JSON.parse(jsonMatch[0].trim());
          } catch (innerE) {
            console.error('Failed to parse Anthropic JSON regex fallback:', innerE);
          }
        }
      }
    }
  }

  return {
    text: responseText,
    json,
    provider: 'anthropic',
    model: modelName,
    inputTokens,
    outputTokens,
    costUsd,
  };
}

/**
 * OpenAI Provider Adapter
 */
async function completeOpenAI(req: AICompletionRequest, modelName: string): Promise<AICompletionResult> {
  const { default: OpenAI } = await import('openai');
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not defined in the environment variables.');
  }

  const openai = new OpenAI({ apiKey });
  
  interface OpenAIMessageParam {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
  }

  const openaiMessages: OpenAIMessageParam[] = [];

  if (req.system) {
    openaiMessages.push({ role: 'system', content: req.system });
  }

  for (const msg of req.messages) {
    let content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else {
      content = msg.content.map(block => {
        if (block.type === 'text') {
          return { type: 'text' as const, text: block.text || '' };
        } else if (block.type === 'image') {
          return {
            type: 'image_url' as const,
            image_url: {
              url: `data:${block.source?.media_type || 'image/jpeg'};base64,${block.source?.data || ''}`,
            },
          };
        } else if (block.type === 'document') {
          // Fall back gracefully for OpenAI chat completion since PDF isn't supported natively
          console.warn('PDF document block passed to OpenAI. Falling back to textual placeholder.');
          return { type: 'text' as const, text: `[Document file: ${block.source?.media_type}]` };
        }
        return { type: 'text' as const, text: '' };
      });
    }

    openaiMessages.push({
      role: msg.role === 'system' ? 'system' : (msg.role === 'assistant' ? 'assistant' : 'user'),
      content,
    });
  }

  const options: {
    model: string;
    messages: OpenAIMessageParam[];
    temperature?: number;
    max_tokens?: number;
    response_format?: {
      type: 'json_object' | 'json_schema';
      json_schema?: {
        name: string;
        strict: boolean;
        schema: Record<string, unknown>;
      };
    };
  } = {
    model: modelName,
    messages: openaiMessages,
  };

  if (req.temperature !== undefined) options.temperature = req.temperature;
  if (req.maxTokens !== undefined) options.max_tokens = req.maxTokens;

  if (req.jsonMode) {
    if (req.jsonSchema) {
      options.response_format = {
        type: 'json_schema',
        json_schema: {
          name: 'document_extraction',
          strict: false, // Turn off strict to allow maximum compatibility with Zod models
          schema: req.jsonSchema,
        },
      };
    } else {
      options.response_format = { type: 'json_object' };
    }
  }

  const response = await openai.chat.completions.create(
    options as unknown as import('openai').OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
  );
  const responseText = response.choices[0]?.message?.content || '';
  
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  const costUsd = calculateAICost('openai', inputTokens, outputTokens);

  let json: unknown = undefined;
  if (req.jsonMode) {
    try {
      json = JSON.parse(responseText.trim());
    } catch {
      console.error('Failed to parse OpenAI JSON output');
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          json = JSON.parse(jsonMatch[0].trim());
        } catch (innerE) {
          console.error('Failed to parse OpenAI JSON regex fallback:', innerE);
        }
      }
    }
  }

  return {
    text: responseText,
    json,
    provider: 'openai',
    model: modelName,
    inputTokens,
    outputTokens,
    costUsd,
  };
}

/**
 * Unified dispatch function for multi-provider AI completion.
 */
export async function complete(
  req: AICompletionRequest,
  provider?: AIProvider
): Promise<AICompletionResult> {
  const activeProvider = provider || getDefaultProvider();
  const config = PROVIDER_CONFIGS[activeProvider];
  
  if (!config) {
    throw new Error(`Provider "${activeProvider}" is not configured or recognized.`);
  }

  const modelName = config.defaultModel;

  switch (activeProvider) {
    case 'gemini':
      return await completeGemini(req, modelName);
    case 'anthropic':
      return await completeAnthropic(req, modelName);
    case 'openai':
      return await completeOpenAI(req, modelName);
    default:
      throw new Error(`Unsupported provider choice: ${activeProvider}`);
  }
}
