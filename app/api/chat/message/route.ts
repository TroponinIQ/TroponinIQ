import { auth } from '@/app/(auth)/auth';
import { getChatById, updateMessageById, deleteMessagesBatch, getMessagesByChatId, deleteChatById } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { NextResponse } from 'next/server';

// PATCH - Edit a message
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:chat', 'User not authenticated').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const chatId = searchParams.get('chatId');

    if (!messageId || !chatId) {
      return new ChatSDKError('bad_request:api', 'messageId and chatId are required').toResponse();
    }

    const { content } = await request.json();
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new ChatSDKError('bad_request:api', 'content is required and must be a non-empty string').toResponse();
    }

    const trimmedContent = content.trim();

    // Verify user owns the chat
    const chat = await getChatById({ id: chatId, currentUserId: session.user.id });
    if (!chat) {
      return new ChatSDKError('not_found:chat', 'Chat not found').toResponse();
    }

    if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat', 'You can only edit messages in your own chats').toResponse();
    }

    // Use the improved updateMessageById function with race condition handling
    await updateMessageById({ chatId, messageId, content: trimmedContent });

    console.log(`[API /message PATCH] Message ${messageId} updated in chat ${chatId}`);

    return NextResponse.json({ 
      success: true, 
      messageId, 
      content: trimmedContent,
      updatedAt: new Date().toISOString() 
    });
  } catch (error: any) {
    console.error('❌ Error in PATCH /api/message:', error);
    
    // Provide more specific error information
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    
    return new ChatSDKError('bad_request:database', `Failed to update message: ${error.message || 'Unknown error'}`).toResponse();
  }
}

// DELETE - Delete a message
export async function DELETE(request: Request) {
  console.log('[API DELETE /message] ===== DELETE REQUEST RECEIVED =====');
  console.log('[API DELETE /message] Request URL:', request.url);
  try {
    console.log('[API DELETE /message] Getting session...');
    const session = await auth();
    console.log('[API DELETE /message] Session:', session?.user?.id ? 'VALID' : 'INVALID');
    if (!session?.user?.id) {
      console.log('[API DELETE /message] No valid session, returning 401');
      return new ChatSDKError('unauthorized:chat', 'User not authenticated').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('messageId');
    const chatId = searchParams.get('chatId');

    console.log('[API DELETE /message] Parameters:', { messageId, chatId, userId: session.user.id });

    if (!messageId || !chatId) {
      return new ChatSDKError('bad_request:api', 'messageId and chatId are required').toResponse();
    }

    // Verify user owns the chat
    const chat = await getChatById({ id: chatId, currentUserId: session.user.id });
    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    if (chat.userId !== session.user.id) {
      return new ChatSDKError('forbidden:chat', 'You can only delete messages in your own chats').toResponse();
    }

    // Get fresh messages to handle race conditions
    console.log('[API DELETE /message] Getting fresh messages to check message type...');
    const messages = await getMessagesByChatId({ id: chatId });
    
    // Handle race condition: if message doesn't exist in database but exists in UI
    const targetMessage = messages.find((m: any) => m.id === messageId);
    if (!targetMessage) {
      console.log('[API DELETE /message] Message not found in database - possible race condition');
      console.log('[API DELETE /message] This might be a timing issue where UI has stale message ID');
      
      // Return success to prevent UI errors, but indicate no deletion occurred
      return NextResponse.json({ 
        success: true, 
        deletedMessages: [],
        deletedCount: 0,
        chatDeleted: false,
        reason: 'Message not found - possible race condition'
      });
    }

    console.log(`[API DELETE /message] Found message with role: ${targetMessage.role}`);

    // Build list of messages to delete atomically
    const messagesToDelete = [messageId];
    if (targetMessage.role === 'user') {
      const messageIndex = messages.findIndex((m: any) => m.id === messageId);
      if (messageIndex !== -1 && messageIndex < messages.length - 1) {
        const nextMessage = messages[messageIndex + 1];
        if (nextMessage && nextMessage.role === 'assistant') {
          messagesToDelete.push(nextMessage.id);
          console.log(`[API DELETE /message] Will also delete AI response: ${nextMessage.id}`);
        }
      }
    }

    console.log(`[API DELETE /message] Attempting atomic deletion of ${messagesToDelete.length} messages`);

    // Use atomic batch deletion with allowMissing=true to handle race conditions
    const missingMessages = await deleteMessagesBatch({ 
      chatId, 
      messageIds: messagesToDelete,
      allowMissing: true // Allow some messages to be missing due to race conditions
    });

    const actuallyDeleted = messagesToDelete.filter(id => !missingMessages.includes(id));
    console.log(`[API /message DELETE] Successfully deleted ${actuallyDeleted.length} messages from chat ${chatId}`);
    
    if (missingMessages.length > 0) {
      console.log(`[API /message DELETE] ${missingMessages.length} messages were already missing (race condition)`);
    }

    // Check if this was the last message(s) in the chat
    const remainingMessages = messages.filter((msg: any) => !messagesToDelete.includes(msg.id));
    const shouldDeleteChat = remainingMessages.length === 0;
    
    if (shouldDeleteChat) {
      console.log(`[API /message DELETE] Deleting empty chat: ${chatId}`);
      await deleteChatById({ id: chatId });
    }

    return NextResponse.json({ 
      success: true, 
      deletedMessages: actuallyDeleted,
      deletedCount: actuallyDeleted.length,
      chatDeleted: shouldDeleteChat,
      missingMessages: missingMessages.length > 0 ? missingMessages : undefined
    });
  } catch (error: any) {
    console.error('❌ Error in DELETE /api/message:', error);
    
    // Provide more specific error information
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    
    return new ChatSDKError('bad_request:database', `Failed to delete message: ${error.message || 'Unknown error'}`).toResponse();
  }
} 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 