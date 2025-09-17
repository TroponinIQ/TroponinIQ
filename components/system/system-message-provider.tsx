'use client';

import { useSystemMessages } from '@/hooks/use-system-messages';
import { SystemMessageBanner } from './system-message-banner';
import { useSession } from 'next-auth/react';

export function SystemMessageProvider() {
  const { status } = useSession();
  const { messages, dismissMessage } = useSystemMessages();

  // Don't show messages if user is not authenticated
  if (status !== 'authenticated') {
    return null;
  }

  // Only show the highest priority message
  const currentMessage = messages.length > 0 ? messages[0] : null;

  if (!currentMessage) {
    return null;
  }

  return (
    <SystemMessageBanner message={currentMessage} onDismiss={dismissMessage} />
  );
}
