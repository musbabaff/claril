import { AICompletionRequest, AIProvider } from './types';
import { PROVIDER_CONFIGS, getDefaultProvider } from './providers';

/**
 * Exposes a standard delta streaming trigger using async generators.
 * This can be used for chatbot flows or long reasonings where real-time text streams are desired.
 */
export async function* streamComplete(
  req: AICompletionRequest,
  provider?: AIProvider
): AsyncGenerator<string, void, unknown> {
  const activeProvider = provider || getDefaultProvider();
  const config = PROVIDER_CONFIGS[activeProvider];

  if (!config) {
    throw new Error(`Provider "${activeProvider}" is not configured.`);
  }

  const modelName = config.defaultModel;

  if (activeProvider === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: req.system,
    });

    const contents: import('@google/generative-ai').Content[] = [];
    for (const msg of req.messages) {
      if (msg.role === 'system') continue;
      const role = msg.role === 'assistant' ? 'model' : 'user';
      const parts: import('@google/generative-ai').Part[] = [];
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
      contents.push({ role, parts });
    }

    const result = await model.generateContentStream({ contents });
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  } else if (activeProvider === 'anthropic') {
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
          if (block.type === 'text') return { type: 'text', text: block.text || '' };
          if (block.type === 'image') {
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: block.source?.media_type || 'image/jpeg',
                data: block.source?.data || '',
              },
            };
          }
          if (block.type === 'document') {
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

    const stream = await anthropic.messages.create({
      model: modelName,
      max_tokens: req.maxTokens || 4000,
      system: req.system || '',
      messages: anthropicMessages as unknown as import('@anthropic-ai/sdk').Anthropic.MessageCreateParams['messages'],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  } else if (activeProvider === 'openai') {
    const { default: OpenAI } = await import('openai');
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) throw new Error('OPENAI_API_KEY is missing.');
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
          if (block.type === 'text') return { type: 'text' as const, text: block.text || '' };
          if (block.type === 'image') {
            return {
              type: 'image_url' as const,
              image_url: {
                url: `data:${block.source?.media_type || 'image/jpeg'};base64,${block.source?.data || ''}`,
              },
            };
          }
          return { type: 'text' as const, text: `[Document file: ${block.source?.media_type}]` };
        });
      }
      openaiMessages.push({
        role: msg.role === 'system' ? 'system' : (msg.role === 'assistant' ? 'assistant' : 'user'),
        content,
      });
    }

    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: openaiMessages as unknown as import('openai').OpenAI.Chat.ChatCompletionMessageParam[],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) yield text;
    }
  }
}
