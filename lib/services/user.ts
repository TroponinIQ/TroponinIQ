/**
 * USER SERVICE - TroponinIQ User Management System
 *
 * This service handles all user creation, authentication, and profile management
 * for TroponinIQ. It provides a unified interface for both OAuth (Google) and
 * email/password authentication while maintaining data consistency.
 *
 * AUTHENTICATION FLOWS:
 * 1. Google OAuth - Social login with profile data sync
 * 2. Email/Password - Traditional registration with secure password hashing
 * 3. Magic Links - Passwordless authentication (future implementation)
 *
 * DATA ARCHITECTURE:
 * - Firebase Firestore for primary user storage
 * - Embedded nutrition profiles for performance
 * - Transaction-based operations to prevent race conditions
 * - Normalized email storage for consistent lookups
 *
 * SECURITY FEATURES:
 * - bcrypt password hashing with 12 salt rounds
 * - Email normalization to prevent duplicate accounts
 * - Transaction-based user creation to prevent race conditions
 * - Consistent UUID generation for user IDs
 *
 * BUSINESS LOGIC:
 * - Automatic nutrition profile initialization for new users
 * - OAuth profile data synchronization (images, names)
 * - Unified user schema regardless of authentication method
 * - System message targeting based on user creation date
 *
 * INTEGRATION POINTS:
 * - NextAuth.js for session management
 * - Firebase Admin SDK for server-side operations
 * - Chat system for user-specific conversation history
 * - Subscription system for premium features
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Firestore transactions for consistency without locks
 * - Efficient email-based user lookups
 * - Minimal data transfer for authentication checks
 * - Cached user sessions to reduce database calls
 */

import { adminDb, isAdminInitialized } from '@/lib/firebase/admin';
import { generateUUID } from '@/lib/utils';
import { initializeUserDocument } from '@/lib/firebase/profile';
import { hash } from 'bcrypt-ts';

/**
 * Normalize email for consistent storage and lookup
 * Converts to lowercase and trims whitespace
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  displayImage?: string | null;
  createdAt: string | Date;
}

export interface CreateUserInput {
  email: string;
  name?: string;
  image?: string;
}

export interface CreateEmailUserInput {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Find or create user for OAuth providers (Google, etc.)
 */
export async function findOrCreateUser(
  input: CreateUserInput,
): Promise<User | null> {
  try {
    const normalizedEmail = normalizeEmail(input.email);
    console.log(`[UserService] Finding or creating user: ${normalizedEmail}`);

    if (!isAdminInitialized()) {
      console.error('[UserService] Firebase Admin SDK not initialized');
      return null;
    }

    const usersCollection = adminDb?.collection('Users');
    if (!usersCollection) {
      console.error('[UserService] Database not available');
      return null;
    }

    // Use transaction to prevent race conditions
    const result = await adminDb?.runTransaction(async (transaction) => {
      // Query for existing user within transaction
      const snapshot = await transaction.get(
        usersCollection.where('email', '==', normalizedEmail),
      );

      if (!snapshot.empty) {
        // User exists - update with OAuth data if needed
        const existingUserDoc = snapshot.docs[0];
        const existingUserData = existingUserDoc.data();

        const existingUser: User = {
          id: existingUserDoc.id,
          email: existingUserData.email,
          displayName: existingUserData.name || existingUserData.displayName,
          displayImage: existingUserData.displayImage,
          createdAt: existingUserData.created_at || existingUserData.createdAt,
        };

        console.log(`[UserService] Found existing user: ${existingUser.id}`);

        // Update existing user with OAuth data (like profile image)
        if (input.image || input.name) {
          const updateData: any = {};

          if (input.image && input.image !== existingUser.displayImage) {
            updateData.displayImage = input.image;
            console.log(
              `[UserService] Updating profile image for user: ${existingUser.id}`,
            );
          }

          if (input.name && input.name !== existingUser.displayName) {
            updateData.name = input.name;
            console.log(
              `[UserService] Updating display name for user: ${existingUser.id}`,
            );
          }

          if (Object.keys(updateData).length > 0) {
            transaction.update(existingUserDoc.ref, updateData);
            console.log(
              `[UserService] Updating existing user with OAuth data: ${existingUser.id}`,
            );

            // Return updated user data
            return {
              ...existingUser,
              displayName: updateData.name || existingUser.displayName,
              displayImage:
                updateData.displayImage || existingUser.displayImage,
            };
          }
        }

        return existingUser;
      }

      // User doesn't exist - create new user within transaction
      console.log(`[UserService] Creating new user for: ${normalizedEmail}`);

      const userId = generateUUID();
      const userName = input.name || normalizedEmail.split('@')[0];

      // Create user document data
      const now = new Date().toISOString();
      const userData = {
        email: normalizedEmail,
        name: userName,
        displayImage: input.image || null,
        created_at: now,
        last_active: now,
        nutritionProfile: {
          preferred_name: userName,
          created_at: now,
          updated_at: now,
        },
      };

      // Create user document within transaction
      const userDocRef = usersCollection.doc(userId);
      transaction.set(userDocRef, userData);

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        displayName: userName,
        displayImage: input.image || null,
        createdAt: now,
      };

      console.log(`[UserService] Created new user: ${newUser.id}`);
      return newUser;
    });

    return result || null;
  } catch (error) {
    console.error('[UserService] Error in findOrCreateUser:', error);
    return null;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const normalizedEmail = normalizeEmail(email);

    if (!isAdminInitialized()) {
      return null;
    }

    const usersCollection = adminDb?.collection('Users');
    if (!usersCollection) {
      return null;
    }

    const snapshot = await usersCollection
      .where('email', '==', normalizedEmail)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return {
      id: userDoc.id,
      email: userData.email,
      displayName: userData.name || userData.displayName,
      displayImage: userData.displayImage,
      createdAt: userData.created_at || userData.createdAt,
    };
  } catch (error) {
    console.error('[UserService] Error finding user by email:', error);
    return null;
  }
}

/**
 * Create new user with nutrition profile
 */
export async function createUser(input: CreateUserInput): Promise<User | null> {
  try {
    const userId = generateUUID();
    const userName = input.name || input.email.split('@')[0];

    // Initialize user document with nutrition profile
    await initializeUserDocument({
      uid: userId,
      email: input.email,
      name: userName,
      displayImage: input.image,
    });

    const newUser: User = {
      id: userId,
      email: input.email,
      displayName: userName,
      displayImage: input.image || null,
      createdAt: new Date().toISOString(),
    };

    console.log(`[UserService] Created new user: ${newUser.id}`);
    return newUser;
  } catch (error) {
    console.error('[UserService] Error creating user:', error);
    return null;
  }
}

/**
 * Validate user exists for auth purposes
 */
export async function validateUserForAuth(email: string): Promise<User | null> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.log(`[UserService] User not found for auth: ${email}`);
      return null;
    }
    return user;
  } catch (error) {
    console.error('[UserService] Error validating user for auth:', error);
    return null;
  }
}

/**
 * Find user by email including password for authentication
 */
export async function findUserForAuth(
  email: string,
): Promise<(User & { password?: string }) | null> {
  try {
    const normalizedEmail = normalizeEmail(email);

    if (!isAdminInitialized()) {
      return null;
    }

    const usersCollection = adminDb?.collection('Users');
    if (!usersCollection) {
      return null;
    }

    const snapshot = await usersCollection
      .where('email', '==', normalizedEmail)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return {
      id: userDoc.id,
      email: userData.email,
      displayName: userData.name || userData.displayName,
      displayImage: userData.displayImage,
      password: userData.password, // Include password for auth verification
      createdAt: userData.created_at || userData.createdAt,
    };
  } catch (error) {
    console.error('[UserService] Error finding user for auth:', error);
    return null;
  }
}

/**
 * Create new user with email/password (unified with OAuth schema)
 */
export async function createEmailUser(
  input: CreateEmailUserInput,
): Promise<User | null> {
  try {
    const normalizedEmail = normalizeEmail(input.email);
    console.log(`[UserService] Creating email user: ${normalizedEmail}`);

    if (!isAdminInitialized()) {
      console.error('[UserService] Firebase Admin SDK not initialized');
      return null;
    }

    const usersCollection = adminDb?.collection('Users');
    if (!usersCollection) {
      console.error('[UserService] Database not available');
      return null;
    }

    // Use transaction to prevent race conditions
    const result = await adminDb?.runTransaction(async (transaction) => {
      // Check if user already exists within transaction
      const snapshot = await transaction.get(
        usersCollection.where('email', '==', normalizedEmail),
      );

      if (!snapshot.empty) {
        console.log(`[UserService] User already exists: ${normalizedEmail}`);
        return null;
      }

      // Generate UUID for consistent ID format
      const userId = generateUUID();
      const userName = input.displayName || normalizedEmail.split('@')[0];

      // Hash password
      const hashedPassword = await hash(input.password, 12);

      // Create user document data (unified schema same as OAuth)
      const now = new Date().toISOString();
      const userData = {
        email: normalizedEmail,
        name: userName,
        displayImage: null,
        password: hashedPassword,
        created_at: now,
        last_active: now,
        nutritionProfile: {
          preferred_name: userName,
          created_at: now,
          updated_at: now,
        },
      };

      // Create user document within transaction
      const userDocRef = usersCollection.doc(userId);
      transaction.set(userDocRef, userData);

      const newUser: User = {
        id: userId,
        email: normalizedEmail,
        displayName: userName,
        displayImage: null,
        createdAt: now,
      };

      console.log(`[UserService] Created email user: ${newUser.id}`);
      return newUser;
    });

    return result || null;
  } catch (error) {
    console.error('[UserService] Error creating email user:', error);
    return null;
  }
}
