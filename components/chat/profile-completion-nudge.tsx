'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight } from 'lucide-react';
import { AIProfileDialog } from '@/components/user/ai-profile-dialog';
import { useFirstTimeUser } from '@/hooks/use-first-time-user';
import { calculateProfileCompletion } from '@/lib/utils';

interface ProfileCompletionNudgeProps {
  userId: string;
}

export function ProfileCompletionNudge({
  userId,
}: ProfileCompletionNudgeProps) {
  const [completionPercentage, setCompletionPercentage] = useState<
    number | null
  >(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const isFirstTimeUser = useFirstTimeUser();

  // Check if user has dismissed the nudge recently (within 24 hours)
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;

    try {
      const dismissedKey = `profile-nudge-dismissed-${userId}`;
      const dismissedTime = localStorage.getItem(dismissedKey);

      if (dismissedTime) {
        const dismissedAt = new Date(dismissedTime).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - dismissedAt) / (1000 * 60 * 60);

        // Show again after 24 hours
        if (hoursDiff < 24) {
          setIsDismissed(true);
        }
      }
    } catch (error) {
      // localStorage not available, continue without persistence
      console.warn('localStorage not available for profile nudge persistence');
    }
  }, [userId]);

  const handleDismiss = () => {
    setIsDismissed(true);

    if (typeof window === 'undefined') return;

    try {
      // Store dismissal time in localStorage
      const dismissedKey = `profile-nudge-dismissed-${userId}`;
      localStorage.setItem(dismissedKey, new Date().toISOString());
    } catch (error) {
      // localStorage not available, dismissal will only last for this session
      console.warn('localStorage not available for profile nudge persistence');
    }
  };

  // Check profile completion status
  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          const profile = data.profile;

          if (!profile) {
            setCompletionPercentage(0);
            return;
          }

          const percentage = calculateProfileCompletion(profile);
          setCompletionPercentage(percentage);

          // Clear dismissal if profile is substantially complete (80%+)
          if (percentage >= 80 && typeof window !== 'undefined') {
            try {
              const dismissedKey = `profile-nudge-dismissed-${userId}`;
              localStorage.removeItem(dismissedKey);
            } catch (error) {
              // localStorage not available, no persistence to clear
            }
          }
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setCompletionPercentage(0);
      }
    };

    if (userId) {
      checkProfileCompletion();
    }
  }, [userId]);

  // Don't show if not a first-time user, profile is substantially complete (80%+), or user dismissed it
  if (
    isFirstTimeUser === null ||
    completionPercentage === null ||
    !isFirstTimeUser ||
    (completionPercentage !== null && completionPercentage >= 80) ||
    isDismissed
  ) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full max-w-2xl mx-auto mb-4"
      >
        <div className="border border-border rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Profile {completionPercentage}% complete – finish for
                  personalized advice
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-2 py-1 h-7"
                    onClick={() => setProfileDialogOpen(true)}
                  >
                    Continue
                    <ChevronRight className="size-3 ml-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="text-xs px-2 py-1 h-7 text-muted-foreground hover:text-foreground"
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 size-6 shrink-0"
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      </motion.div>

      <AIProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </AnimatePresence>
  );
}
