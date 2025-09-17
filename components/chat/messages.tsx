import type { UIMessage } from 'ai';
import type { UseChatHelpers } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

import { PreviewMessage, ThinkingMessage } from './message';
import { useMessages } from '@/hooks/use-messages';
import { Greeting } from '../common/greeting';
import { useFirstTimeUser } from '@/hooks/use-first-time-user';

type MessagesProps = {
  chatId: string;
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
};

function PureMessages({
  chatId,
  status,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    hasSentMessage,
  } = useMessages({
    chatId,
    status,
  });

  const isFirstTimeUser = useFirstTimeUser();

  // Memoize expensive computations
  const shouldShowGreeting = useMemo(
    () => messages.length === 0 && isFirstTimeUser,
    [messages.length, isFirstTimeUser],
  );

  const shouldShowThinking = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    return (
      status === 'submitted' &&
      messages.length > 0 &&
      lastMessage?.role === 'user'
    );
  }, [status, messages]);

  // Enhanced mobile-first container classes with proper scrolling
  const containerClasses = useMemo(
    () =>
      'messages-container flex flex-col min-w-0 gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-1 overflow-y-auto pt-2 sm:pt-4 md:pt-4 px-2 sm:px-3 md:px-4 relative h-full pb-20 sm:pb-24 md:pb-0',
    [],
  );

  // Memoized message rendering for better streaming performance
  const renderedMessages = useMemo(() => {
    // Calculate which is the last user message for smart edit blocking
    const userMessages = messages.filter((m) => m.role === 'user');
    const lastUserMessageId = userMessages[userMessages.length - 1]?.id;

    return messages.map((message, index) => {
      const isLastMessage = index === messages.length - 1;
      const isStreamingLastMessage = status === 'streaming' && isLastMessage;
      const requiresScrollPadding = hasSentMessage && isLastMessage;
      const isLastUserMessage =
        message.role === 'user' && message.id === lastUserMessageId;

      // Find the previous user message for Easter egg detection
      let previousUserMessage = null;
      if (message.role === 'assistant' && index > 0) {
        for (let i = index - 1; i >= 0; i--) {
          if (messages[i].role === 'user') {
            previousUserMessage = messages[i];
            break;
          }
        }
      }

      return (
        <PreviewMessage
          key={message.id}
          chatId={chatId}
          message={message}
          isLoading={isStreamingLastMessage}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={requiresScrollPadding}
          status={status}
          isLastUserMessage={isLastUserMessage}
          previousUserMessage={previousUserMessage}
        />
      );
    });
  }, [
    messages,
    status,
    hasSentMessage,
    chatId,
    setMessages,
    reload,
    isReadonly,
  ]);

  return (
    <div ref={messagesContainerRef} className={containerClasses}>
      {shouldShowGreeting && <Greeting />}

      {renderedMessages}

      {shouldShowThinking && <ThinkingMessage />}

      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[16px] min-h-[16px] sm:min-w-[20px] sm:min-h-[20px] md:min-w-[24px] md:min-h-[24px]"
      />
    </div>
  );
}

// Memoize with custom comparison for better streaming performance
const MessagesComponent = memo(PureMessages, (prevProps, nextProps) => {
  // Only re-render if essential props changed
  if (prevProps.chatId !== nextProps.chatId) return false;
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;

  // For streaming, check if the last message content changed
  if (nextProps.status === 'streaming') {
    const prevLastMessage = prevProps.messages[prevProps.messages.length - 1];
    const nextLastMessage = nextProps.messages[nextProps.messages.length - 1];

    if (prevLastMessage?.content !== nextLastMessage?.content) return false;
    if (prevLastMessage?.parts !== nextLastMessage?.parts) return false;
  }

  return true; // Skip re-render
});

MessagesComponent.displayName = 'Messages';

export { MessagesComponent as Messages };
