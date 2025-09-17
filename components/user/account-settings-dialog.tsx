'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Switch } from '@/components/ui/switch';
import { Sun, Moon, Monitor, LogOut, Shield, Download } from 'lucide-react';
import { toast } from '../common/toast';
import { FeedbackDialog } from './feedback-dialog';
import { SubscriptionManagementDialog } from '../subscription/subscription-management-dialog';
import { SystemMessageHistoryDialog } from '../system/system-message-history-dialog';
import { usePWA } from '../pwa/pwa-provider';
import Link from 'next/link';

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: AccountSettingsDialogProps) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [enableProfileAgent, setEnableProfileAgent] = useState(true);
  const [isProfileAgentLoading, setIsProfileAgentLoading] = useState(false);

  const userEmail = session?.user?.email || '';
  const userDisplayName = session?.user?.name || userEmail;

  // Check if user is admin
  useEffect(() => {
    async function checkAdminStatus() {
      if (!session?.user?.email) {
        setIsAdmin(false);
        return;
      }

      try {
        const { isAdminUser } = await import('@/lib/admin/auth');
        setIsAdmin(isAdminUser(session.user.email));
      } catch (error) {
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [session?.user?.email]);

  // Check if device is iOS
  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);
  }, []);

  // Load profile agent setting
  useEffect(() => {
    async function loadProfileAgentSetting() {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile?.enable_profile_agent !== undefined) {
            setEnableProfileAgent(data.profile.enable_profile_agent);
          }
        }
      } catch (error) {
        console.error('Failed to load profile agent setting:', error);
      }
    }

    if (open) {
      loadProfileAgentSetting();
    }
  }, [open]);

  const handleProfileAgentToggle = async (newValue: boolean) => {
    if (isProfileAgentLoading) return;

    try {
      setIsProfileAgentLoading(true);

      // Optimistic update
      setEnableProfileAgent(newValue);

      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable_profile_agent: newValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      toast({
        type: 'success',
        description: `Smart Profile Updates ${newValue ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Failed to update profile agent setting:', error);
      // Revert optimistic update on error
      setEnableProfileAgent(!newValue);
      toast({
        type: 'error',
        description: 'Failed to update setting. Please try again.',
      });
    } finally {
      setIsProfileAgentLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({
        redirect: true,
        callbackUrl: '/',
      });
    } catch (error) {
      console.error('Primary logout failed, attempting fallback:', error);
      try {
        await signOut({ redirect: false });
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('Fallback logout also failed:', fallbackError);
        toast({
          type: 'error',
          description: 'Failed to sign out. Please refresh the page.',
        });
      }
    }
  };

  const handlePWAInstall = () => {
    if (canInstall) {
      installApp();
    } else if (isIOS) {
      window.location.href = '/install-guide';
    } else {
      toast({
        type: 'error',
        description:
          'Install option not available. Try refreshing the page or check your browser settings.',
      });
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun, description: 'Light mode' },
    { value: 'dark', label: 'Dark', icon: Moon, description: 'Dark mode' },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follow system',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Account */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Account
            </h3>
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="size-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {userDisplayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p
                    className="font-medium text-sm"
                    id="smart-profile-updates-label"
                  >
                    Smart Profile Updates
                  </p>
                  <p
                    className="text-xs text-muted-foreground"
                    id="smart-profile-updates-desc"
                  >
                    Let AI suggest profile updates during conversations
                  </p>
                </div>
                <Switch
                  checked={enableProfileAgent}
                  onCheckedChange={handleProfileAgentToggle}
                  aria-labelledby="smart-profile-updates-label"
                  aria-describedby="smart-profile-updates-desc"
                />
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Appearance
            </h3>
            <div className="flex gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = theme === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`flex-1 p-3 rounded-lg border transition-all hover:bg-muted/50 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon
                        className={`size-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <span className="text-xs font-medium">
                        {option.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Install App */}
          {!isInstalled && (canInstall || isIOS) && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">
                Mobile App
              </h3>
              <Button
                onClick={handlePWAInstall}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="size-4 mr-2" />
                {isIOS ? 'Installation Guide' : 'Install App'}
              </Button>
            </div>
          )}

          {/* Subscription */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Subscription
            </h3>
            <SubscriptionManagementDialog>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                Manage Subscription
              </Button>
            </SubscriptionManagementDialog>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground">
              Support
            </h3>
            <div className="space-y-2">
              <FeedbackDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  Send Feedback
                </Button>
              </FeedbackDialog>
              <SystemMessageHistoryDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  System Messages
                </Button>
              </SystemMessageHistoryDialog>
            </div>
          </div>

          {/* Admin */}
          {isAdmin && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-orange-600 dark:text-orange-400">
                Admin
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start border-orange-200 dark:border-orange-800"
                asChild
              >
                <Link href="/admin">
                  <Shield className="size-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive"
            size="sm"
          >
            <LogOut className="size-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
