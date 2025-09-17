import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[createOrGetUser] API endpoint called');

    const { email, name, image } = await request.json();
    console.log('[createOrGetUser] Request data:', { email, name, image });

    if (!email) {
      console.error('[createOrGetUser] Error: Email is required');
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 },
      );
    }

    // Use centralized user service
    const { findOrCreateUser } = await import('@/lib/services/user');
    
    const user = await findOrCreateUser({
      email,
      name,
      image,
    });

    if (!user) {
      console.error('[createOrGetUser] findOrCreateUser failed to find or create user');
      return NextResponse.json(
        { success: false, error: 'Failed to find or create user' },
        { status: 500 },
      );
    }

    console.log(`[createOrGetUser] findOrCreateUser result: ${user.id}`);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('[createOrGetUser] Error:', error);
    console.error('[createOrGetUser] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message,
      },
      { status: 500 },
    );
  }
}
