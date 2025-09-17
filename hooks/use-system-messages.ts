'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

interface UseSystemMessagesReturn {
  messages: SystemMessage[];
  isLoading: boolean;
  error: string | null;
  dismissMessage: (messageId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSystemMessages(): UseSystemMessagesReturn {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      // Add cache-busting to ensure fresh data after dismissals
      const response = await fetch(`/api/system-messages?t=${Date.now()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch system messages');
      }

      if (data.success && Array.isArray(data.messages)) {
        const parsedMessages = data.messages.map((msg: any) => ({
          ...msg,
          startDate: msg.startDate ? new Date(msg.startDate) : undefined,
          endDate: msg.endDate ? new Date(msg.endDate) : undefined,
          createdAt: new Date(msg.createdAt),
        }));
        setMessages(parsedMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Error fetching system messages:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load system messages',
      );
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]);

  const dismissMessage = useCallback(
    async (messageId: string) => {
      try {
        const response = await fetch('/api/system-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, action: 'dismiss' }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to dismiss message');
        }

        // Immediately refetch to get the most recent undismissed message (if any)
        // This ensures users see the next newest message or nothing at all
        await fetchMessages();
      } catch (err) {
        console.error('Error dismissing system message:', err);
        throw err; // Re-throw so the component can handle it
      }
    },
    [fetchMessages],
  );

  // Initial fetch on mount and when session changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Refetch periodically (every 1 minute) to catch new/updated messages
  useEffect(() => {
    if (status !== 'authenticated') return;

    const interval = setInterval(
      () => {
        fetchMessages();
      },
      1 * 60 * 1000,
    ); // 1 minute

    return () => clearInterval(interval);
  }, [fetchMessages, status]);

  return {
    messages,
    isLoading,
    error,
    dismissMessage,
    refetch: fetchMessages,
  };
}
