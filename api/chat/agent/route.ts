/**
 * HYBRID AGENT CHAT API - STREAMING VERSION
 *
 * Simple, robust implementation:
 * 1. User asks question with full conversation context
 * 2. Hybrid agent handles ALL queries with selective tool usage
 * 3. No rigid routing, no refusals, no over-engineering
 * 4. Gets streaming response from Claude via OpenRouter
 * 5. Saves conversation + extracts memories (async, non-blocking)
 * 6. Returns streaming response compatible with useChat
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { HybridAgent } from '@/lib/ai/hybrid-agent';
import {
  saveMessages,
  getMessagesByChatId,
  saveChat,
  getChatById,
} from '@/lib/db/queries';
import { getNutritionProfile } from '@/lib/firebase/profile';
import { auth } from '@/app/(auth)/auth';

/**
 * TOKEN ESTIMATION FOR CONTEXT MANAGEMENT
 *
 * Estimates token usage for the AI conversation to prevent context overflow.
 *
 * MODEL CONTEXT LIMITS:
 * - Claude 4 Sonnet: 200,000 tokens (~800,000 characters)
 * - Claude 3.5 Sonnet: 200,000 tokens
 * - GPT-4o Mini: 128,000 tokens
 * - GPT-5 Mini: 128,000 tokens
 *
 * ESTIMATION FORMULA:
 * - Rule of thumb: 1 token ≈ 0.75 words ≈ 4 characters
 * - Conservative estimate to ensure we stay well under limits
 *
 * COMPONENTS:
 * - Conversation history (now up to 40 messages loaded, 30 used in prompt)
 * - User profile context
 * - Current message
 * - System prompt (~2000 tokens)
 * - Knowledge base results (~1000-3000 tokens)
 * - Tool results (variable)
 */
function estimateTokenCount(
  conversationHistory: any[],
  userProfile: any,
  currentMessage: string,
): number {
  let totalChars = 0;

  // Count conversation history (up to 30 messages now used in prompt)
  const contextMessages = conversationHistory.slice(-30);
  contextMessages.forEach((msg) => {
    totalChars += (msg.content || '').length;
  });

  // Count user profile context
  if (userProfile) {
    totalChars += JSON.stringify(userProfile).length;
  }

  // Count current message
  totalChars += currentMessage.length;

  // Add system prompt and knowledge base (updated estimate for larger context)
  totalChars += 8000; // System prompt + typical knowledge results + tool context

  // Convert chars to tokens (conservative: 1 token ≈ 4 chars)
  return Math.ceil(totalChars / 4);
}

// Handle GET requests from useChat hook (typically reload() calls)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId') || searchParams.get('sessionId');

    // Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      console.log('[Agent API GET] Unauthorized request');

      const stream = new ReadableStream({
        async start(controller) {
          controller.close();
        },
      });

      return new Response(stream, {
        status: 401,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Experimental-Stream-Data': 'true',
        },
      });
    }

    // If no chatId or it's undefined, return empty streaming response
    if (!chatId || chatId === 'undefined') {
      console.log(
        '[Agent API GET] No valid chatId provided, returning empty streaming response',
      );

      const stream = new ReadableStream({
        async start(controller) {
          controller.close(); // Just close the stream immediately for undefined chatId
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Experimental-Stream-Data': 'true',
        },
      });
    }

    console.log(
      `[Agent API GET] Chat ${chatId} - reload() scenario detected, returning empty response`,
    );

    const stream = new ReadableStream({
      async start(controller) {
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Experimental-Stream-Data': 'true',
      },
    });
  } catch (error) {
    console.error('[Agent API GET] Error:', error);

    const stream = new ReadableStream({
      async start(controller) {
        controller.close();
      },
    });

    return new Response(stream, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Experimental-Stream-Data': 'true',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, userId, sessionId } = await req.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 },
      );
    }

    console.log(
      `[Agent API] Processing streaming message for user ${userId}: "${message}"`,
    );

    // Performance optimization: Load conversation history and user profile concurrently with chat setup
    const conversationHistoryPromise = sessionId
      ? getMessagesByChatId({ id: sessionId })
          .then(
            (messages) =>
              messages
                .map((msg: any) => ({
                  role: msg.role,
                  content: msg.content,
                  timestamp: msg.createdAt,
                }))
                .slice(-40), // Load last 40 messages (AI agent uses 30 for context) - allows for better conversation continuity
          )
          .catch(() => {
            console.log(
              '[Agent API] No previous conversation history found (new chat)',
            );
            return [];
          })
      : Promise.resolve([]);

    // Load user profile for personalized responses
    const userProfilePromise = getNutritionProfile(userId).catch((error) => {
      console.log(
        '[Agent API] Error loading user profile, continuing without profile:',
        error,
      );
      return null;
    });

    // Ensure chat record exists before processing
    const chatSetupPromise = sessionId
      ? getChatById({ id: sessionId, currentUserId: userId })
          .then((existingChat) => {
            if (!existingChat) {
              console.log(
                `[Agent API] Chat ${sessionId} not found, creating new chat record`,
              );
              return saveChat({
                id: sessionId,
                userId: userId,
                title:
                  message.slice(0, 50) + (message.length > 50 ? '...' : ''),
              })
                .then(() => {
                  console.log(
                    `[Agent API] Successfully created new chat record: ${sessionId}`,
                  );
                  return null;
                })
                .catch((error) => {
                  console.error(
                    `[Agent API] Failed to create chat record: ${sessionId}`,
                    error,
                  );
                  throw error;
                });
            } else {
              console.log(
                `[Agent API] Using existing chat record: ${sessionId}`,
              );
              return existingChat;
            }
          })
          .catch((error) => {
            console.log(
              `[Agent API] Error checking/creating chat ${sessionId}, attempting to create:`,
              error,
            );
            return saveChat({
              id: sessionId,
              userId: userId,
              title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
            })
              .then(() => {
                console.log(
                  `[Agent API] Successfully created new chat record on fallback: ${sessionId}`,
                );
                return null;
              })
              .catch((createError) => {
                console.error(
                  `[Agent API] Failed to create chat on fallback: ${sessionId}`,
                  createError,
                );
                throw createError;
              });
          })
      : Promise.resolve(null);

    // Wait for all operations to complete
    const [conversationHistory, userProfile] = await Promise.all([
      conversationHistoryPromise,
      userProfilePromise,
      chatSetupPromise,
    ]);

    console.log(
      `[Agent API] Loaded ${conversationHistory.length} previous messages for context`,
    );
    console.log(
      `[Agent API] User profile ${userProfile ? 'loaded successfully' : 'not available'}`,
    );

    // Estimate token usage for context management
    const estimatedTokens = estimateTokenCount(
      conversationHistory,
      userProfile,
      message,
    );
    console.log(`[Agent API] Estimated context tokens: ${estimatedTokens}`);

    // Context limit monitoring - warn when approaching model limits
    // Claude 4: 200k tokens, GPT models: 128k tokens
    // We'll use the more conservative GPT limit as our warning threshold
    if (estimatedTokens > 100000) {
      // ~78% of GPT limit, ~50% of Claude limit
      console.log(
        '[Agent API] ⚠️ High context usage detected:',
        `${estimatedTokens} tokens. Consider suggesting new chat for optimal performance.`,
      );
    }

    if (estimatedTokens > 150000) {
      // ~75% of Claude limit, exceeds GPT limit
      console.log(
        '[Agent API] 🚨 Very high context usage:',
        `${estimatedTokens} tokens. Should strongly suggest new chat.`,
      );
    }

    // CRITICAL: Save user message IMMEDIATELY before streaming starts
    // This prevents message loss if user refreshes during streaming
    if (sessionId) {
      // Enhanced regeneration detection logic to handle edit scenarios properly
      const lastUserMessage = conversationHistory
        .filter((msg) => msg.role === 'user')
        .pop();

      const lastMessage = conversationHistory[conversationHistory.length - 1];

      // Check if this is a regeneration scenario:
      // 1. Same content = standard regeneration (user clicked regenerate)
      // 2. Conversation ends with user message = edit scenario (trailing messages were deleted)
      const isStandardRegeneration =
        lastUserMessage && lastUserMessage.content.trim() === message.trim();

      // For edit scenarios: if the conversation ends with a user message and we have
      // conversation history, this is likely an edit+regenerate scenario where
      // the message editor deleted trailing assistant messages
      const isEditRegeneration =
        lastMessage &&
        lastMessage.role === 'user' &&
        conversationHistory.length > 0 &&
        lastMessage.content.trim() === message.trim();

      const isRegeneration = isStandardRegeneration || isEditRegeneration;

      console.log(`[Agent API] Enhanced regeneration check:`, {
        hasLastMessage: !!lastUserMessage,
        lastMessageContent: lastUserMessage?.content?.slice(0, 100) || 'N/A',
        currentMessage: message.slice(0, 100),
        lastMessageRole: lastMessage?.role || 'none',
        conversationEndsWithUser: lastMessage?.role === 'user',
        isStandardRegeneration,
        isEditRegeneration,
        isRegeneration,
        totalHistoryMessages: conversationHistory.length,
      });

      if (isRegeneration) {
        console.log(
          `[Agent API] 🔄 REGENERATION DETECTED - Skipping user message save`,
        );
        if (isStandardRegeneration) {
          console.log(
            `[Agent API] Standard regeneration: "${lastUserMessage.content.slice(0, 50)}..."`,
          );
        } else {
          console.log(
            `[Agent API] Edit regeneration detected: conversation ends with user message matching current input`,
          );
        }
      } else {
        // This is either a new message or an edit scenario - always save it
        const userMessage = {
          id: crypto.randomUUID(),
          content: message, // Keep for backward compatibility
          parts: [{ type: 'text', text: message }], // Correct UI format
          role: 'user' as const,
        };

        try {
          console.log(`[Agent API] Saving user message to chat ${sessionId}:`, {
            messageId: userMessage.id,
            contentLength: message.length,
            isNewMessage:
              !lastUserMessage ||
              lastUserMessage.content.trim() !== message.trim(),
          });

          await saveMessages({
            chatId: sessionId,
            messages: [userMessage],
          });
          console.log(
            `[Agent API] User message saved successfully (new message or edit scenario)`,
          );
        } catch (error) {
          console.error(
            '[Agent API] Failed to save user message before streaming:',
            error,
          );
          // Try once more with a delay
          try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            await saveMessages({
              chatId: sessionId,
              messages: [userMessage],
            });
            console.log(`[Agent API] User message saved successfully on retry`);
          } catch (retryError) {
            console.error(
              '[Agent API] Failed to save user message on retry:',
              retryError,
            );
            // Continue with streaming even if save fails, but log the issue
          }
        }
      }
    }

    // Get streaming response from hybrid agent
    const hybridAgent = new HybridAgent();
    const agentStream = await hybridAgent.processQueryStream({
      userQuery: message,
      userId,
      sessionId,
      conversationHistory,
      userProfile,
    });

    // Collect the full response for saving (simpler approach)
    let fullResponse = '';
    const responseCollector = {
      addChunk: (chunk: string) => {
        fullResponse += chunk;
      },
      getFullResponse: () => fullResponse.trim(),
    };

    // Convert string stream to AI SDK compatible format
    const encodedStream = new ReadableStream({
      async start(controller) {
        const reader = agentStream.getReader();
        const encoder = new TextEncoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Save AI response when stream is complete
              // User message already saved before streaming started
              if (sessionId && responseCollector.getFullResponse()) {
                const assistantMessage = {
                  id: crypto.randomUUID(),
                  content: responseCollector.getFullResponse(), // Keep for backward compatibility
                  parts: [
                    { type: 'text', text: responseCollector.getFullResponse() },
                  ], // Correct UI format
                  role: 'assistant' as const,
                };

                console.log(
                  `[Agent API] 💾 Saving assistant response ${assistantMessage.id} to chat ${sessionId}`,
                );

                // Save only the AI response with retry logic
                try {
                  await saveMessages({
                    chatId: sessionId,
                    messages: [assistantMessage],
                  });
                  console.log(
                    `[Agent API] ✅ AI response saved to Firebase successfully`,
                  );
                } catch (error: any) {
                  console.error(
                    '[Agent API] ❌ Failed to save AI response:',
                    error,
                  );
                  // Retry once after a short delay
                  try {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    await saveMessages({
                      chatId: sessionId,
                      messages: [assistantMessage],
                    });
                    console.log(
                      `[Agent API] ✅ AI response saved to Firebase on retry`,
                    );
                  } catch (retryError: any) {
                    console.error(
                      '[Agent API] ❌ Failed to save AI response on retry:',
                      retryError,
                    );
                  }
                }
              }
              controller.close();
              break;
            }

            // Collect the raw text for saving
            responseCollector.addChunk(value);

            // Format for AI SDK: "0:" prefix for text content
            // value is already a string, so we JSON.stringify it to escape properly
            const formattedChunk = `0:${JSON.stringify(value)}\n`;
            const encoded = encoder.encode(formattedChunk);
            controller.enqueue(encoded);
          }
        } catch (error) {
          console.error('[Agent API] Stream processing error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    // Return the stream directly
    const finalStream = encodedStream;

    console.log(`[Agent API] Streaming response initiated for user ${userId}`);

    return new Response(finalStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Experimental-Stream-Data': 'true',
      },
    });
  } catch (error: any) {
    console.error('[Agent API] Error processing streaming request:', error);

    // Return error as stream
    const errorStream = new ReadableStream({
      start(controller) {
        const errorMessage =
          "I'm experiencing technical difficulties. Please try again.";
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Experimental-Stream-Data': 'true',
      },
    });
  }
}
