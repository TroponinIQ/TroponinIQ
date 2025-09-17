import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    console.log(`[Register] Attempting to register user: ${email}`);

    // Create user directly using the unified service
    const { createEmailUser } = await import('@/lib/services/user');
    const user = await createEmailUser({ email, password, displayName });

    if (!user) {
      console.error(`[Register] Failed to create user: ${email}`);
      return NextResponse.json({ 
        error: 'Failed to create user' 
      }, { status: 500 });
    }

    console.log(`[Register] User created successfully: ${user.id}`);

    return NextResponse.json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      }
    });

  } catch (error: any) {
    console.error('[Register] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 