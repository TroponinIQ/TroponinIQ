'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EasterEggNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  type: string;
}

export function EasterEggNotification({ isVisible, onClose, type }: EasterEggNotificationProps) {
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      setAutoHideTimer(timer);

      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [isVisible, onClose]);

  const getNotificationText = () => {
    switch (type) {
      case 'project-superheavyweight':
        return 'Rare training content discovered';
      case 'mr-michigan':
        return 'Champion story unlocked';
      case 'powerlifting-champion':
        return 'Elite achievement revealed';
      default:
        return 'Hidden content found';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.3 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div className="bg-primary/10 border border-primary/20 rounded-lg shadow-lg">
            <div className="bg-card rounded-lg p-4 flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="flex-shrink-0"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">
                  Hidden Content Discovered
                </p>
                <p className="text-muted-foreground text-xs">
                  {getNotificationText()}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex-shrink-0 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing easter egg notifications
export function useEasterEggNotification() {
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    type: string;
  }>({ isVisible: false, type: '' });

  const showNotification = (type: string) => {
    setNotification({ isVisible: true, type });
  };

  const hideNotification = () => {
    setNotification({ isVisible: false, type: '' });
  };

  return {
    ...notification,
    showNotification,
    hideNotification
  };
}
