import { auth } from '@/app/(auth)/auth';
import {
  getChatById,
  getMessagesByChatId,
  saveMessages,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { generateUUID } from '@/lib/utils';

// GET - Get messages from a chat
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError(
        'unauthorized:chat',
        'User not authenticated',
      ).toResponse();
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return new ChatSDKError(
        'bad_request:api',
        'chatId is required',
      ).toResponse();
    }

    // Verify user owns the chat
    const chat = await getChatById({
      id: chatId,
      currentUserId: session.user.id,
    });
    if (!chat) {
      return new ChatSDKError('not_found:chat').toResponse();
    }

    if (chat.userId !== session.user.id) {
      return new ChatSDKError(
        'forbidden:chat',
        'You can only access your own chats',
      ).toResponse();
    }

    // Get messages from the chat
    const messages = await getMessagesByChatId({ id: chatId });

    console.log(
      `[API /messages GET] Retrieved ${messages.length} messages for chat ${chatId}`,
    );

    return NextResponse.json({
      success: true,
      chatId,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('❌ Error in GET /api/messages:', error);
    return new ChatSDKError(
      'bad_request:database',
      'Failed to retrieve messages',
    ).toResponse();
  }
}

// POST - Add a message to a chat (for N8N follow-ups)
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { chatId, userId, content, role = 'assistant', sessionId } = json;

    // Validate required fields
    if (!chatId || !userId || !content) {
      return NextResponse.json(
        { error: 'chatId, userId, and content are required' },
        { status: 400 },
      );
    }

    // Verify the chat exists and belongs to the user
    const chat = await getChatById({ id: chatId, currentUserId: userId });
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found or access denied' },
        { status: 404 },
      );
    }

    if (chat.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only add messages to your own chats' },
        { status: 403 },
      );
    }

    // Create and save the message
    const message = {
      id: generateUUID(),
      role: role as 'user' | 'assistant',
      content: content,
    };

    await saveMessages({
      chatId,
      messages: [message],
    });

    console.log(
      `[API /messages POST] Added ${role} message to chat ${chatId} from ${sessionId || 'N8N'}`,
    );

    return NextResponse.json({
      success: true,
      messageId: message.id,
      chatId,
      message: {
        id: message.id,
        role: message.role,
        content: message.content,
      },
    });
  } catch (error: any) {
    console.error('❌ Error in POST /api/messages:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 },
    );
  }
}
