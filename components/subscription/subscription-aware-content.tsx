'use client';

import { useSession } from 'next-auth/react';

interface SubscriptionAwareContentProps {
  children: React.ReactNode;
}

export function SubscriptionAwareContent({ children }: SubscriptionAwareContentProps) {
  const { data: session } = useSession();

  // If no session, show children (login page, etc.)
  if (!session?.user?.id) {
    return <>{children}</>;
  }

  // For authenticated users, always show children
  // The Chat component now handles subscription checks internally
  return <>{children}</>;
} 