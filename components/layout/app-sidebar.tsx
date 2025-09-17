'use client';

import type { User as NextAuthUser } from 'next-auth';
import { SidebarHistory } from './sidebar-history';
import { SidebarUserNav } from './sidebar-user-nav';
import { useSubscription } from '../subscription/access-guard';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '../common/icons';

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

export function AppSidebar({ user }: { user: NextAuthUser | undefined }) {
  const { setOpenMobile } = useSidebarSafe();
  const { hasAccess } = useSubscription();

  const handleNewChat = () => {
    if (!hasAccess) {
      // Could show a tooltip or just prevent action
      return;
    }
    setOpenMobile(false);
    // Use window.location.href for reliable navigation during active chat sessions
    // This bypasses any router state conflicts from manual history manipulation
    window.location.href = '/chat/new-chat';
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-row items-center justify-between w-full">
              <div className="px-2 tracking-wide text-lg font-semibold">
                <span className="text-gray-600 dark:text-[#9DA1A7]">Troponin</span>
                <span className="text-gray-900 dark:text-white font-bold">IQ</span>
              </div>
              {/* New Chat button - hidden on mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                disabled={!hasAccess}
                className="hidden sm:flex h-8 px-3 gap-2"
                title={!hasAccess ? "Upgrade to Pro to create new chats" : "Create new chat"}
              >
                <PlusIcon size={14} />
                New Chat
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} hasAccess={hasAccess} />
      </SidebarContent>
      <SidebarFooter className="gap-0 -mx-2">
        <SidebarUserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
