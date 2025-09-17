'use client';

import { ChevronUp, Settings, Brain } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { LoaderIcon } from '../common/icons';
import { AIProfileDialog } from '@/components/user/ai-profile-dialog';
import { AccountSettingsDialog } from '@/components/user/account-settings-dialog';
import { useProfileCompletion } from '../user/profile-completion-hook';

export function SidebarUserNav() {
  const { data: session, status } = useSession();
  const { completionPercentage, refreshProfile } = useProfileCompletion(
    session?.user?.id || '',
  );
  const [aiProfileOpen, setAIProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const userEmail = session?.user?.email || '';
  const userDisplayName = session?.user?.name || userEmail;
  const userAvatar =
    session?.user?.image || `https://avatar.vercel.sh/${userEmail}`;

  const isProfileIncomplete = completionPercentage < 100;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === 'loading' ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-12 justify-between">
                <div className="flex flex-row gap-3">
                  <div className="size-8 bg-zinc-500/30 rounded-full animate-pulse" />
                  <div className="flex flex-col gap-1">
                    <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                      Loading auth status
                    </span>
                    <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse text-xs">
                      Loading...
                    </span>
                  </div>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-12 justify-between group hover:bg-sidebar-accent/50 transition-colors"
              >
                <div className="flex flex-row gap-3 items-center min-w-0">
                  <div className="relative">
                    <Image
                      src={userAvatar}
                      alt={userDisplayName || 'User Avatar'}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-background shadow-sm"
                    />
                    {isProfileIncomplete && (
                      <div className="absolute -top-1 -right-1 size-3 bg-orange-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex flex-col items-start min-w-0 flex-1">
                    <span
                      data-testid="user-email"
                      className="font-medium truncate text-sm"
                    >
                      {userDisplayName}
                    </span>
                    <div className="flex items-center gap-2">
                      {isProfileIncomplete ? (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 h-4 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800"
                        >
                          {completionPercentage}% Profile
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs px-1.5 py-0 h-4 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                        >
                          Profile Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronUp className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 p-2"
            align="end"
            side="top"
            sideOffset={8}
          >
            {/* AI Profile - Primary Option */}
            <DropdownMenuItem
              className="flex items-center gap-3 p-3 cursor-pointer focus:bg-primary/10 focus:text-primary rounded-lg h-auto"
              onClick={() => setAIProfileOpen(true)}
            >
              <div className="relative">
                <div className="size-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
                  <Brain className="size-5" />
                </div>
                {isProfileIncomplete && (
                  <div className="absolute -top-1 -right-1 size-3 bg-orange-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Training Profile</div>
                <div className="text-xs text-muted-foreground">
                  {isProfileIncomplete
                    ? `${completionPercentage}% complete - Improve coaching`
                    : 'Training & nutrition data for personalized coaching'}
                </div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Account Settings - Secondary Option */}
            <DropdownMenuItem
              className="flex items-center gap-3 p-3 cursor-pointer focus:bg-muted focus:text-foreground rounded-lg h-auto"
              onClick={() => setSettingsOpen(true)}
            >
              <div className="size-10 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                <Settings className="size-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Account Settings</div>
                <div className="text-xs text-muted-foreground">
                  Preferences, subscription, and account options
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dialogs */}
        <AIProfileDialog
          open={aiProfileOpen}
          onOpenChange={setAIProfileOpen}
          onProfileSaved={refreshProfile}
        />
        <AccountSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
