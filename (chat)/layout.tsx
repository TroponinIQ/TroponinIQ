'use client';

import Script from 'next/script';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AccessGuard } from '@/components/subscription/access-guard';
import { SubscriptionAwareContent } from '@/components/subscription/subscription-aware-content';
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';
import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';

export const experimental_ppr = true;

// Client wrapper component that has access to session context
function ChatLayoutClient({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  console.log(
    '[ChatLayout] Session status:',
    status,
    'Has session:',
    !!session,
    'User ID:',
    session?.user?.id,
  );

  // Only show sidebar layout when user is fully authenticated
  if (status !== 'authenticated' || !session) {
    console.log('[ChatLayout] Not authenticated, showing simple layout');
    return (
      <>
        <Script
          src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
          strategy="beforeInteractive"
        />
        <div className="min-h-screen h-screen bg-background chat-container overflow-hidden">
          {children}
        </div>
      </>
    );
  }

  // If user is authenticated, show full sidebar layout with mobile optimizations and access protection
  console.log('[ChatLayout] User authenticated, showing full layout');
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <AccessGuard>
        <SidebarProvider
          defaultOpen={true}
          className="min-h-screen h-screen bg-background overflow-hidden"
        >
          <AppSidebar user={session?.user} />
          <SidebarInset className="chat-container h-full overflow-hidden">
            <SubscriptionAwareContent>{children}</SubscriptionAwareContent>
          </SidebarInset>
          <PWAInstallPrompt />
        </SidebarProvider>
      </AccessGuard>
    </>
  );
}

export default function ChatLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ChatLayoutClient>{children}</ChatLayoutClient>;
}
