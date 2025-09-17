import 'server-only';

// Firebase Admin SDK Firestore for server-side operations
import { getAdminDb } from '../firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Types
import { ChatSDKError } from '../errors';

/**
 * ARCHITECTURAL DECISION: PREFER EXTENDING CHAT DOCUMENTS
 *
 * When adding new features like organization, labeling, categorization, etc.,
 * we should prefer extending the existing `chats` document structure rather
 * than creating separate collections (like folders, tags, categories).
 *
 * Benefits of extending chat documents:
 * - Better performance (single query vs joins)
 * - Simpler data model and queries
 * - Better scalability (no complex relationships)
 * - Easier to maintain and debug
 * - More intuitive data structure
 *
 * Examples:
 * ✅ GOOD: Add `label`, `category`, `tags[]` fields to chat document
 * ❌ AVOID: Separate `folders`, `categories`, `tags` collections with relationships
 *
 * Only create separate collections when:
 * - Data is truly independent (like user profiles, system settings)
 * - Relationship is many-to-many and complex
 * - Data size would significantly bloat the main document
 */

// Simple in-memory cache for production performance - DISABLED FOR NOW
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  // CACHE DISABLED - always return null to force fresh queries
  return null;
}

function setCache<T>(key: string, data: T): void {
  // CACHE DISABLED - do nothing
  return;
}

// Interface for Firestore Chat data (using Admin SDK Timestamp)
export interface FirestoreChat {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface for Firestore Message data (using Admin SDK Timestamp)
export interface FirestoreMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';
  content: string; // Keep for backward compatibility
  parts?: Array<{ type: string; text: string }>; // New UI format
  createdAt: Timestamp;
}

// --- Firestore implementation for getChatsByUserId ---
export async function getChatsByUserId({
  id: userId,
  limit = 20,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit?: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}): Promise<{ chats: Array<FirestoreChat>; hasMore: boolean }> {
  console.log('[getChatsByUserId] UserID:', userId);
  if (!userId) return { chats: [], hasMore: false };

  // Cache DISABLED - always fetch fresh data
  console.log(
    `[getChatsByUserId] Fetching fresh data for user ${userId} (cache disabled)`,
  );

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getChatsByUserId!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }
  try {
    let query = adminDb
      .collection('chats')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc');

    // Apply limit - we'll handle the +1 logic differently to avoid cursor issues
    if (limit !== undefined) query = query.limit(limit);

    // Apply pagination if provided
    if (startingAfter) {
      const startDoc = await adminDb
        .collection('chats')
        .doc(startingAfter)
        .get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }
    if (endingBefore) {
      const endDoc = await adminDb.collection('chats').doc(endingBefore).get();
      if (endDoc.exists) {
        query = query.endBefore(endDoc);
      }
    }

    const snapshot = await query.get();
    const chats = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt as Timestamp,
      updatedAt: doc.data().updatedAt as Timestamp,
    })) as FirestoreChat[];

    // SIMPLE: Always assume there are more chats unless we got fewer than requested
    let hasMore = false;
    if (limit !== undefined) {
      hasMore = chats.length === limit; // If we got exactly what we asked for, there might be more
    }

    const result = { chats, hasMore };

    // Cache DISABLED - no longer setting cache
    console.log(
      `[getChatsByUserId] Returning ${chats.length} chats (cache disabled)`,
    );
    console.log(
      `[getChatsByUserId] DEBUG - limit: ${limit}, fetched: ${snapshot.docs.length}, hasMore: ${hasMore}, endingBefore: ${endingBefore || 'none'}`,
    );

    return result;
  } catch (error) {
    console.error('Error fetching chats for user:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user ID',
    );
  }
}

// --- Firestore implementation for saveChat ---
export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  console.log(
    `[saveChat] Starting save operation - ID: ${id}, UserID: ${userId}, Title: "${title}"`,
  );
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error('[queries.ts] FATAL: Admin DB not initialized in saveChat!');
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }
  try {
    const chatRef = adminDb.collection('chats').doc(id);
    const chatData = {
      userId,
      title,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    console.log(
      `[saveChat] Setting chat document for ${id} with data:`,
      chatData,
    );
    await chatRef.set(chatData);
    console.log(
      `[saveChat] Chat document successfully saved to Firestore for ${id}`,
    );

    // Cache invalidation DISABLED - no longer needed since cache is disabled
    console.log(`[queries.ts] Chat ${id} saved successfully (cache disabled).`);
  } catch (error) {
    console.error('Error saving chat:', error);
    console.error(
      `[saveChat] Failed to save chat ${id} for user ${userId}:`,
      error,
    );
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

// --- Firestore implementation for deleteChatById ---
export async function deleteChatById({ id }: { id: string }) {
  console.log(`[deleteChatById] ID: ${id}`);
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in deleteChatById!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }
  try {
    const messagesRef = adminDb
      .collection('chats')
      .doc(id)
      .collection('messages');
    const messagesSnapshot = await messagesRef.get();
    const batch = adminDb.batch();
    messagesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    const chatRef = adminDb.collection('chats').doc(id);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists)
      throw new ChatSDKError('not_found:database', `Chat ${id} not found`);
    await chatRef.delete();

    // Cache invalidation DISABLED - no longer needed since cache is disabled
    console.log(
      `[queries.ts] Chat ${id} deleted successfully (cache disabled).`,
    );
    return {
      success: true,
      message: `Chat ${id} and its messages deleted successfully.`,
    };
  } catch (error) {
    console.error('Error deleting chat:', error);
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError('bad_request:database', 'Failed to delete chat');
  }
}

// --- Firestore implementation for getChatById ---
export async function getChatById({
  id,
  currentUserId,
}: {
  id: string;
  currentUserId?: string;
}): Promise<FirestoreChat | null> {
  console.log(`[getChatById] ID: ${id}, User: ${currentUserId}`);

  // Cache DISABLED - always fetch fresh data
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getChatById!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }
  try {
    const chatRef = adminDb.collection('chats').doc(id);
    const chatSnap = await chatRef.get();
    if (!chatSnap.exists) {
      // Cache DISABLED - no longer caching null result
      console.log(`[getChatById] Chat ${id} not found (cache disabled)`);
      return null;
    }
    const data = chatSnap.data();
    if (!data) {
      console.log(`[getChatById] Chat ${id} has no data (cache disabled)`);
      return null;
    }

    const result = {
      id: chatSnap.id,
      ...data,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
    } as FirestoreChat;

    // Ensure user has permission to view this chat (if currentUserId provided)
    if (currentUserId && result.userId !== currentUserId) {
      // Cache DISABLED - no longer caching null result
      console.log(
        `[getChatById] User ${currentUserId} denied access to chat ${id} (cache disabled)`,
      );
      return null;
    }

    // Cache DISABLED - no longer caching result
    console.log(`[getChatById] Returning chat ${id} (cache disabled)`);
    return result;
  } catch (error) {
    console.error('Error fetching chat by ID:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by ID');
  }
}

// --- Firestore implementation for saveMessages ---
export async function saveMessages({
  chatId,
  messages: messagesToSave,
}: { chatId: string; messages: Array<Omit<FirestoreMessage, 'createdAt'>> }) {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[saveMessages] ChatID: ${chatId}, Count: ${messagesToSave.length}`,
    );
    console.log(
      `[saveMessages] Message details:`,
      messagesToSave.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content:
          msg.content?.slice(0, 100) + (msg.content?.length > 100 ? '...' : ''),
      })),
    );
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in saveMessages!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    console.log(
      `[saveMessages] Starting batch operation for chat ${chatId} with ${messagesToSave.length} messages`,
    );

    const batch = adminDb.batch();
    const messagesCollectionRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages');

    messagesToSave.forEach((msg) => {
      const messageRef = messagesCollectionRef.doc(msg.id);

      // Ensure message has proper format for UI compatibility
      const messageData = {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        parts: msg.parts || [{ type: 'text', text: msg.content }], // Ensure parts field exists
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      batch.set(messageRef, messageData);
      console.log(
        `[saveMessages] Added to batch - Message ${msg.id} for chat ${chatId}`,
      );
    });

    // Also update the chat's updatedAt timestamp so it appears at the top of the list
    const chatRef = adminDb.collection('chats').doc(chatId);
    batch.update(chatRef, {
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`[saveMessages] Added chat update to batch for chat ${chatId}`);

    await batch.commit();
    console.log(
      `[saveMessages] Batch committed successfully for chat ${chatId}`,
    );

    // Cache invalidation DISABLED - no longer needed since cache is disabled
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[queries.ts] ${messagesToSave.length} messages saved for chat ${chatId} (cache disabled).`,
      );
    }

    console.log(
      `[saveMessages] Successfully completed save operation for chat ${chatId}`,
    );
  } catch (error) {
    console.error('Error saving messages:', error);
    console.error(
      `[saveMessages] Failed to save ${messagesToSave.length} messages for chat ${chatId}:`,
      error,
    );
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

// --- Firestore implementation for getMessagesByChatId ---
export async function getMessagesByChatId({
  id: chatId,
}: { id: string }): Promise<FirestoreMessage[]> {
  // Cache DISABLED - always fetch fresh data
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[getMessagesByChatId] Fetching fresh messages for ChatID: ${chatId} (cache disabled)`,
    );
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getMessagesByChatId!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const messagesRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages');
    const q = messagesRef
      .orderBy('createdAt', 'asc')
      .orderBy('__name__', 'asc'); // Secondary sort by document ID for consistency
    const querySnapshot = await q.get();

    const result = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as FirestoreMessage,
    );

    // Cache DISABLED - no longer caching result
    console.log(
      `[getMessagesByChatId] Returning ${result.length} messages for chat ${chatId} (cache disabled)`,
    );
    return result;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat ID',
    );
  }
}

// --- Firestore implementation for updateMessageById ---
export async function updateMessageById({
  chatId,
  messageId,
  content,
}: {
  chatId: string;
  messageId: string;
  content: string;
}) {
  console.log(`[updateMessageById] ChatID: ${chatId}, MsgID: ${messageId}`);
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in updateMessageById!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }
  try {
    const messageRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId);
    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) {
      console.log(
        `[updateMessageById] Message ${messageId} not found in database, but exists in UI. This suggests a race condition.`,
      );
      console.log(
        `[updateMessageById] Creating missing message ${messageId} in chat ${chatId} with content: "${content}"`,
      );

      // Create the message instead of throwing an error
      // This handles the race condition where UI has the message but DB doesn't
      await messageRef.set({
        id: messageId,
        role: 'user', // Most edit scenarios are user messages
        content: content,
        parts: [{ type: 'text', text: content }],
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(
        `[updateMessageById] Successfully created missing message ${messageId}`,
      );
      return;
    }

    // Message exists, update it normally
    await messageRef.update({
      content: content,
      parts: [{ type: 'text', text: content }], // Update parts field for UI consistency
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Cache invalidation DISABLED - no longer needed since cache is disabled
    console.log(
      `[queries.ts] Message ${messageId} updated successfully (cache disabled).`,
    );
  } catch (error) {
    console.error('Error updating message:', error);
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError('bad_request:database', 'Failed to update message');
  }
}

// --- Firestore implementation for deleteMessageById ---
export async function deleteMessageById({
  chatId,
  messageId,
  allowMissing = false,
}: { chatId: string; messageId: string; allowMissing?: boolean }) {
  console.log(
    `[deleteMessageById] ChatID: ${chatId}, MsgID: ${messageId}, allowMissing: ${allowMissing}`,
  );
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in deleteMessageById!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }
  try {
    const messageRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(messageId);
    const messageSnap = await messageRef.get();

    if (!messageSnap.exists) {
      if (allowMissing) {
        console.log(
          `[deleteMessageById] Message ${messageId} not found, but allowMissing=true, continuing...`,
        );
        return;
      }
      throw new ChatSDKError(
        'not_found:database',
        `Message ${messageId} not found`,
      );
    }

    await messageRef.delete();
    console.log(
      `[queries.ts] Message ${messageId} deleted from chat ${chatId}.`,
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError('bad_request:database', 'Failed to delete message');
  }
}

// --- Atomic batch delete for multiple messages ---
export async function deleteMessagesBatch({
  chatId,
  messageIds,
  allowMissing = false,
}: { chatId: string; messageIds: string[]; allowMissing?: boolean }) {
  console.log(
    `[deleteMessagesBatch] ChatID: ${chatId}, MsgIDs: [${messageIds.join(', ')}], allowMissing: ${allowMissing}`,
  );
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in deleteMessagesBatch!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  if (messageIds.length === 0) {
    console.log(`[deleteMessagesBatch] No messages to delete`);
    return [];
  }

  try {
    const messagesCollectionRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages');

    // First, check which messages exist to avoid partial failures
    const existingMessages: string[] = [];
    const missingMessages: string[] = [];

    for (const messageId of messageIds) {
      const messageRef = messagesCollectionRef.doc(messageId);
      const messageSnap = await messageRef.get();

      if (messageSnap.exists) {
        existingMessages.push(messageId);
      } else {
        missingMessages.push(messageId);
        if (!allowMissing) {
          throw new ChatSDKError(
            'not_found:database',
            `Message ${messageId} not found in chat ${chatId}`,
          );
        }
      }
    }

    if (missingMessages.length > 0) {
      console.log(
        `[deleteMessagesBatch] Missing messages (${allowMissing ? 'ignored' : 'error'}): [${missingMessages.join(', ')}]`,
      );
    }

    if (existingMessages.length === 0) {
      console.log(`[deleteMessagesBatch] No existing messages to delete`);
      return missingMessages;
    }

    // Use batch operation for atomic deletion
    const batch = adminDb.batch();
    existingMessages.forEach((messageId) => {
      const messageRef = messagesCollectionRef.doc(messageId);
      batch.delete(messageRef);
    });

    await batch.commit();
    console.log(
      `[deleteMessagesBatch] Successfully deleted ${existingMessages.length} messages from chat ${chatId}`,
    );

    return missingMessages;
  } catch (error) {
    console.error('Error in batch delete messages:', error);
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to batch delete messages',
    );
  }
}

// --- Firestore implementation for getMessageById ---
export async function getMessageById({
  id,
}: { id: string }): Promise<FirestoreMessage | null> {
  console.log(`[getMessageById] ID: ${id}`);
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getMessageById!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    // Since we don't know which chat the message belongs to, we need to search across all chats
    // This is not ideal for performance, but it's what the original function was doing
    const chatsQuery = adminDb
      .collection('chats')
      .orderBy('updatedAt', 'desc')
      .limit(10);
    const chatsSnapshot = await chatsQuery.get();

    for (const chatDoc of chatsSnapshot.docs) {
      const messagesRef = adminDb
        .collection('chats')
        .doc(chatDoc.id)
        .collection('messages');
      const messageDoc = await messagesRef.doc(id).get();

      if (messageDoc.exists) {
        return { id: messageDoc.id, ...messageDoc.data() } as FirestoreMessage;
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching message by ID:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by ID',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  console.log(
    `[deleteMessagesByChatIdAfterTimestamp] ChatID: ${chatId}, After: ${timestamp}`,
  );
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in deleteMessagesByChatIdAfterTimestamp!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const messagesRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages');

    // Get all messages to find the exact one we're editing from and delete everything after it
    const allMessagesSnapshot = await messagesRef.orderBy('createdAt').get();

    if (allMessagesSnapshot.empty) {
      console.log(
        `[deleteMessagesByChatIdAfterTimestamp] No messages found in chat ${chatId}`,
      );
      return;
    }

    // Convert to array and find messages to delete
    const allMessages = allMessagesSnapshot.docs;
    console.log(
      `[deleteMessagesByChatIdAfterTimestamp] Found ${allMessages.length} total messages`,
    );

    // Find the index of the edited message by comparing timestamps with some tolerance
    let editedMessageIndex = -1;
    const timestampMs = timestamp.getTime();

    for (let i = 0; i < allMessages.length; i++) {
      const messageData = allMessages[i].data();
      const messageTimestamp =
        messageData.createdAt?.toDate?.() || new Date(messageData.createdAt);
      const messageTimestampMs = messageTimestamp.getTime();

      // Use a small tolerance (1 second) to account for precision differences
      if (Math.abs(messageTimestampMs - timestampMs) < 1000) {
        editedMessageIndex = i;
        console.log(
          `[deleteMessagesByChatIdAfterTimestamp] Found edited message at index ${i}, ID: ${messageData.id}`,
        );
        break;
      }
    }

    if (editedMessageIndex === -1) {
      console.warn(
        `[deleteMessagesByChatIdAfterTimestamp] Could not find edited message with timestamp ${timestamp}, using fallback deletion`,
      );
      // Fallback: use the original timestamp-based query with some tolerance
      const fallbackTimestamp = new Date(timestampMs - 500); // Subtract 500ms for tolerance
      const messagesQuery = messagesRef
        .where('createdAt', '>', fallbackTimestamp)
        .orderBy('createdAt')
        .limit(500);

      const messagesToDeleteSnapshot = await messagesQuery.get();

      if (messagesToDeleteSnapshot.empty) {
        console.log(
          `[deleteMessagesByChatIdAfterTimestamp] No messages found to delete after fallback timestamp`,
        );
        return;
      }

      const batch = adminDb.batch();
      messagesToDeleteSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(
        `[deleteMessagesByChatIdAfterTimestamp] Deleted ${messagesToDeleteSnapshot.docs.length} messages using fallback method`,
      );
      return;
    }

    // Delete all messages after the edited message
    const messagesToDelete = allMessages.slice(editedMessageIndex + 1);

    if (messagesToDelete.length === 0) {
      console.log(
        `[deleteMessagesByChatIdAfterTimestamp] No messages to delete after edited message`,
      );
      return;
    }

    console.log(
      `[deleteMessagesByChatIdAfterTimestamp] Will delete ${messagesToDelete.length} messages after edited message`,
    );

    // Single optimized batch operation
    const batch = adminDb.batch();
    messagesToDelete.forEach((doc) => {
      const messageData = doc.data();
      console.log(
        `[deleteMessagesByChatIdAfterTimestamp] Deleting message ${messageData.id} (${messageData.role})`,
      );
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(
      `[deleteMessagesByChatIdAfterTimestamp] Successfully deleted ${messagesToDelete.length} messages from chat ${chatId} after edited message`,
    );
  } catch (error) {
    console.error('Error deleting messages by timestamp:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

// More reliable alternative: Delete messages after a specific message ID
export async function deleteMessagesAfterMessageId({
  chatId,
  messageId,
}: {
  chatId: string;
  messageId: string;
}) {
  console.log(
    `[deleteMessagesAfterMessageId] ChatID: ${chatId}, After Message ID: ${messageId}`,
  );
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in deleteMessagesAfterMessageId!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const messagesRef = adminDb
      .collection('chats')
      .doc(chatId)
      .collection('messages');

    // Get all messages ordered by creation time
    const allMessagesSnapshot = await messagesRef.orderBy('createdAt').get();

    if (allMessagesSnapshot.empty) {
      console.log(
        `[deleteMessagesAfterMessageId] No messages found in chat ${chatId}`,
      );
      return 0;
    }

    // Find the edited message and get all messages after it
    const allMessages = allMessagesSnapshot.docs;
    const editedMessageIndex = allMessages.findIndex(
      (doc) => doc.data().id === messageId,
    );

    if (editedMessageIndex === -1) {
      console.warn(
        `[deleteMessagesAfterMessageId] Could not find message with ID ${messageId} in chat ${chatId}`,
      );
      return 0;
    }

    console.log(
      `[deleteMessagesAfterMessageId] Found edited message at index ${editedMessageIndex}`,
    );

    // Get all messages after the edited message
    const messagesToDelete = allMessages.slice(editedMessageIndex + 1);

    if (messagesToDelete.length === 0) {
      console.log(
        `[deleteMessagesAfterMessageId] No messages to delete after message ${messageId}`,
      );
      return 0;
    }

    console.log(
      `[deleteMessagesAfterMessageId] Will delete ${messagesToDelete.length} messages after edited message`,
    );

    // Delete messages in batch
    const batch = adminDb.batch();
    messagesToDelete.forEach((doc) => {
      const messageData = doc.data();
      console.log(
        `[deleteMessagesAfterMessageId] Deleting message ${messageData.id} (${messageData.role}): "${messageData.content?.slice(0, 50)}..."`,
      );
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(
      `[deleteMessagesAfterMessageId] Successfully deleted ${messagesToDelete.length} messages from chat ${chatId} after message ${messageId}`,
    );

    return messagesToDelete.length;
  } catch (error) {
    console.error('Error deleting messages after message ID:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages after message ID',
    );
  }
}

// --- Firestore implementation for updateChatTitle ---
export async function updateChatTitle({
  chatId,
  title,
  currentUserId,
}: {
  chatId: string;
  title: string;
  currentUserId: string;
}) {
  console.log(
    `[updateChatTitle] ChatID: ${chatId}, New Title: "${title}", User: ${currentUserId}`,
  );
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in updateChatTitle!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    // First verify the chat exists and user owns it
    const chatRef = adminDb.collection('chats').doc(chatId);
    const chatSnap = await chatRef.get();

    if (!chatSnap.exists) {
      throw new ChatSDKError('not_found:database', `Chat ${chatId} not found`);
    }

    const chatData = chatSnap.data();
    if (!chatData || chatData.userId !== currentUserId) {
      throw new ChatSDKError(
        'not_found:database',
        `Chat ${chatId} not found or access denied`,
      );
    }

    // Update the chat title
    await chatRef.update({
      title: title.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `[updateChatTitle] Successfully updated chat ${chatId} title to "${title}"`,
    );

    return {
      success: true,
      message: `Chat title updated successfully.`,
    };
  } catch (error) {
    console.error('Error updating chat title:', error);
    if (error instanceof ChatSDKError) throw error;
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat title',
    );
  }
}

// --- Feedback-related functions ---

export async function saveFeedback({
  id,
  userId,
  type,
  title,
  description,
  userAgent,
  url,
  priority = 'medium',
  userEmail,
}: {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  userAgent?: string;
  url?: string;
  priority?: 'low' | 'medium' | 'high';
  userEmail?: string;
}) {
  console.log(`[saveFeedback] ID: ${id}, Type: ${type}`);
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in saveFeedback!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const feedbackRef = adminDb.collection('feedback').doc(id);
    await feedbackRef.set({
      userId,
      type,
      title,
      description,
      userAgent,
      url,
      priority,
      status: 'open',
      userEmail,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`[queries.ts] Feedback ${id} saved successfully.`);
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw new ChatSDKError('bad_request:database', 'Failed to save feedback');
  }
}

export async function getFeedbackByUserId({
  userId,
  limit = 10,
}: {
  userId: string;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    type: 'bug' | 'feature' | 'improvement' | 'other';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    userEmail?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }>
> {
  console.log(`[getFeedbackByUserId] UserID: ${userId}`);
  if (!userId) return [];

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getFeedbackByUserId!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const query = adminDb
      .collection('feedback')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

    const snapshot = await query.get();
    const feedback = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt as Timestamp,
      updatedAt: doc.data().updatedAt as Timestamp,
    })) as Array<{
      id: string;
      type: 'bug' | 'feature' | 'improvement' | 'other';
      title: string;
      description: string;
      priority: 'low' | 'medium' | 'high';
      status: 'open' | 'in-progress' | 'resolved' | 'closed';
      userEmail?: string;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }>;

    return feedback;
  } catch (error) {
    console.error('Error fetching feedback for user:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get feedback by user ID',
    );
  }
}

// --- System Message Functions ---

export async function getActiveSystemMessages({
  targetUser = 'all',
}: {
  targetUser?: 'all' | 'pro' | 'free';
} = {}): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
    priority: 'low' | 'medium' | 'high' | 'critical';
    startDate?: Timestamp;
    endDate?: Timestamp;
    targetUsers?: 'all' | 'pro' | 'free';
    createdAt: Timestamp;
    updatedAt: Timestamp;
  }>
> {
  console.log(`[getActiveSystemMessages] Fetching for target: ${targetUser}`);

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getActiveSystemMessages!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const now = FieldValue.serverTimestamp();

    let query = adminDb
      .collection('systemMessages')
      .where('isActive', '==', true);

    // Filter by target users if specified
    if (targetUser !== 'all') {
      query = query.where('targetUsers', 'in', [targetUser, 'all']);
    }

    const snapshot = await query.get();
    const messages = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          type: data.type,
          priority: data.priority,
          startDate: data.startDate as Timestamp | undefined,
          endDate: data.endDate as Timestamp | undefined,
          targetUsers: data.targetUsers,
          createdAt: data.createdAt as Timestamp,
          updatedAt: data.updatedAt as Timestamp,
        };
      })
      .filter((message) => {
        // Filter by date range
        const now = new Date();
        if (message.startDate && message.startDate.toDate() > now) {
          return false;
        }
        if (message.endDate && message.endDate.toDate() < now) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by priority (critical > high > medium > low) then by creation date
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const aPriority =
          priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
        const bPriority =
          priorityOrder[b.priority as keyof typeof priorityOrder] || 0;

        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Higher priority first
        }

        return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime(); // Newer first
      }) as Array<{
      id: string;
      title: string;
      content: string;
      type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
      priority: 'low' | 'medium' | 'high' | 'critical';
      startDate?: Timestamp;
      endDate?: Timestamp;
      targetUsers?: 'all' | 'pro' | 'free';
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }>;

    console.log(
      `[getActiveSystemMessages] Found ${messages.length} active messages`,
    );
    return messages;
  } catch (error) {
    console.error('Error fetching active system messages:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get active system messages',
    );
  }
}

export async function getUserDismissedMessages(userId: string): Promise<
  Array<{
    messageId: string;
    dismissedAt: Timestamp;
  }>
> {
  console.log(`[getUserDismissedMessages] UserID: ${userId}`);

  if (!userId) return [];

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getUserDismissedMessages!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const query = adminDb
      .collection('systemMessageDismissals')
      .where('userId', '==', userId);

    const snapshot = await query.get();
    const dismissals = snapshot.docs.map((doc) => ({
      messageId: doc.data().messageId,
      dismissedAt: doc.data().dismissedAt as Timestamp,
    }));

    console.log(
      `[getUserDismissedMessages] Found ${dismissals.length} dismissed messages for user`,
    );
    return dismissals;
  } catch (error) {
    console.error('Error fetching dismissed messages for user:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get dismissed messages',
    );
  }
}

export async function dismissSystemMessage({
  userId,
  messageId,
}: {
  userId: string;
  messageId: string;
}): Promise<void> {
  console.log(
    `[dismissSystemMessage] UserID: ${userId}, MessageID: ${messageId}`,
  );

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in dismissSystemMessage!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const dismissalId = `${userId}_${messageId}`;
    const dismissalRef = adminDb
      .collection('systemMessageDismissals')
      .doc(dismissalId);

    // Check if already dismissed
    const existing = await dismissalRef.get();
    if (existing.exists) {
      console.log(`[dismissSystemMessage] Message already dismissed by user`);
      return;
    }

    await dismissalRef.set({
      userId,
      messageId,
      dismissedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `[dismissSystemMessage] Successfully dismissed message for user`,
    );
  } catch (error) {
    console.error('Error dismissing system message:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to dismiss system message',
    );
  }
}

export async function createSystemMessage({
  id,
  title,
  content,
  type,
  priority = 'medium',
  targetUsers = 'all',
  startDate,
  endDate,
  createdBy,
}: {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  targetUsers?: 'all' | 'pro' | 'free';
  startDate?: Date;
  endDate?: Date;
  createdBy: string;
}): Promise<void> {
  console.log(`[createSystemMessage] Creating message: ${title}`);

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in createSystemMessage!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const messageRef = adminDb.collection('systemMessages').doc(id);
    await messageRef.set({
      title,
      content,
      type,
      priority,
      isActive: true,
      targetUsers,
      startDate: startDate ? Timestamp.fromDate(startDate) : null,
      endDate: endDate ? Timestamp.fromDate(endDate) : null,
      createdBy,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `[createSystemMessage] Successfully created system message: ${id}`,
    );
  } catch (error) {
    console.error('Error creating system message:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create system message',
    );
  }
}

export async function updateSystemMessage({
  id,
  title,
  content,
  type,
  priority = 'medium',
  targetUsers = 'all',
  startDate,
  endDate,
  isActive = true,
}: {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  targetUsers?: 'all' | 'pro' | 'free';
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}): Promise<void> {
  console.log(`[updateSystemMessage] Updating message: ${title}`);

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in updateSystemMessage!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const messageRef = adminDb.collection('systemMessages').doc(id);
    await messageRef.update({
      title,
      content,
      type,
      priority,
      isActive,
      targetUsers,
      startDate: startDate ? Timestamp.fromDate(startDate) : null,
      endDate: endDate ? Timestamp.fromDate(endDate) : null,
      updatedAt: FieldValue.serverTimestamp(), // This is key - updates the timestamp
    });

    console.log(
      `[updateSystemMessage] Successfully updated system message: ${id}`,
    );
  } catch (error) {
    console.error('Error updating system message:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update system message',
    );
  }
}

export async function getAllSystemMessages(): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
    priority: 'low' | 'medium' | 'high' | 'critical';
    isActive: boolean;
    startDate?: Timestamp;
    endDate?: Timestamp;
    targetUsers?: 'all' | 'pro' | 'free';
    createdAt: Timestamp;
  }>
> {
  console.log(`[getAllSystemMessages] Fetching all system messages`);

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getAllSystemMessages!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    const query = adminDb
      .collection('systemMessages')
      .orderBy('createdAt', 'desc');

    const snapshot = await query.get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt as Timestamp,
      startDate: doc.data().startDate as Timestamp | undefined,
      endDate: doc.data().endDate as Timestamp | undefined,
    })) as Array<{
      id: string;
      title: string;
      content: string;
      type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
      priority: 'low' | 'medium' | 'high' | 'critical';
      isActive: boolean;
      startDate?: Timestamp;
      endDate?: Timestamp;
      targetUsers?: 'all' | 'pro' | 'free';
      createdAt: Timestamp;
    }>;

    console.log(
      `[getAllSystemMessages] Found ${messages.length} system messages`,
    );
    return messages;
  } catch (error) {
    console.error('Error fetching all system messages:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get all system messages',
    );
  }
}

export async function getUserSystemMessageHistory({
  targetUser = 'all',
}: {
  targetUser?: 'all' | 'pro' | 'free';
} = {}): Promise<
  Array<{
    id: string;
    title: string;
    content: string;
    type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
    priority: 'low' | 'medium' | 'high' | 'critical';
    isActive: boolean;
    startDate?: Timestamp;
    endDate?: Timestamp;
    targetUsers?: 'all' | 'pro' | 'free';
    createdAt: Timestamp;
  }>
> {
  console.log(
    `[getUserSystemMessageHistory] Fetching message history for target: ${targetUser}`,
  );

  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error(
      '[queries.ts] FATAL: Admin DB not initialized in getUserSystemMessageHistory!',
    );
    throw new ChatSDKError('bad_request:database', 'Admin DB not initialized');
  }

  try {
    let query = adminDb
      .collection('systemMessages')
      .orderBy('createdAt', 'desc');

    // Filter by target users if specified
    if (targetUser !== 'all') {
      query = query.where('targetUsers', 'in', [targetUser, 'all']);
    }

    const snapshot = await query.get();
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt as Timestamp,
      startDate: doc.data().startDate as Timestamp | undefined,
      endDate: doc.data().endDate as Timestamp | undefined,
    })) as Array<{
      id: string;
      title: string;
      content: string;
      type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
      priority: 'low' | 'medium' | 'high' | 'critical';
      isActive: boolean;
      startDate?: Timestamp;
      endDate?: Timestamp;
      targetUsers?: 'all' | 'pro' | 'free';
      createdAt: Timestamp;
    }>;

    console.log(
      `[getUserSystemMessageHistory] Found ${messages.length} messages for user type ${targetUser}`,
    );
    return messages;
  } catch (error) {
    console.error('Error fetching user system message history:', error);
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user system message history',
    );
  }
}
