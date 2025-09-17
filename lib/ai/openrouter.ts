/**
 * CENTRALIZED OPENROUTER SERVICE
 *
 * Provides a clean, reusable interface for OpenRouter API calls
 * Uses models.ts configuration for dynamic model selection
 * Supports both streaming and non-streaming responses
 */

import { chatModels, DEFAULT_CHAT_MODEL } from './models';

// OpenRouter configuration constants
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_AGENT = 'TroponinIQ/1.0';
const CONNECTION_TIMEOUT = 30000;
const REQUEST_TIMEOUT = 60000;

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequestOptions {
  model?: string; // Model ID from models.ts (e.g., 'claude-4-sonnet', 'gpt-5-mini')
  messages: OpenRouterMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface OpenRouterResponse {
  choices: Array<{
    message?: {
      content: string;
    };
    delta?: {
      content?: string;
    };
  }>;
}

/**
 * Get OpenRouter model ID from our internal model configuration
 */
function getOpenRouterModel(modelId: string = DEFAULT_CHAT_MODEL): string {
  const model = chatModels.find((m) => m.id === modelId);
  if (!model?.openrouterModel) {
    console.warn(`[OpenRouter] Model ${modelId} not found, using default`);
    const defaultModel = chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL);
    return defaultModel?.openrouterModel || 'anthropic/claude-3.5-sonnet';
  }
  return model.openrouterModel;
}

/**
 * Get base headers for OpenRouter API requests
 */
function getBaseHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-Title': 'TroponinIQ',
    'User-Agent': OPENROUTER_AGENT,
    Connection: 'keep-alive',
    'Accept-Encoding': 'gzip, deflate, br',
  };
}

/**
 * Make a streaming OpenRouter API request
 */
export async function openRouterStream(
  options: OpenRouterRequestOptions,
): Promise<ReadableStream<string>> {
  const startTime = Date.now();
  const openrouterModel = getOpenRouterModel(options.model);

  console.log(`[OpenRouter] 🚀 Streaming request to ${openrouterModel}`);
  console.log(
    `[OpenRouter] 📏 Messages: ${options.messages.length}, Temperature: ${options.temperature || 0.7}`,
  );

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        model: openrouterModel,
        messages: options.messages,
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 3000, // Encourage concise, focused responses
        stream: true,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API failed: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new Error('No response body from OpenRouter');
    }

    console.log(
      `[OpenRouter] ✅ Stream initiated (${Date.now() - startTime}ms)`,
    );

    // Process the raw stream into text chunks
    return processOpenRouterStream(response.body, startTime);
  } catch (error) {
    console.error('[OpenRouter] Stream request failed:', error);
    console.error(
      `[OpenRouter] Request failed after ${Date.now() - startTime}ms`,
    );
    throw error;
  }
}

/**
 * Make a non-streaming OpenRouter API request
 */
export async function openRouterRequest(
  options: OpenRouterRequestOptions,
): Promise<string> {
  const startTime = Date.now();
  const openrouterModel = getOpenRouterModel(options.model);

  console.log(`[OpenRouter] 🚀 Request to ${openrouterModel}`);
  console.log(
    `[OpenRouter] 📏 Messages: ${options.messages.length}, Temperature: ${options.temperature || 0.7}`,
  );

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: getBaseHeaders(),
      body: JSON.stringify({
        model: openrouterModel,
        messages: options.messages,
        temperature: options.temperature || 0.3,
        max_tokens: options.maxTokens || 3000, // Encourage concise, focused responses
        stream: false,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(
        `OpenRouter API failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: OpenRouterResponse = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No content in OpenRouter response');
    }

    console.log(
      `[OpenRouter] ✅ Request completed (${Date.now() - startTime}ms)`,
    );
    return content;
  } catch (error) {
    console.error('[OpenRouter] Request failed:', error);
    console.error(
      `[OpenRouter] Request failed after ${Date.now() - startTime}ms`,
    );
    throw error;
  }
}

/**
 * Process streaming response from OpenRouter
 */
function processOpenRouterStream(
  stream: ReadableStream<Uint8Array>,
  startTime: number,
): ReadableStream<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let totalChunks = 0;
  let totalBytes = 0;
  let firstChunkTime: number | undefined;

  return new ReadableStream<string>({
    async start(controller) {
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            const endTime = Date.now();
            console.log(
              `[OpenRouter] 📊 Stream completed: ${totalChunks} chunks, ${totalBytes} bytes, ${endTime - startTime}ms total`,
            );

            // Process any remaining buffer content
            if (buffer.trim()) {
              processBufferLines(buffer, controller);
            }
            break;
          }

          // Performance tracking
          totalChunks++;
          totalBytes += value.length;
          if (!firstChunkTime) {
            firstChunkTime = Date.now();
            console.log(
              `[OpenRouter] ⚡ First chunk received (${firstChunkTime - startTime}ms TTFB)`,
            );
          }

          // Decode chunk and add to buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (processStreamLine(line, controller)) {
              return; // Stream ended
            }
          }
        }
      } catch (error) {
        console.error('[OpenRouter] Stream processing error:', error);
        console.error(
          `[OpenRouter] Stream failed after ${Date.now() - startTime}ms, ${totalChunks} chunks processed`,
        );
        controller.error(error);
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },

    cancel() {
      console.log('[OpenRouter] Stream cancelled by client');
      reader.releaseLock();
    },
  });
}

/**
 * Process a single line from the OpenRouter stream
 * Returns true if stream should end
 */
function processStreamLine(
  line: string,
  controller: ReadableStreamDefaultController<string>,
): boolean {
  if (!line.trim() || !line.startsWith('data: ')) {
    return false;
  }

  const data = line.slice(6);
  if (data === '[DONE]') {
    controller.close();
    return true;
  }

  try {
    const parsed: OpenRouterResponse = JSON.parse(data);
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) {
      controller.enqueue(content);
    }
  } catch (parseError) {
    // Skip malformed JSON chunks - normal for SSE streams
    return false;
  }

  return false;
}

/**
 * Process remaining buffer lines when stream ends
 */
function processBufferLines(
  buffer: string,
  controller: ReadableStreamDefaultController<string>,
): void {
  const lines = buffer.split('\n');
  for (const line of lines) {
    if (processStreamLine(line, controller)) {
      break;
    }
  }
}

/**
 * Convenience function for chat completion (uses default chat model)
 */
export async function chatCompletion(
  messages: OpenRouterMessage[],
  temperature = 0.3,
  maxTokens = 1000,
): Promise<string> {
  return openRouterRequest({
    model: DEFAULT_CHAT_MODEL,
    messages,
    temperature,
    maxTokens,
  });
}

/**
 * Convenience function for streaming chat completion (uses default chat model)
 */
export async function chatCompletionStream(
  messages: OpenRouterMessage[],
  temperature = 0.3,
  maxTokens = 1000,
): Promise<ReadableStream<string>> {
  return openRouterStream({
    model: DEFAULT_CHAT_MODEL,
    messages,
    temperature,
    maxTokens,
  });
}

/**
 * Convenience function for title generation (optimized settings)
 */
export async function generateTitle(prompt: string): Promise<string> {
  return openRouterRequest({
    model: DEFAULT_CHAT_MODEL, // Use same model for consistency
    messages: [
      {
        role: 'system',
        content: `You will generate a short title based on the first message a user begins a conversation with.
- Ensure it is not more than 80 characters long
- The title should be a summary of the user's message
- Do not use quotes or colons
- Make it concise and descriptive`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3, // Lower temperature for more consistent titles
    maxTokens: 50, // Fewer tokens needed for titles
  });
}
