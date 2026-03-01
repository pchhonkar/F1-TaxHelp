/**
 * Chat LLM client — NVIDIA Kimi K2.5 (free) or DeepSeek.
 * Uses NVIDIA first if NVIDIA_API_KEY is set (nvapi-...).
 */

import type { ChatMessage } from '@/types';

const PROVIDERS = {
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'moonshotai/kimi-k2.5',
    envKey: 'NVIDIA_API_KEY',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
} as const;

function getProvider(): (typeof PROVIDERS)[keyof typeof PROVIDERS] {
  if (process.env.NVIDIA_API_KEY) return PROVIDERS.nvidia;
  if (process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY)
    return PROVIDERS.deepseek;
  throw new Error(
    'NVIDIA_API_KEY (free) or DEEPSEEK_API_KEY or OPENAI_API_KEY is required for chat'
  );
}

export interface ChatOptions {
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  stream?: boolean;
}

/**
 * Stream chat completion — NVIDIA Kimi K2.5 (free tier) or DeepSeek.
 */
export async function streamChat(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
  const provider = getProvider();
  const apiKey =
    provider === PROVIDERS.nvidia
      ? process.env.NVIDIA_API_KEY!
      : process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(`${provider.envKey} is required for chat`);

  const body = {
    model: provider.model,
    stream: true,
    messages: [
      { role: 'system' as const, content: options.systemPrompt },
      ...options.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat API error: ${res.status} ${err}`);
  }

  const reader = res.body;
  if (!reader) throw new Error('No response body');

  // Parse OpenAI SSE format and emit plain text chunks for simpler consumption
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // skip malformed json
              }
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Non-streaming chat completion.
 */
export async function chat(options: ChatOptions): Promise<string> {
  const provider = getProvider();
  const apiKey =
    provider === PROVIDERS.nvidia
      ? process.env.NVIDIA_API_KEY!
      : process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error(`${provider.envKey} is required for chat`);

  const body = {
    model: provider.model,
    stream: false,
    messages: [
      { role: 'system' as const, content: options.systemPrompt },
      ...options.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Chat API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? '';
  return content;
}
