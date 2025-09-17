import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import type { DefaultJWT } from 'next-auth/jwt';
import { compare } from 'bcrypt-ts';

// Remove Firebase Functions usage to avoid server-side initialization issues
// We'll use direct API calls instead

export type UserType = 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      createdAt?: string; // Added for system message filtering
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    password?: string;
    createdAt?: string; // Added for system message filtering
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    createdAt?: string; // Added for system message filtering
  }
}

// Helper function to create or get user for OAuth providers
async function createOrGetUserForProvider(
  email: string,
  name?: string,
  image?: string,
) {
  try {
    console.log(`[Auth] Creating/getting user for provider: ${email}`);

    // Use centralized user service instead of HTTP requests
    const { findOrCreateUser } = await import('@/lib/services/user');
    
    const user = await findOrCreateUser({
      email,
      name,
      image,
    });

    if (!user) {
      console.error('[Auth] findOrCreateUser failed to find or create user');
      return null;
    }

    console.log(`[Auth] findOrCreateUser result: ${user.id}`);
    return user;
  } catch (error) {
    console.error('[Auth] Error with user service:', error);
    return null;
  }
}

// Debug: Check if AUTH_SECRET is available
console.log('[Auth] Environment variables check:', {
  AUTH_SECRET: {
    exists: !!process.env.AUTH_SECRET,
    length: process.env.AUTH_SECRET?.length || 0,
    first10: process.env.AUTH_SECRET?.substring(0, 10) || 'MISSING',
  },
  NEXTAUTH_SECRET: {
    exists: !!process.env.NEXTAUTH_SECRET,
    length: process.env.NEXTAUTH_SECRET?.length || 0,
    first10: process.env.NEXTAUTH_SECRET?.substring(0, 10) || 'MISSING',
  },
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    ? 'EXISTS'
    : 'MISSING',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'EXISTS' : 'MISSING',
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        const { email, password } = credentials || {};

        if (!email || !password) {
          console.log('[Auth] Missing email or password');
          return null;
        }

        try {
          // Get user from database using user service
          const { findUserForAuth } = await import('@/lib/services/user');
          
          const user = await findUserForAuth(email);
          
          if (!user) {
            console.log('[Auth] User not found');
            return null;
          }

          if (!user.password) {
            console.log('[Auth] User has no password set');
            return null;
          }

          // Verify password
          const isValidPassword = await compare(password, user.password);
          
          if (!isValidPassword) {
            console.log('[Auth] Invalid password');
            return null;
          }

          console.log('[Auth] User authenticated successfully:', user.email);

        return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.displayImage,
            type: 'regular',
          };

        } catch (error) {
          console.error('[Auth] Authentication error:', error);
          return null;
        }
      },
    }),
    Credentials({
      id: 'magic-link',
      name: 'magic-link',
      credentials: {
        token: { label: 'Token', type: 'text' },
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials: any) {
        const { token, email } = credentials || {};

        if (!token || !email) {
          console.log('[Auth Magic Link] Missing token or email');
          return null;
        }

        try {
          const baseUrl = process.env.BASE_URL || 
            (process.env.NODE_ENV === 'production' 
              ? 'https://www.troponiniq.com' 
              : 'http://localhost:3000');

          const response = await fetch(
            `${baseUrl}/api/auth/magic-link/verify`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, email }),
            },
          );

          const result = await response.json();
          
          if (!response.ok || !result.success) {
            console.log('[Auth Magic Link] Verification failed:', result.error);
            return null;
          }

          const user = result.user;

          console.log('[Auth Magic Link] User authenticated successfully:', user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: user.displayImage,
            type: 'regular',
          };

        } catch (error) {
          console.error('[Auth Magic Link] Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      console.log('[Auth SignIn] SignIn callback called with:', { 
        provider: account?.provider,
        userEmail: user?.email,
        userId: user?.id,
        userName: user?.name 
      });
      
      // Handle Google OAuth
      if (account?.provider === 'google') {
        if (!user.email) {
          console.log('[Auth SignIn] No email provided for Google OAuth');
          return false;
        }

        console.log('[Auth SignIn] Calling createOrGetUserForProvider for:', user.email);
        const dbUser = await createOrGetUserForProvider(
          user.email,
          user.name || undefined,
          user.image || undefined,
        );

        if (!dbUser) {
          console.log('[Auth SignIn] createOrGetUserForProvider returned null');
          return false;
        }

        console.log('[Auth SignIn] Database user found/created:', { 
          dbUserId: dbUser.id, 
          dbUserEmail: dbUser.email 
        });

        // Update user object with database info
        user.id = dbUser.id;
        user.type = 'regular';
        user.createdAt = dbUser.createdAt; // Add creation date for system message filtering

        console.log('[Auth SignIn] Updated user object with:', { 
          userId: user.id, 
          userType: user.type 
        });

        return true;
      }

      // Handle credentials provider (email/password)
      if (account?.provider === 'credentials') {
        // User is already authenticated in the authorize function
        console.log('[Auth SignIn] Credentials provider authenticated successfully');
        return true;
      }

      // Handle magic link provider
      if (account?.provider === 'magic-link') {
        // User is already authenticated in the authorize function
        console.log('[Auth SignIn] Magic link provider authenticated successfully');
        return true;
      }

      console.log('[Auth SignIn] Unknown provider, denying access');
      return false;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      console.log('[Auth JWT] JWT callback called with:', { 
        tokenId: token?.id, 
        userId: user?.id,
        userEmail: user?.email,
        tokenEmail: token?.email 
      });
      
      if (user) {
        token.id = user.id as string;
        token.type = user.type as UserType;
        token.createdAt = user.createdAt; // Add creation date for system message filtering
        console.log('[Auth JWT] Updated token with user data:', { 
          tokenId: token.id, 
          tokenType: token.type,
          hasCreatedAt: !!user.createdAt
        });
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('[Auth Session] Session callback called with:', { 
        sessionUserId: session?.user?.id,
        tokenId: token?.id,
        sessionEmail: session?.user?.email,
        tokenEmail: token?.email 
      });
      
      if (session?.user) {
        session.user.id = token?.id as string;
        session.user.type = token?.type as UserType;
        session.user.createdAt = token?.createdAt as string;
        console.log('[Auth Session] Updated session with token data:', { 
          sessionUserId: session.user.id, 
          sessionType: session.user.type,
          hasCreatedAt: !!session.user.createdAt
        });

        // Fetch current user data from database to get profile image and other info
        if (session.user.email) {
          try {
            const { findUserForAuth } = await import('@/lib/services/user');
            const dbUser = await findUserForAuth(session.user.email);
            
            if (dbUser) {
              // Update session with current database info
              session.user.id = dbUser.id;
              session.user.name = dbUser.displayName;
              session.user.image = dbUser.displayImage;
              session.user.createdAt = dbUser.createdAt as string;
              // Update token as well for future requests
              token.id = dbUser.id;
              token.createdAt = dbUser.createdAt as string;
              
              console.log('[Auth Session] Updated session with database user data:', {
                userId: dbUser.id,
                displayName: dbUser.displayName,
                hasImage: !!dbUser.displayImage,
                hasCreatedAt: !!dbUser.createdAt
              });
            }
          } catch (error) {
            console.error('[Auth Session] Error fetching user data:', error);
          }
        }
      }
      return session;
    },
  },
});
