import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getChatById, deleteChatById } from '@/lib/db/queries';

// DELETE endpoint for chat deletion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns the chat before deleting
    const chat = await getChatById({ id, currentUserId: session.user.id });
    
    if (!chat) {
      return NextResponse.json(
        { error: `Chat not found with id: ${id}` },
        { status: 404 }
      );
    }

    // Delete the chat
    const result = await deleteChatById({ id });
    
    console.log(`[API Chat] Deleted chat ${id} for user ${session.user.id}`);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('[API Chat] Error deleting chat:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 