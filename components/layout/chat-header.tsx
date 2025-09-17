'use client';
import { useWindowSize } from 'usehooks-ts';
import { memo } from 'react';
import { useSession } from 'next-auth/react';

import { SidebarToggle } from '@/components/layout/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '../common/icons';
import { useSidebar } from '../ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { Session } from 'next-auth';
import { Skeleton } from '../ui/skeleton';
import { useSubscription } from '../subscription/access-guard';

// Safe wrapper for useSidebar that handles missing context during sign-out
function useSidebarSafe() {
  try {
    return useSidebar();
  } catch (error) {
    // If SidebarProvider is not available (e.g., during sign-out or initial render), return safe defaults
    // This is expected behavior, so no warning is needed
    return {
      open: false,
      setOpen: () => {},
      openMobile: false,
      setOpenMobile: () => {},
      isMobile: false,
      toggleSidebar: () => {},
      state: 'collapsed' as const,
    };
  }
}

// Mobile-optimized loading skeleton for chat header
function ChatHeaderSkeleton() {
  return (
    <header className="flex sticky top-0 bg-background/95 backdrop-blur-md py-0.5 sm:py-1 items-center px-1.5 sm:px-2 md:px-3 gap-1 border-b border-border/50 min-h-[40px] sm:min-h-[44px] supports-[backdrop-filter]:bg-background/80">
      <Skeleton className="size-6 sm:size-7" />
      <Skeleton className="size-6 sm:h-8 sm:w-20 md:w-24" />
      <Skeleton className="size-6 sm:h-8 sm:w-16 md:w-20" />
    </header>
  );
}

function PureChatHeader({
  chatId,
  isReadonly,
  session,
}: {
  chatId: string;
  isReadonly: boolean;
  session: Session;
}) {
  const { open, openMobile } = useSidebarSafe(); // Use safe wrapper
  const { status: sessionStatus } = useSession();
  const { hasAccess } = useSubscription(); // Add subscription check

  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth < 768;

  const handleNewChat = () => {
    if (!hasAccess) {
      // Show tooltip or prevent action for non-subscribers
      return;
    }
    // Use window.location.href for reliable navigation during active chat sessions
    // This bypasses any router state conflicts from manual history manipulation
    window.location.href = '/chat/new-chat';
  };

  // Show loading skeleton while session is loading
  if (sessionStatus === 'loading') {
    return <ChatHeaderSkeleton />;
  }

  return (
    <header className="flex w-full bg-background/95 backdrop-blur-md py-0.5 sm:py-1 items-center px-1.5 sm:px-2 md:px-3 gap-1 border-b border-border/50 min-h-[40px] sm:min-h-[44px] supports-[backdrop-filter]:bg-background/80">
      <SidebarToggle />

      {!openMobile && (
        <div className="flex flex-1 items-center justify-between gap-1 sm:gap-2">
          {/* Left side - empty space for balance */}
          <div className="flex items-center gap-1 sm:gap-2" />

          {/* Right side - New Chat button (mobile only) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile-optimized New Chat button - only show when sidebar is closed or on mobile */}
            {(!open || isTablet) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size={isMobile ? 'sm' : 'default'}
                    className="shrink-0 size-6 sm:size-7 sm:h-7 sm:w-auto sm:p-1.5 md:px-2.5 p-0"
                    onClick={handleNewChat}
                    disabled={!hasAccess}
                  >
                    <PlusIcon size={isMobile ? 14 : 16} />
                    {!isMobile && (
                      <span className="ml-1 sm:ml-2 hidden sm:inline">
                        New Chat
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasAccess
                    ? 'New Chat'
                    : 'Upgrade to Pro to create new chats'}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.chatId === nextProps.chatId;
});
