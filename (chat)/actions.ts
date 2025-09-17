'use server';

import type { UIMessage } from 'ai';
import {
  deleteMessagesByChatIdAfterTimestamp,
  deleteMessagesAfterMessageId,
  updateChatTitle,
} from '@/lib/db/queries';
import { generateTitle } from '@/lib/ai/openrouter';
import { auth } from '@/app/(auth)/auth';

/**
 * Generate a chat title using the centralized OpenRouter service
 */
export async function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  try {
    const messageContent = JSON.stringify(message);
    const title = await generateTitle(messageContent);
    return title;
  } catch (error) {
    console.error(
      '[generateTitleFromUserMessage] Error generating title:',
      error,
    );
    // Fallback to a simple title extraction
    const messageContent =
      typeof message.content === 'string'
        ? message.content
        : JSON.stringify(message.content);
    return (
      messageContent.slice(0, 80).trim() +
      (messageContent.length > 80 ? '...' : '')
    );
  }
}

export async function deleteTrailingMessages({
  chatId,
  afterTimestamp,
}: {
  chatId: string;
  afterTimestamp: Date;
}) {
  console.log(
    `[deleteTrailingMessages] Deleting messages after ${afterTimestamp} in chat ${chatId}`,
  );

  await deleteMessagesByChatIdAfterTimestamp({
    chatId,
    timestamp: afterTimestamp,
  });
}

// More reliable alternative using message ID instead of timestamp
export async function deleteMessagesAfterMessage({
  chatId,
  messageId,
}: {
  chatId: string;
  messageId: string;
}) {
  console.log(
    `[deleteMessagesAfterMessage] Deleting messages after message ${messageId} in chat ${chatId}`,
  );

  const deletedCount = await deleteMessagesAfterMessageId({
    chatId,
    messageId,
  });

  console.log(
    `[deleteMessagesAfterMessage] Deleted ${deletedCount} messages after message ${messageId}`,
  );
  return deletedCount;
}

export async function renameChatAction({
  chatId,
  title,
}: {
  chatId: string;
  title: string;
}) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error('Unauthorized: User not logged in');
    }

    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }

    if (title.trim().length > 100) {
      throw new Error('Title cannot be longer than 100 characters');
    }

    console.log(
      `[renameChatAction] Renaming chat ${chatId} to "${title}" for user ${session.user.id}`,
    );

    const result = await updateChatTitle({
      chatId,
      title: title.trim(),
      currentUserId: session.user.id,
    });

    console.log(`[renameChatAction] Successfully renamed chat ${chatId}`);

    return result;
  } catch (error) {
    console.error('[renameChatAction] Error renaming chat:', error);
    throw error;
  }
}
