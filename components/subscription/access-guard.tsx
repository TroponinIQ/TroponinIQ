'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useSession, } from 'next-auth/react';
import { LoaderIcon } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
}

interface SubscriptionContextType {
  hasAccess: boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  hasAccess: false,
  isLoading: true,
});

export const useSubscription = () => useContext(SubscriptionContext);

export function AccessGuard({ children }: AccessGuardProps) {
  const { data: session, status } = useSession();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check subscription access for authenticated users
  useEffect(() => {
    async function checkAccess() {
      // Skip if not hydrated yet
      if (!isHydrated) return;
      
      // Still loading session
      if (status === 'loading') {
        return;
      }

      // No session - let parent handle auth
      if (!session?.user?.id) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      // Check subscription immediately
      try {
        const response = await fetch('/api/subscription/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess);
        } else {
          // If API fails, default to no access for security
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [session, status, isHydrated]);

  // During SSR and before hydration, render children to avoid hydration mismatch
  if (!isHydrated) {
    return <>{children}</>;
  }

  // Show loading state for returning authenticated users while checking subscription
  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoaderIcon className="size-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    );
  }

  // If no session, just show children (parent handles auth)
  if (!session?.user?.id) {
    return <>{children}</>;
  }

  // Provide subscription context to all children
  return (
    <SubscriptionContext.Provider 
      value={{ 
        hasAccess: hasAccess ?? false, 
        isLoading 
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
} 