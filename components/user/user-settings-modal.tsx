'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  User,
  CreditCard,
  MessageSquare,
  LogOut,
  History,
  Shield,
  Download,
} from 'lucide-react';
import { toast } from '../common/toast';
import { AIProfileDialog } from './ai-profile-dialog';
import { FeedbackDialog } from './feedback-dialog';
import { SubscriptionManagementDialog } from '../subscription/subscription-management-dialog';
import { SystemMessageHistoryDialog } from '../system/system-message-history-dialog';
import { usePWA } from '../pwa/pwa-provider';
import { useProfileCompletion } from '../user/profile-completion-hook';
import Link from 'next/link';

interface UserSettingsModalProps {
  children: React.ReactNode;
}

export function UserSettingsModal({ children }: UserSettingsModalProps) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const { canInstall, isInstalled, installApp } = usePWA();
  const { completionPercentage, profileData, refreshProfile } =
    useProfileCompletion(session?.user?.id || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
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

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 pb-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium text-sm">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{userDisplayName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </div>

          {/* Profile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Profile</span>
              <span className="text-xs text-muted-foreground">
                {completionPercentage}% complete
              </span>
            </div>
            <Button
              variant={completionPercentage < 100 ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              onClick={() => setProfileDialogOpen(true)}
            >
              <User className="h-4 w-4 mr-2" />
              {completionPercentage < 100
                ? 'Complete Profile'
                : 'Update Profile'}
            </Button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between py-2">
            <span className="font-medium text-sm" id="theme-toggle-label">
              Dark mode
            </span>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) =>
                setTheme(checked ? 'dark' : 'light')
              }
              aria-labelledby="theme-toggle-label"
            />
          </div>

          {/* Install App */}
          {!isInstalled && (canInstall || isIOS) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePWAInstall}
              className="w-full justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              {isIOS ? 'Installation Guide' : 'Install App'}
            </Button>
          )}

          <div className="space-y-1">
            <SubscriptionManagementDialog>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Subscription
              </Button>
            </SubscriptionManagementDialog>

            <FeedbackDialog>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Feedback
              </Button>
            </FeedbackDialog>

            <SystemMessageHistoryDialog>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <History className="h-4 w-4 mr-2" />
                System Messages
              </Button>
            </SystemMessageHistoryDialog>

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link href="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            )}

            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Profile Dialog */}
      <AIProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onProfileSaved={refreshProfile}
      />
    </Dialog>
  );
}
