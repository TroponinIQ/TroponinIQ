'use client';

import { useState } from 'react';
import {
  X,
  AlertTriangle,
  Info,
  CheckCircle,
  Wrench,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Markdown } from '@/components/common/markdown';

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

interface SystemMessageBannerProps {
  message: SystemMessage;
  onDismiss: (messageId: string) => void;
  isDismissing?: boolean;
}

const messageTypeConfig = {
  update: {
    icon: CheckCircle,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Update',
  },
  feature: {
    icon: Megaphone,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'New Feature',
  },
  maintenance: {
    icon: Wrench,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Maintenance',
  },
  error: {
    icon: AlertTriangle,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-destructive dark:text-destructive',
    iconBg: 'bg-destructive/10 dark:bg-destructive/10',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Service Issue',
  },
  announcement: {
    icon: Info,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Announcement',
  },
};

const priorityConfig = {
  low: { label: 'Low', pulse: false },
  medium: { label: 'Medium', pulse: false },
  high: { label: 'High', pulse: true },
  critical: { label: 'Critical', pulse: true },
};

export function SystemMessageBanner({
  message,
  onDismiss,
  isDismissing = false,
}: SystemMessageBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const typeConfig = messageTypeConfig[message.type];
  const priorityInfo = priorityConfig[message.priority];
  const Icon = typeConfig.icon;

  const handleDismiss = async () => {
    setIsAnimatingOut(true);

    // Start the API call immediately but don't wait for the animation
    const dismissPromise = new Promise<void>((resolve, reject) => {
      fetch('/api/system-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: message.id, action: 'dismiss' }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            resolve();
          } else {
            reject(new Error(data.message || 'Failed to dismiss message'));
          }
        })
        .catch(reject);
    });

    // Wait for animation to complete
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(message.id);
    }, 300);

    // Handle API response
    try {
      await dismissPromise;
    } catch (error) {
      console.error('Failed to dismiss system message:', error);
      toast.error('Failed to dismiss message. Please try again.');
      // Optionally show the message again on error
      setIsAnimatingOut(false);
      setIsVisible(true);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay for both mobile and desktop */}
      <button
        type="button"
        className={cn(
          'fixed inset-0 z-40',
          'bg-black/20 backdrop-blur-sm',
          'transition-opacity duration-300 ease-in-out',
          isAnimatingOut ? 'opacity-0' : 'opacity-100',
        )}
        onClick={(e) => {
          // Only dismiss if clicking the backdrop itself, not child elements
          if (e.target === e.currentTarget) {
            handleDismiss();
          }
        }}
        aria-label="Dismiss system message"
      />

      {/* Centered modal for both mobile and desktop */}
      <div
        className={cn(
          // Center on all screen sizes
          'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-lg px-4',
          'transition-all duration-300 ease-in-out',
          isAnimatingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100',
        )}
      >
        <Card
          className={cn(
            'shadow-2xl border border-solid backdrop-blur-sm',
            typeConfig.color,
          )}
        >
          <CardContent
            className={cn(
              // Mobile: minimal padding for compact display
              'p-3 sm:p-6',
            )}
          >
            <div className="relative">
              {/* Mobile-first compact header */}
              <div className="flex items-start gap-2 mb-2 sm:gap-3">
                {/* Smaller icon on mobile */}
                <div
                  className={cn(
                    'flex-shrink-0 p-1.5 sm:p-2 rounded-lg',
                    typeConfig.iconBg,
                    priorityInfo.pulse && 'animate-pulse',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3 w-3 sm:h-4 sm:w-4',
                      typeConfig.iconColor,
                    )}
                  />
                </div>

                {/* Title and badges - more compact on mobile */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <h3 className="font-semibold text-sm sm:text-sm text-foreground leading-tight">
                        {message.title}
                      </h3>
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {typeConfig.typeLabel}
                        </Badge>
                        {message.priority !== 'low' && (
                          <Badge
                            variant={
                              message.priority === 'critical'
                                ? 'destructive'
                                : message.priority === 'high'
                                  ? 'default'
                                  : 'secondary'
                            }
                            className="text-xs font-normal"
                          >
                            {priorityInfo.label}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Large, prominent dismiss button on mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      disabled={isDismissing || isAnimatingOut}
                      className={cn(
                        // Mobile: much larger touch target for easy dismissal
                        'h-10 w-10 sm:h-6 sm:w-6 p-0',
                        'hover:bg-black/20 dark:hover:bg-white/20 flex-shrink-0',
                        // Mobile: prominent background for visibility
                        'bg-black/10 dark:bg-white/10 sm:bg-transparent',
                        'border border-border/20 sm:border-transparent',
                        'rounded-md',
                        // Mobile: better visual feedback
                        'active:scale-95 transition-transform',
                      )}
                      title="Tap to dismiss"
                      aria-label="Close announcement"
                    >
                      <X className="h-5 w-5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Compact content area - mobile optimized */}
              <div className="pl-1 sm:pl-2">
                {/* Mobile: constrained height with easy scrolling */}
                <div
                  className={cn(
                    'text-sm',
                    // Mobile: much smaller max height to prevent blocking UI
                    'max-h-[25vh] sm:max-h-[60vh] overflow-y-auto',
                    // Better touch scrolling on mobile
                    'overscroll-contain',
                    // Content styling - more compact on mobile
                    '[&>div>*:first-child]:mt-0 [&>div>*:last-child]:mb-0',
                    '[&_ul]:ml-1 [&_li]:py-0.5 [&_p]:mb-1 sm:[&_p]:mb-2',
                    '[&_h1]:mb-1 sm:[&_h1]:mb-2 [&_h2]:mb-1 sm:[&_h2]:mb-2 [&_h3]:mb-1 sm:[&_h3]:mb-2',
                    // Mobile: reduce line height for compactness
                    'leading-5 sm:leading-normal',
                  )}
                  style={{
                    // Better mobile scrollbar
                    scrollbarWidth: 'thin',
                    scrollbarColor:
                      'hsl(var(--muted-foreground) / 0.3) transparent',
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                  }}
                >
                  <Markdown>{message.content}</Markdown>
                </div>

                {/* Compact timestamp */}
                <div className="mt-2 sm:mt-3 text-xs text-muted-foreground">
                  {message.createdAt.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
