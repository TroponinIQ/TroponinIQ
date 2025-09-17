'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

interface PWAContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isOffline: boolean;
  needsUpdate: boolean;
  updateAvailable: boolean;
  installPrompt: any;
  updateApp: () => void;
  installApp: () => void;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [workbox, setWorkbox] = useState<Workbox | null>(null);

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const checkInstallation = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandaloneMode || isIOSStandalone);
      
      // Add PWA class to body for styling
      if (isStandaloneMode || isIOSStandalone) {
        document.body.classList.add('pwa-installed');
      }
    };

    // Check online/offline status
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
      document.body.classList.add('pwa-installed');
    };

    // Initialize
    checkInstallation();
    updateOnlineStatus();

    // Register service worker if in production
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const wb = new Workbox('/sw.js');
      setWorkbox(wb);

      // Service worker update available
      wb.addEventListener('waiting', () => {
        setUpdateAvailable(true);
        setNeedsUpdate(true);
      });

      // Service worker updated
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });

      // Register service worker
      wb.register().catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }

    // Event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const updateApp = () => {
    if (workbox) {
      workbox.messageSkipWaiting();
      setNeedsUpdate(false);
      setUpdateAvailable(false);
    }
  };

  const installApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
      }
      
      setInstallPrompt(null);
    }
  };

  const value: PWAContextType = {
    isInstalled,
    canInstall,
    isOffline,
    needsUpdate,
    updateAvailable,
    installPrompt,
    updateApp,
    installApp,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

// Offline indicator component
export function OfflineIndicator() {
  const { isOffline } = usePWA();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground text-center py-2 text-sm z-50">
      You&apos;re currently offline. Some features may be limited.
    </div>
  );
}

// Update available notification
export function UpdateNotification() {
  const { updateAvailable, updateApp } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-primary text-primary-foreground rounded-lg p-4 shadow-lg z-50 max-w-sm mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Update Available</p>
          <p className="text-sm opacity-90">A new version is ready to install</p>
        </div>
        <button
          type="button"
          onClick={updateApp}
          className="bg-primary-foreground text-primary px-3 py-1 rounded text-sm font-medium ml-4"
        >
          Update
        </button>
      </div>
    </div>
  );
}