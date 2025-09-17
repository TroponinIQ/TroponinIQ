import { useState, useEffect } from 'react';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { UseChatHelpers } from '@ai-sdk/react';

export function useMessages({
  chatId,
  status,
}: {
  chatId: string;
  status: UseChatHelpers['status'];
}) {
  const {
    containerRef,
    endRef,
    isAtBottom,
    isScrolling,
    userScrolledUp,
    scrollToBottom,
    autoScrollToBottom,
    forceScrollToBottom,
  } = useScrollToBottom({
    behavior: 'smooth',
    threshold: 50,
    autoScrollOnStream: true,
    enableMutationObserver: true, // Let the observer handle all content-related scrolling
    streamingStatus: status === 'streaming' ? 'streaming' : status === 'submitted' ? 'loading' : 'idle',
  });

  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Scroll to bottom instantly when chat changes
  useEffect(() => {
    if (chatId) {
      forceScrollToBottom('instant');
      setHasSentMessage(false);
    }
  }, [chatId, forceScrollToBottom]);

  // Track when user submits a message to help with UI padding, but no scrolling here.
  useEffect(() => {
    if (status === 'submitted' && !userScrolledUp) {
      autoScrollToBottom();
    }
  }, [status, userScrolledUp, autoScrollToBottom]);


  // Legacy compatibility functions
  const onViewportEnter = () => {
    // This is now handled automatically by the intersection observer
  };

  const onViewportLeave = () => {
    // This is now handled automatically by the scroll handler
  };

  return {
    containerRef,
    endRef,
    isAtBottom,
    isScrolling,
    userScrolledUp,
    scrollToBottom,
    autoScrollToBottom,
    forceScrollToBottom,
    onViewportEnter, // Legacy compatibility
    onViewportLeave, // Legacy compatibility
    hasSentMessage,
  };
}
