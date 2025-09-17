'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIProfileDialog } from '../user/ai-profile-dialog';

interface ManualProfileUpdateButtonProps {
  className?: string;
  userProfile?: any;
  onUpdateProfile?: () => void;
}

/**
 * Simple manual "Update Profile" button that appears in chat
 * when the AI mentions profile discrepancies or suggests updates.
 *
 * This is a proven, scalable approach - no complex auto-detection,
 * just a clean button the user can click when they want to update.
 */
export function ManualProfileUpdateButton({
  className = '',
  userProfile,
  onUpdateProfile,
}: ManualProfileUpdateButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setProfileDialogOpen(true);

    // Simple animation feedback
    setTimeout(() => setIsClicked(false), 150);

    // Execute custom callback if provided
    if (onUpdateProfile) {
      onUpdateProfile();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        className={cn(
          'flex items-center gap-2 text-sm',
          'hover:bg-primary/5 hover:border-primary/20',
          'transition-all duration-200',
          isClicked && 'scale-95',
          className,
        )}
      >
        <User className="h-4 w-4" />
        Update Profile
        <Settings className="h-4 w-4 opacity-60" />
      </Button>

      <AIProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onProfileSaved={onUpdateProfile}
      />
    </>
  );
}

/**
 * Utility function to detect when AI mentions profile discrepancies
 * This is much simpler than auto-detection - just keyword matching
 */
export function shouldShowProfileUpdateButton(aiResponse: string): boolean {
  const lowerResponse = aiResponse.toLowerCase();

  const profileKeywords = [
    'your profile shows',
    'profile says',
    'discrepancy',
    'your current',
    'which numbers are current',
    'update your profile',
    'let me know which',
    'mentioned being',
    'you said',
    'but your profile',
    'current so I can',
  ];

  return profileKeywords.some((keyword) => lowerResponse.includes(keyword));
}
