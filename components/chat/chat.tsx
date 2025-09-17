'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/layout/chat-header';
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from '../layout/sidebar-history';
import { toast } from '../common/toast';
import type { Session } from 'next-auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { useSession } from 'next-auth/react';
import { Skeleton } from '../ui/skeleton';
import { useSubscription } from '../subscription/access-guard';
import { SubscriptionGate } from '../subscription/subscription-gate';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { ProfileCompletionNudge } from './profile-completion-nudge';

// Loading skeleton for new chat page
function NewChatSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 pb-3 sm:pb-4 md:pb-6 max-w-4xl mx-auto w-full">
      <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
        <Skeleton className="h-6 sm:h-8 md:h-10 lg:h-12 w-64 sm:w-80 md:w-96 lg:w-[500px] mx-auto mb-2 sm:mb-3" />
        <Skeleton className="h-4 sm:h-5 md:h-6 w-48 sm:w-64 md:w-80 mx-auto" />
      </div>

      <div className="w-full max-w-xl sm:max-w-2xl md:max-w-3xl">
        <div className="relative">
          <Skeleton className="min-h-[60px] sm:min-h-[80px] md:min-h-[98px] w-full rounded-xl sm:rounded-2xl" />
          <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2">
            <Skeleton className="size-7 sm:size-8 md:size-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Chat({
  id,
  initialMessages,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  console.log(
    `[Chat] Component received ${initialMessages.length} initialMessages for chat ${id}`,
  );
  console.log(
    `[Chat] Initial messages:`,
    initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content?.slice(0, 50),
    })),
  );

  const { mutate } = useSWRConfig();
  const { status: sessionStatus } = useSession();
  const { hasAccess, isLoading: isLoadingSubscription } = useSubscription();
  const [isInitializing, setIsInitializing] = useState(true);
  const { theme } = useTheme();

  // Generate real UUID if this is a new chat, otherwise use the provided ID
  const [actualChatId] = useState(() => {
    // If we have a real chat ID from URL params, always use it
    if (id !== 'new-chat') {
      console.log(`[Chat] Using existing chat ID: ${id}`);
      return id;
    }
    // Only generate new UUID for truly new chats
    const newId = generateUUID();
    console.log(`[Chat] Generated new chat ID: ${newId}`);
    return newId;
  });

  console.log(
    `[Chat] Component rendered with actualChatId: ${actualChatId}, id: ${id}`,
  );

  const [isNewChat, setIsNewChat] = useState(id === 'new-chat');

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    api: '/api/chat/agent', // 🔥 USE OUR NEW STREAMING AGENT ENDPOINT!
    id: actualChatId, // Use real UUID for all chat operations
    initialMessages,
    experimental_throttle: 16, // Optimized for 60fps streaming performance
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => {
      console.log('[experimental_prepareRequestBody] Called with body:', body);
      console.log('[experimental_prepareRequestBody] sessionId:', actualChatId);
      console.log(
        '[experimental_prepareRequestBody] userId:',
        session.user?.id,
      );
      console.log(
        '[experimental_prepareRequestBody] last message:',
        body.messages.at(-1),
      );

      const preparedBody = {
        message: body.messages.at(-1)?.content, // Send just the message content
        userId: session.user?.id, // Add user ID for agent
        sessionId: actualChatId, // Use chat ID as session ID
      };

      console.log(
        '[experimental_prepareRequestBody] Prepared body:',
        preparedBody,
      );
      return preparedBody;
    },
    onResponse: (response) => {
      console.log('[useChat] onResponse:', response);
      if (!response.ok) {
        console.error('[useChat] onResponse error:', response.statusText);
        toast({
          type: 'error',
          description: `Error from server: ${response.statusText}`,
        });
      }
    },
    onFinish: (message) => {
      console.log('[useChat] onFinish - final assistant message:', message);
      console.log(
        '[useChat] onFinish - all messages (from onFinish closure):',
        messages,
      );

      // Invalidate chat history cache to show new chat in sidebar
      mutate(unstable_serialize(getChatHistoryPaginationKey));

      // Also invalidate the first-time user cache since they now have chat history
      mutate('/api/chat/history?limit=1');

      // Invalidate all history-related caches
      mutate(
        (key) => typeof key === 'string' && key.includes('/api/chat/history'),
      );
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        console.error('[ChatSDKError caught in onError]:', error);
        toast({
          type: 'error',
          description: error.message,
        });
      } else {
        console.error('[useChat] onError (generic):', error);
        toast({
          type: 'error',
          description:
            error.message || 'An unexpected error occurred in useChat.',
        });
      }
    },
    // Performance optimizations for streaming
    keepLastMessageOnError: true, // Better error recovery
  });

  console.log(
    `[Chat] useChat initialized with ${messages.length} messages for chat ${actualChatId}`,
  );
  console.log(
    `[Chat] Current messages in useChat:`,
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content?.slice(0, 50),
    })),
  );

  // Handle initialization timing - set to false when session is ready
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    // Reset to initializing if session becomes loading again
    if (sessionStatus === 'loading') {
      setIsInitializing(true);
    }
  }, [sessionStatus]);

  // Prevent page refresh during streaming to avoid duplicate key errors
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'streaming' || status === 'submitted') {
        e.preventDefault();
        e.returnValue =
          'A message is currently being processed. Refreshing now may cause errors.';
        return 'A message is currently being processed. Refreshing now may cause errors.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  const searchParams = useSearchParams();
  const query = searchParams?.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery && !isInitializing) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${actualChatId}`);
    }
  }, [query, append, hasAppendedQuery, actualChatId, isInitializing]);

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  const router = useRouter();

  const customHandleSubmit = (
    event?: { preventDefault?: () => void },
    options?: any,
  ) => {
    console.log(`[Chat] customHandleSubmit called for chat ${actualChatId}`);
    console.log(`[Chat] isNewChat: ${isNewChat}`);
    console.log(`[Chat] session user ID: ${session.user?.id}`);
    console.log(`[Chat] current status: ${status}`);
    console.log(`[Chat] messages count: ${messages.length}`);

    if (isNewChat) {
      // Update URL without page reload to preserve messages in useChat state
      setIsNewChat(false);
      window.history.pushState({}, '', `/chat/${actualChatId}`);
      console.log(
        `[Chat] Updated URL to /chat/${actualChatId} and set isNewChat to false`,
      );
    }

    console.log(`[Chat] About to call handleSubmit from useChat`);

    // Always use the normal submit with real UUID
    try {
      handleSubmit(event, options);
      console.log(`[Chat] handleSubmit from useChat called successfully`);
    } catch (error) {
      console.error(`[Chat] Error calling handleSubmit from useChat:`, error);
    }
  };

  // Show loading state while session is loading or component is initializing
  const isLoading = sessionStatus === 'loading' || isInitializing;

  return (
    <>
      <div className="flex flex-col min-w-0 h-full bg-background">
        {/* Fixed header for mobile, sticky for desktop */}
        <div className="fixed top-0 inset-x-0 z-50 md:sticky md:top-0 md:inset-x-auto md:z-auto">
          <ChatHeader
            chatId={actualChatId}
            isReadonly={isReadonly}
            session={session}
          />
        </div>

        {/* Main content area with proper spacing for fixed header */}
        <div className="flex-1 flex flex-col pt-[52px] sm:pt-[56px] md:py-0 pb-[120px] overflow-hidden">
          {/* Show loading skeleton, subscription gate, or actual content */}
          {isLoading || isLoadingSubscription ? (
            <div className="flex-1 overflow-hidden">
              <NewChatSkeleton />
            </div>
          ) : !hasAccess ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <SubscriptionGate userId={session.user?.id || ''} />
            </div>
          ) : (
            <>
              {/* Mobile-optimized centered layout for new chats */}
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col px-3 sm:px-4 md:px-6 lg:px-8 max-w-4xl mx-auto w-full">
                  {/* Profile completion nudge at the top */}
                  <div className="pt-4 pb-2">
                    <ProfileCompletionNudge userId={session.user?.id || ''} />
                  </div>

                  {/* Centered main content */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                      {/* Logo with transparency */}
                      <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-8">
                        <Image
                          src="/tn_logo_dark.png"
                          alt="Troponin Nutrition"
                          width={600}
                          height={180}
                          className="mx-auto opacity-80 w-auto h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32"
                          priority
                        />
                      </div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-2 sm:mb-3 text-foreground leading-tight">
                        Where should we begin?
                      </h1>
                      <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-2 leading-relaxed">
                        Ask about nutrition, training, or bodybuilding advice
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <Messages
                    chatId={actualChatId}
                    status={status}
                    messages={messages}
                    setMessages={setMessages}
                    reload={reload}
                    isReadonly={isReadonly}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed input area for mobile, relative for desktop */}
        {!isReadonly && hasAccess && (
          <div className="fixed bottom-0 inset-x-0 z-50 md:relative md:bottom-auto md:inset-x-auto md:z-auto bg-background/95 backdrop-blur-md md:backdrop-blur-none md:bg-background border-t border-border/50 md:border-t-0 pb-safe-area">
            <div className="mx-auto px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:pb-6 gap-2 w-full max-w-none sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
              <MultimodalInput
                chatId={actualChatId}
                input={input}
                setInput={setInput}
                handleSubmit={customHandleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
