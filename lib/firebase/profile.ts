import { getAdminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Timestamp } from 'firebase-admin/firestore';

// Main user document structure with embedded nutrition profile
export interface UserDocument {
  // Basic user info
  email: string;
  name: string;
  displayImage?: string | null;
  created_at: Timestamp;
  last_active: Timestamp;

  // Embedded nutrition profile
  nutritionProfile?: NutritionProfile;
}

export interface NutritionProfile {
  // Personal Info
  preferred_name?: string | null; // User's preferred name (editable, initially from Google)

  // Basic Info
  height_feet?: number | null;
  height_inches?: number | null;
  weight_lbs?: number | null;
  body_fat_percentage?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  gender_description?: string | null;

  // Training
  years_training?: number | null;
  training_time_preference?:
    | 'early_morning'
    | 'morning'
    | 'afternoon'
    | 'evening'
    | 'late_night'
    | null;
  current_activity_level?:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extremely_active'
    | null;

  // Nutrition
  current_diet?: string | null;
  dietary_restrictions?: string | null;
  food_allergies?: string | null;
  supplement_stack?: string | null;

  // Goals
  primary_goal?: string | null;
  target_weight_lbs?: number | null;
  timeline_weeks?: number | null;

  // Medical
  health_conditions?: string | null;
  additional_notes?: string | null;

  // Agent Settings
  enable_profile_agent?: boolean | null; // Default true, allows users to disable

  // Metadata
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface NutritionProfileInput {
  preferred_name?: string | null;
  height_feet?: number | null;
  height_inches?: number | null;
  weight_lbs?: number | null;
  body_fat_percentage?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  gender_description?: string | null;
  years_training?: number | null;
  training_time_preference?:
    | 'early_morning'
    | 'morning'
    | 'afternoon'
    | 'evening'
    | 'late_night'
    | null;
  current_activity_level?:
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extremely_active'
    | null;
  current_diet?: string | null;
  dietary_restrictions?: string | null;
  food_allergies?: string | null;
  supplement_stack?: string | null;
  primary_goal?: string | null;
  target_weight_lbs?: number | null;
  timeline_weeks?: number | null;
  health_conditions?: string | null;
  additional_notes?: string | null;
  enable_profile_agent?: boolean | null;
}

// ============================================================================
// Core Functions - Simple Embedded Approach
// ============================================================================

export async function getNutritionProfile(
  userId: string,
): Promise<NutritionProfile | null> {
  try {
    console.log(
      `[Firebase Profile] Starting to fetch profile for user: ${userId}`,
    );

    const db = getAdminDb();
    if (!db) {
      throw new Error('Admin database connection not available');
    }

    const userDocRef = db.collection('Users').doc(userId);
    const userDocSnap = await userDocRef.get();

    if (!userDocSnap.exists) {
      console.log(`[Firebase Profile] User document not found for: ${userId}`);
      return null;
    }

    const userData = userDocSnap.data() as UserDocument;
    const profile = userData.nutritionProfile;

    if (!profile) {
      console.log(
        `[Firebase Profile] No nutrition profile found for user: ${userId}`,
      );
      return null;
    }

    console.log(
      `[Firebase Profile] Successfully retrieved profile for user: ${userId}`,
    );
    return profile;
  } catch (error) {
    console.error(
      `[Firebase Profile] Error fetching profile for user ${userId}:`,
      error,
    );
    throw error;
  }
}

export async function updateNutritionProfile(
  userId: string,
  profileData: NutritionProfileInput,
): Promise<NutritionProfile> {
  try {
    console.log(
      `[Firebase Profile] Starting to update profile for user: ${userId}`,
    );
    console.log(`[Firebase Profile] Profile data:`, profileData);

    const db = getAdminDb();
    if (!db) {
      throw new Error('Admin database connection not available');
    }

    const userDocRef = db.collection('Users').doc(userId);

    // Prepare the profile data with timestamps
    const now = FieldValue.serverTimestamp();

    // Get existing profile to preserve created_at
    const existingDoc = await userDocRef.get();
    const existingProfile = existingDoc.exists
      ? (existingDoc.data() as UserDocument)?.nutritionProfile
      : null;

    // CRITICAL SAFEGUARD: Merge with existing profile instead of overwriting
    // This prevents accidental data loss if partial updates are sent
    const updatedProfile: any = {
      ...existingProfile, // Start with existing data
      ...profileData, // Apply updates on top
      updated_at: now,
      created_at: existingProfile?.created_at || now,
    };

    // Update the nutrition profile within the user document
    await userDocRef.update({
      nutritionProfile: updatedProfile,
      last_active: now,
    });

    console.log(
      `[Firebase Profile] Successfully updated profile for user: ${userId}`,
    );

    // Return the updated profile (note: timestamps will be server-generated)
    return updatedProfile as NutritionProfile;
  } catch (error) {
    console.error(
      `[Firebase Profile] Error updating profile for user ${userId}:`,
      error,
    );
    throw error;
  }
}

export async function createNutritionProfile(
  userId: string,
  profileData: NutritionProfileInput,
): Promise<NutritionProfile> {
  // For embedded approach, create and update are essentially the same
  return updateNutritionProfile(userId, profileData);
}

// Alias for backwards compatibility
export const createOrUpdateNutritionProfile = updateNutritionProfile;

export async function deleteNutritionProfile(userId: string): Promise<void> {
  try {
    console.log(
      `[Firebase Profile] Starting to delete profile for user: ${userId}`,
    );

    const db = getAdminDb();
    if (!db) {
      throw new Error('Admin database connection not available');
    }

    const userDocRef = db.collection('Users').doc(userId);

    // Remove the nutrition profile from the user document
    await userDocRef.update({
      nutritionProfile: FieldValue.delete(),
      last_active: FieldValue.serverTimestamp(),
    });

    console.log(
      `[Firebase Profile] Successfully deleted profile for user: ${userId}`,
    );
  } catch (error) {
    console.error(
      `[Firebase Profile] Error deleting profile for user ${userId}:`,
      error,
    );
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert user profile to standard format for calculations
 */
export function convertProfileForCalculations(profile: NutritionProfile): {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female';
  activityLevel: string;
  goal: string;
} {
  // Convert height from feet/inches to cm
  const heightFeet = profile.height_feet || 0;
  const heightInches = profile.height_inches || 0;
  const totalInches = heightFeet * 12 + heightInches;
  const heightCm = totalInches * 2.54;

  // Convert weight from lbs to kg
  const weightLbs = profile.weight_lbs || 0;
  const weightKg = weightLbs * 0.453592;

  return {
    age: profile.age || 30,
    weight: weightKg,
    height: heightCm,
    gender: (profile.gender as 'male' | 'female') || 'male',
    activityLevel: profile.current_activity_level || 'moderately_active',
    goal: profile.primary_goal || 'maintain_weight',
  };
}

/**
 * Get a user profile for external API requests (with authentication)
 */
export async function getUserProfile(userId: string): Promise<any> {
  try {
    const nutritionProfile = await getNutritionProfile(userId);

    if (!nutritionProfile) {
      return null;
    }

    // Convert to calculation-friendly format
    const calculationProfile = convertProfileForCalculations(nutritionProfile);

    // Return combined profile with both formats
    return {
      ...nutritionProfile,
      ...calculationProfile,
      // Alias fields for compatibility
      activity_level: nutritionProfile.current_activity_level,
      goal: nutritionProfile.primary_goal,
      displayName: nutritionProfile.preferred_name,
    };
  } catch (error) {
    console.error(
      `[Firebase Profile] Error in getUserProfile for ${userId}:`,
      error,
    );
    throw error;
  }
}

// ============================================================================
// Profile Validation & Completion
// ============================================================================

// Profile completion calculation moved to lib/utils.ts for consistency

export function validateNutritionProfile(profile: Partial<NutritionProfile>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Age validation
  if (profile.age && (profile.age < 13 || profile.age > 120)) {
    errors.push('Age must be between 13 and 120 years');
  }

  // Height validation
  if (
    profile.height_feet &&
    (profile.height_feet < 3 || profile.height_feet > 8)
  ) {
    errors.push('Height must be between 3 and 8 feet');
  }

  if (
    profile.height_inches &&
    (profile.height_inches < 0 || profile.height_inches > 11)
  ) {
    errors.push('Height inches must be between 0 and 11');
  }

  // Weight validation
  if (
    profile.weight_lbs &&
    (profile.weight_lbs < 50 || profile.weight_lbs > 1000)
  ) {
    errors.push('Weight must be between 50 and 1000 pounds');
  }

  // Body fat validation
  if (
    profile.body_fat_percentage &&
    (profile.body_fat_percentage < 3 || profile.body_fat_percentage > 50)
  ) {
    warnings.push('Body fat percentage seems unusual (normal range: 3-50%)');
  }

  // Target weight validation
  if (profile.target_weight_lbs && profile.weight_lbs) {
    const difference = Math.abs(profile.target_weight_lbs - profile.weight_lbs);
    if (difference > profile.weight_lbs * 0.4) {
      // More than 40% change
      warnings.push(
        'Target weight change is very large - consider consulting a healthcare provider',
      );
    }
  }

  // Timeline validation
  if (profile.timeline_weeks && profile.timeline_weeks > 104) {
    // More than 2 years
    warnings.push('Timeline is very long - consider shorter-term goals');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Backwards Compatibility Functions
// ============================================================================

/**
 * Build profile context for AI (backwards compatibility)
 */
export function buildProfileContextForAI(
  profile: NutritionProfile | null,
): string {
  if (!profile) {
    return 'No user profile available.';
  }

  const context = [];

  // Only include preferred name if it's a meaningful personalization and not generic
  // This helps prevent confusion with names from FAQ data that may contain other users' names
  if (
    profile.preferred_name &&
    profile.preferred_name.trim().length > 0 &&
    profile.preferred_name.trim().length < 50 && // Reasonable name length
    !['user', 'client', 'person', 'member', 'guest'].includes(
      profile.preferred_name.toLowerCase(),
    ) &&
    !/^\s*(user|client|person|member|guest)\s*\d*\s*$/i.test(
      profile.preferred_name,
    )
  ) {
    context.push(`User prefers to be called: ${profile.preferred_name}`);
  }

  if (profile.age) {
    context.push(`Age: ${profile.age} years`);
  }

  if (profile.height_feet && profile.height_inches) {
    context.push(`Height: ${profile.height_feet}'${profile.height_inches}"`);
  }

  if (profile.weight_lbs) {
    context.push(`Weight: ${profile.weight_lbs} lbs`);
  }

  if (profile.body_fat_percentage) {
    context.push(`Body fat: ${profile.body_fat_percentage}%`);
  }

  if (profile.gender) {
    context.push(`Gender: ${profile.gender}`);
  }

  if (profile.current_activity_level) {
    context.push(`Activity level: ${profile.current_activity_level}`);
  }

  if (profile.primary_goal) {
    context.push(`Primary goal: ${profile.primary_goal}`);
  }

  if (profile.current_diet) {
    context.push(`Current diet: ${profile.current_diet}`);
  }

  if (profile.dietary_restrictions) {
    context.push(`Dietary restrictions: ${profile.dietary_restrictions}`);
  }

  if (profile.supplement_stack) {
    context.push(`Current supplements: ${profile.supplement_stack}`);
  }

  if (profile.health_conditions) {
    context.push(`Health conditions: ${profile.health_conditions}`);
  }

  if (profile.years_training) {
    context.push(`Training experience: ${profile.years_training} years`);
  }

  if (profile.training_time_preference) {
    context.push(
      `Preferred training time: ${profile.training_time_preference.replace('_', ' ')}`,
    );
  }

  if (profile.additional_notes) {
    context.push(`Additional notes: ${profile.additional_notes}`);
  }

  return context.join('; ');
}

/**
 * Initialize user document (backwards compatibility)
 */
export async function initializeUserDocument(userData: {
  uid: string;
  email: string;
  name?: string;
  displayImage?: string;
}): Promise<void> {
  try {
    const db = getAdminDb();
    if (!db) {
      throw new Error('Admin database connection not available');
    }

    const userDocRef = db.collection('Users').doc(userData.uid);
    const now = FieldValue.serverTimestamp();

    // Check if user already exists
    const existingDoc = await userDocRef.get();
    if (existingDoc.exists) {
      // Update last active
      await userDocRef.update({
        last_active: now,
        ...(userData.name && { name: userData.name }),
        ...(userData.displayImage && { displayImage: userData.displayImage }),
      });
      return;
    }

    // Create new user document
    await userDocRef.set({
      email: userData.email,
      name: userData.name || userData.email,
      displayImage: userData.displayImage || null,
      created_at: now,
      last_active: now,
    });

    console.log(
      `[Firebase Profile] Initialized user document for: ${userData.uid}`,
    );
  } catch (error) {
    console.error(
      `[Firebase Profile] Error initializing user document:`,
      error,
    );
    throw error;
  }
}
