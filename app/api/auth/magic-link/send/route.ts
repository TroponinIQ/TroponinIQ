import { type NextRequest, NextResponse } from 'next/server';
import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import crypto from 'node:crypto';

// Rate limiting constants
const MAGIC_LINK_EXPIRY_MINUTES = 15;
const MAX_LINKS_PER_HOUR = 3;
const MIN_INTERVAL_MINUTES = 1; // Minimum time between requests

// Simple in-memory IP rate limiting (for non-existent users)
const ipRateLimit = new Map<string, { count: number; resetTime: number }>();
const MAX_IP_REQUESTS_PER_HOUR = 10;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ 
        error: 'Invalid email format' 
      }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check IP-based rate limiting
    const currentTime = Date.now();
    const ipData = ipRateLimit.get(clientIP);
    
    if (ipData) {
      if (currentTime < ipData.resetTime) {
        if (ipData.count >= MAX_IP_REQUESTS_PER_HOUR) {
          return NextResponse.json({ 
            error: 'Too many requests from this IP. Please wait before trying again.' 
          }, { status: 429 });
        }
        // Increment count for existing window
        ipRateLimit.set(clientIP, { count: ipData.count + 1, resetTime: ipData.resetTime });
      } else {
        // Reset the count if the hour has passed
        ipRateLimit.set(clientIP, { count: 1, resetTime: currentTime + (60 * 60 * 1000) });
      }
    } else {
      // First request from this IP
      ipRateLimit.set(clientIP, { count: 1, resetTime: currentTime + (60 * 60 * 1000) });
    }

    if (!isAdminInitialized()) {
      return NextResponse.json({ error: 'Firebase Admin SDK not initialized' }, { status: 500 });
    }

    console.log(`[Magic Link Send] Processing request for: ${normalizedEmail}`);
    
    // Find user by email
    const usersCollection = adminDb?.collection('Users');
    if (!usersCollection) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    const snapshot = await usersCollection.where('email', '==', normalizedEmail).get();

    if (snapshot.empty) {
      // For security, we don't reveal whether the email exists or not
      // But we log it for debugging and apply rate limiting to prevent abuse
      console.log(`[Magic Link Send] No user found with email: ${normalizedEmail}`);
      
      // Apply IP-based rate limiting for non-existent users to prevent abuse
      // TODO: Implement IP-based rate limiting here if needed
      
      // Return the same generic message to prevent user enumeration
      return NextResponse.json({ 
        success: true,
        message: 'If this email is registered, you will receive a login link shortly.'
      });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - MIN_INTERVAL_MINUTES * 60 * 1000);

    // Rate limiting checks
    const lastSent = userData.lastMagicLinkSent?.toDate();
    const linkCount = userData.magicLinkCount || 0;
    
    // Check if user is sending too many requests
    if (lastSent && lastSent > oneHourAgo && linkCount >= MAX_LINKS_PER_HOUR) {
      return NextResponse.json({ 
        error: 'Too many magic link requests. Please wait an hour before requesting another link.' 
      }, { status: 429 });
    }

    // Check minimum interval between requests
    if (lastSent && lastSent > oneMinuteAgo) {
      return NextResponse.json({ 
        error: 'Please wait a moment before requesting another magic link.' 
      }, { status: 429 });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(now.getTime() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    // Reset count if it's been more than an hour
    const newCount = (lastSent && lastSent > oneHourAgo) ? linkCount + 1 : 1;

    // Update user document with magic link data
    await userDoc.ref.update({
      magicLinkToken: token,
      magicLinkExpires: Timestamp.fromDate(expiresAt),
      magicLinkUsed: false,
      lastMagicLinkSent: FieldValue.serverTimestamp(),
      magicLinkCount: newCount,
    });

    // Create magic link URL
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
      ? 'https://www.troponiniq.com' 
        : 'http://localhost:3000');
    const magicLinkUrl = `${baseUrl}/login/magic-link?token=${token}&email=${encodeURIComponent(email)}`;

    console.log(`[Magic Link Send] Generated magic link for: ${email}`);

    // Always show magic link in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Magic Link Send] Development mode - Magic link: ${magicLinkUrl}`);
      return NextResponse.json({ 
        success: true,
        message: 'Magic link generated successfully (development mode)',
        magicLink: magicLinkUrl // Always return in development
      });
    }

    // Send email with magic link (only for registered users in production)
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendMagicLinkEmail } = await import('@/lib/email');
        const emailResult = await sendMagicLinkEmail({
          to: email,
          magicLinkUrl,
          displayName: userData.displayName,
        });

        if (!emailResult.success) {
          console.error(`[Magic Link Send] Failed to send email: ${emailResult.error}`);
          // Don't reveal email sending failure to prevent user enumeration
          console.log(`[Magic Link Send] Returning generic success message despite email failure`);
        } else {
          console.log(`[Magic Link Send] Email sent successfully: ${emailResult.id}`);
        }
      } catch (error) {
        console.error(`[Magic Link Send] Email sending error:`, error);
        // Don't reveal email sending failure to prevent user enumeration
        console.log(`[Magic Link Send] Returning generic success message despite email error`);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'If this email is registered, you will receive a login link shortly.'
    });

  } catch (error: any) {
    console.error('[Magic Link Send] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to send magic link',
      details: error.message 
    }, { status: 500 });
  }
} 