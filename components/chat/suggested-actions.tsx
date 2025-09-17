'use client';

import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { memo } from 'react';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Skeleton } from '../ui/skeleton';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  isLoading?: boolean;
}

// Loading skeleton for suggested actions
function SuggestedActionsSkeleton() {
  return (
    <div
      data-testid="suggested-actions-skeleton"
      className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full"
    >
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className={index > 1 ? 'hidden sm:block' : 'block'}>
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function PureSuggestedActions({
  chatId,
  append,
  isLoading = false,
}: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: 'Generate',
      label: 'MASSIVE program spreadsheet',
      action:
        'Generate my MASSIVE program nutrition spreadsheet with daily meal plans for low, medium, and high carb days.',
    },
    {
      title: 'Create',
      label: 'SHREDDED program plan',
      action:
        'Create my SHREDDED program nutrition plan with cutting macros and meal timing for fat loss.',
    },
    {
      title: 'Calculate',
      label: 'my nutrition needs',
      action:
        'Calculate my daily macros and calories based on my goals and training schedule.',
    },
    {
      title: 'Get help with',
      label: 'supplement protocols',
      action:
        'What Troponin supplements should I use and how should I time them around my workouts?',
    },
  ];

  if (isLoading) {
    return <SuggestedActionsSkeleton />;
  }

  return (
    <div
      data-testid="suggested-actions"
      className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl p-3 sm:px-4 sm:py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium text-sm sm:text-base">
              {suggestedAction.title}
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
