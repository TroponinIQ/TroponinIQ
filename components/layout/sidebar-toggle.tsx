import type { ComponentProps } from 'react';

import { type SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { SidebarLeftIcon } from '../common/icons';
import { Button } from '@/components/ui/button';

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

export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebarSafe(); // Use safe wrapper

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="outline"
          className="md:px-2 md:h-fit"
        >
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  );
}
