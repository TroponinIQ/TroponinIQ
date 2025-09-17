import { type NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();
    
    if (!token || !email) {
      return NextResponse.json({ 
        error: 'Token and email are required' 
      }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    if (!isAdminInitialized()) {
      return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    console.log(`[Magic Link Verify] Verifying token for: ${normalizedEmail}`);
    
    // Find user by email
    const usersCollection = adminDb?.collection('Users');
    if (!usersCollection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const snapshot = await usersCollection.where('email', '==', normalizedEmail).get();

    if (snapshot.empty) {
      console.log(`[Magic Link Verify] No user found with email: ${normalizedEmail}`);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid or expired magic link' 
      }, { status: 400 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const now = new Date();

    // Verify token
    if (userData.magicLinkToken !== token) {
      console.log(`[Magic Link Verify] Invalid token for: ${normalizedEmail}`);
      return NextResponse.json({ 
        success: false,
        error: 'Invalid or expired magic link' 
      }, { status: 400 });
    }

    // Check if token has expired
    const expiresAt = userData.magicLinkExpires?.toDate();
    if (!expiresAt || expiresAt < now) {
      console.log(`[Magic Link Verify] Expired token for: ${normalizedEmail}`);
      // Clear expired token
      await userDoc.ref.update({
        magicLinkToken: null,
        magicLinkExpires: null,
        magicLinkUsed: false,
      });
      return NextResponse.json({ 
        success: false,
        error: 'Magic link has expired. Please request a new one.' 
      }, { status: 400 });
    }

    // Check if token has already been used
    if (userData.magicLinkUsed) {
      console.log(`[Magic Link Verify] Token already used for: ${normalizedEmail}`);
      return NextResponse.json({ 
        success: false,
        error: 'Magic link has already been used. Please request a new one.' 
      }, { status: 400 });
    }

    // Mark token as used
    await userDoc.ref.update({
      magicLinkUsed: true,
    });

    // Return user data for authentication
    const user = {
      id: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      displayImage: userData.displayImage,
    };

    console.log(`[Magic Link Verify] Token verified successfully for: ${normalizedEmail}`);
    
    return NextResponse.json({ 
      success: true,
      user,
      message: 'Magic link verified successfully' 
    });

  } catch (error: any) {
    console.error('[Magic Link Verify] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify magic link',
      details: error.message 
    }, { status: 500 });
  }
} 