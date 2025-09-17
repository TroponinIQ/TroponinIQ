import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';
import { getChatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get('limit') || '10');
  const startingAfter = searchParams.get('starting_after');
  const endingBefore = searchParams.get('ending_before');

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      'bad_request:api',
      'Only one of starting_after or ending_before can be provided.',
    ).toResponse();
  }

  // Use NextAuth session instead of Firebase ID token
  const session = await auth();
  
  if (!session?.user?.id) {
    console.warn('[API History] No authenticated user session found');
    return new ChatSDKError('unauthorized:chat', 'User not authenticated.').toResponse();
  }

  const userId = session.user.id;
  console.log(`[API History] Fetching chat history for user: ${userId}`);

  try {
    const result = await getChatsByUserId({
      id: userId,
      limit,
      startingAfter,
      endingBefore,
    });

    // Convert Firestore Timestamps to JavaScript Date objects for the UI
    const convertedChats = result.chats.map(chat => ({
      ...chat,
      createdAt: chat.createdAt.toDate(),
      updatedAt: chat.updatedAt.toDate(),
    }));

    console.log(`[API History] Found ${convertedChats.length} chats for user ${userId}`);
    return Response.json({
      chats: convertedChats,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('[API History] Error fetching chats:', error);
    return new ChatSDKError('bad_request:database', 'Failed to fetch chat history.').toResponse();
  }
}
