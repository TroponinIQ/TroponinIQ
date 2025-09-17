'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateProfileCompletion } from '@/lib/utils';

interface ProfileData {
  // Basic Info
  age?: number;
  weight_lbs?: number;
  height_feet?: number;
  height_inches?: number;
  gender?: string;

  // Training
  current_activity_level?: string;
  years_training?: number;
  training_time_preference?: string;

  // Nutrition
  current_diet?: string;
  dietary_restrictions?: string;
  supplement_stack?: string;

  // Goals
  primary_goal?: string;
  target_weight_lbs?: number;
  timeline_weeks?: number;

  // Medical
  health_conditions?: string;
  additional_notes?: string;
}

interface ProfileCompletionResult {
  completionPercentage: number;
  profileData: ProfileData | null;
  isLoading: boolean;
  refreshProfile: () => void;
}

export function useProfileCompletion(userId: string): ProfileCompletionResult {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (!userId) {
      setProfileData(null);
      setCompletionPercentage(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const profile = data.profile || {};
        setProfileData(profile);

        // Use unified calculation method
        const percentage = calculateProfileCompletion(profile);
        setCompletionPercentage(percentage);
      } else {
        setProfileData(null);
        setCompletionPercentage(0);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfileData(null);
      setCompletionPercentage(0);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return {
    completionPercentage,
    profileData,
    isLoading,
    refreshProfile: fetchProfileData,
  };
}
