'use client';

import type { UIMessage } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState, useCallback, useMemo } from 'react';
import { PencilEditIcon, SparklesIcon, TrashIcon } from '../common/icons';
import { MessageContentWrapper } from './message-content-wrapper';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from '../common/preview-attachment';
import equal from 'fast-deep-equal';
import { cn, sanitizeText } from '@/lib/utils';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { MessageEditor } from './message-editor';
import { MessageReasoning } from './message-reasoning';
import type { UseChatHelpers } from '@ai-sdk/react';
import { toast } from 'sonner';

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
  status,
  isLastUserMessage = false,
  previousUserMessage,
}: {
  chatId: string;
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
  status?: UseChatHelpers['status'];
  isLastUserMessage?: boolean;
  previousUserMessage?: UIMessage | null;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isDeleting, setIsDeleting] = useState(false);

  // Enhanced mobile-first message classes
  const messageClasses = useMemo(
    () =>
      cn(
        'flex gap-2 sm:gap-3 md:gap-4 w-full group-data-[role=user]/message:ml-auto',
        // Mobile-optimized max widths
        'group-data-[role=user]/message:max-w-[85%] sm:group-data-[role=user]/message:max-w-[75%] md:group-data-[role=user]/message:max-w-xl lg:group-data-[role=user]/message:max-w-2xl',
        {
          'w-full': mode === 'edit',
          'group-data-[role=user]/message:w-fit': mode !== 'edit',
        },
      ),
    [mode],
  );

  // Enhanced mobile-first content classes
  const contentClasses = useMemo(
    () =>
      cn('flex flex-col gap-2 sm:gap-3 md:gap-4 w-full', {
        'min-h-64 sm:min-h-80 md:min-h-96':
          message.role === 'assistant' && requiresScrollPadding,
      }),
    [message.role, requiresScrollPadding],
  );

  // Memoize delete handler to prevent unnecessary re-renders
  const handleDelete = useCallback(async () => {
    const isUserMessage = message.role === 'user';

    // Check if this would empty the chat and show appropriate warning
    const currentMessages = await new Promise<UIMessage[]>((resolve) => {
      setMessages((messages) => {
        resolve(messages as UIMessage[]);
        return messages;
      });
    });

    let messagesToDelete = 1;
    if (isUserMessage) {
      const currentIndex = currentMessages.findIndex(
        (m) => m.id === message.id,
      );
      if (currentIndex !== -1 && currentIndex < currentMessages.length - 1) {
        const nextMessage = currentMessages[currentIndex + 1];
        if (nextMessage && nextMessage.role === 'assistant') {
          messagesToDelete = 2;
        }
      }
    }

    const wouldEmptyChat = currentMessages.length <= messagesToDelete;

    let confirmMessage: string;
    if (wouldEmptyChat) {
      if (messagesToDelete === 2) {
        confirmMessage =
          'Are you sure you want to delete this conversation?\n\n⚠️ This will delete both the question and AI response, and remove the entire chat from your history.';
      } else {
        confirmMessage =
          "Are you sure you want to delete this message?\n\n⚠️ This will remove the entire chat from your history since it's the only message.";
      }
    } else {
      confirmMessage = isUserMessage
        ? 'Are you sure you want to delete this message?\n\n⚠️ This will also delete the AI response that follows it.'
        : 'Are you sure you want to delete this message?';
    }

    if (confirm(confirmMessage)) {
      setIsDeleting(true);
      try {
        console.log(
          `[Delete Message] Attempting to delete message ${message.id} from chat ${chatId}`,
        );

        const response = await fetch(
          `/api/chat/message?messageId=${message.id}&chatId=${chatId}`,
          {
            method: 'DELETE',
          },
        );

        console.log(`[Delete Message] Response status: ${response.status}`);

        if (response.ok) {
          const result = await response.json();
          console.log(`[Delete Message] Backend response:`, result);

          // Handle race condition case
          if (result.reason === 'Message not found - possible race condition') {
            console.log(
              `[Delete Message] Race condition detected - message may have been already deleted`,
            );
            // Still update UI to remove the message since user intended to delete it
            setMessages((messages) => {
              return messages.filter((m) => m.id !== message.id);
            });
            toast.success('Message removed (was already deleted)');
            return;
          }

          // Check if the entire chat was deleted
          if (result.chatDeleted) {
            toast.success('Chat deleted successfully');
            window.location.href = '/chat/new-chat';
            return;
          }

          // Only update UI after successful backend deletion
          const deletedMessageIds = result.deletedMessages || [];

          if (deletedMessageIds.length > 0) {
            setMessages((messages) => {
              return messages.filter((m) => !deletedMessageIds.includes(m.id));
            });

            if (deletedMessageIds.length > 1) {
              toast.success(
                `Deleted ${deletedMessageIds.length} messages (question and response)`,
              );
            } else {
              toast.success('Message deleted successfully');
            }

            // Log any missing messages from race conditions
            if (result.missingMessages && result.missingMessages.length > 0) {
              console.log(
                `[Delete Message] Some messages were already missing:`,
                result.missingMessages,
              );
            }
          } else {
            // No messages were actually deleted
            toast.success('Message was already deleted');
          }
        } else {
          // Handle HTTP error responses
          let errorMessage = `Failed to delete message (${response.status})`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // If JSON parsing fails, use default message
            const errorText = await response.text();
            console.error(
              `❌ Failed to delete message. Status: ${response.status}, Response: ${errorText}`,
            );
          }

          console.error(`❌ Failed to delete message:`, errorMessage);
          toast.error(`${errorMessage}. Please try refreshing the page.`);
        }
      } catch (error) {
        console.error('❌ Error deleting message:', error);
        toast.error(
          'Network error while deleting message. Please check your connection and try again.',
        );
      } finally {
        setIsDeleting(false);
      }
    }
  }, [message.id, message.role, chatId, setMessages]);

  // Memoize edit mode toggle
  const handleEditToggle = useCallback(() => {
    setMode('edit');
  }, []);

  // Smart edit button logic: only block editing during active streaming,
  // or when this is the last user message and status is submitted
  const isEditDisabled = useMemo(() => {
    if (status === 'streaming') {
      return true; // Always block during streaming
    }

    if (status === 'submitted' && isLastUserMessage) {
      return true; // Block editing the last user message when submitted
    }

    return false; // Allow editing in idle state or for older messages
  }, [status, isLastUserMessage]);

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className={cn(
          'w-full mx-auto max-w-none sm:max-w-4xl md:max-w-5xl lg:max-w-6xl px-2 sm:px-3 md:px-4 group/message',
          message.role === 'user' &&
            'bg-muted/30 py-4 sm:py-5 md:py-6 rounded-xl',
        )}
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div className={messageClasses}>
          {message.role === 'assistant' && (
            <div className="size-6 sm:size-7 md:size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <div className="sm:hidden">
                  <SparklesIcon size={14} />
                </div>
                <div className="hidden sm:block md:hidden">
                  <SparklesIcon size={16} />
                </div>
                <div className="hidden md:block">
                  <SparklesIcon size={18} />
                </div>
              </div>
            </div>
          )}

          <div className={contentClasses}>
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-1 sm:gap-2 overflow-x-auto pb-1"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div
                      key={key}
                      className="flex flex-row gap-1 sm:gap-2 items-start"
                    >
                      {message.role === 'user' && !isReadonly && (
                        <div className="flex flex-row gap-0.5 sm:gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                data-testid="message-edit-button"
                                variant="ghost"
                                className="px-1 sm:px-1.5 md:px-2 h-fit rounded-full text-muted-foreground min-h-[28px] sm:min-h-[32px] md:min-h-[36px]"
                                disabled={isEditDisabled}
                                onClick={handleEditToggle}
                              >
                                <div className="sm:hidden">
                                  <PencilEditIcon size={14} />
                                </div>
                                <div className="hidden sm:block md:hidden">
                                  <PencilEditIcon size={16} />
                                </div>
                                <div className="hidden md:block">
                                  <PencilEditIcon size={18} />
                                </div>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit message</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                data-testid="message-delete-button"
                                variant="ghost"
                                className="px-1 sm:px-1.5 md:px-2 h-fit rounded-full text-muted-foreground hover:text-destructive min-h-[28px] sm:min-h-[32px] md:min-h-[36px]"
                                disabled={isDeleting}
                                onClick={handleDelete}
                              >
                                {isDeleting ? (
                                  <div className="animate-spin size-3 sm:size-4 md:size-5 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <>
                                    <div className="sm:hidden">
                                      <TrashIcon size={14} />
                                    </div>
                                    <div className="hidden sm:block md:hidden">
                                      <TrashIcon size={16} />
                                    </div>
                                    <div className="hidden md:block">
                                      <TrashIcon size={18} />
                                    </div>
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete message</TooltipContent>
                          </Tooltip>
                        </div>
                      )}

                      <div className="flex-1 space-y-2 sm:space-y-3 md:space-y-4 overflow-hidden">
                        <MessageContentWrapper
                          content={sanitizeText(part.text)}
                          messageRole={message.role as 'user' | 'assistant'}
                          previousUserMessage={previousUserMessage}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <MessageEditor
                    key={key}
                    message={message}
                    setMode={setMode}
                    setMessages={setMessages}
                    reload={reload}
                    chatId={chatId}
                    status={status}
                    isLastUserMessage={isLastUserMessage}
                  />
                );
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        // Removed weather skeleton logic
                      })}
                    >
                      {/* Removed weather tool handling since it's not needed for nutrition coaching */}
                      <div className="text-muted-foreground text-sm">
                        Tool: {toolName}
                      </div>
                    </div>
                  );
                }

                if (state === 'result') {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {/* Removed weather tool result handling since it's not needed for nutrition coaching */}
                      <pre className="text-xs sm:text-sm bg-muted p-2 sm:p-3 rounded overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  );
                }
              }
              return null;
            })}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.isReadonly !== nextProps.isReadonly) return false;
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false;
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.status !== nextProps.status) return false; // React to status changes
    if (prevProps.isLastUserMessage !== nextProps.isLastUserMessage)
      return false; // React to last user message changes
    return equal(prevProps.message, nextProps.message);
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-none sm:max-w-4xl md:max-w-5xl lg:max-w-6xl px-2 sm:px-3 md:px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}
      data-role={role}
    >
      <div className="flex gap-2 sm:gap-3 md:gap-4 w-full">
        <div className="size-6 sm:size-7 md:size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
          <div className="translate-y-px">
            <div className="sm:hidden">
              <SparklesIcon size={14} />
            </div>
            <div className="hidden sm:block md:hidden">
              <SparklesIcon size={16} />
            </div>
            <div className="hidden md:block">
              <SparklesIcon size={18} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 w-full">
          <div className="flex flex-col gap-1 sm:gap-2 w-full">
            <div className="flex flex-row gap-1 sm:gap-2 items-center">
              <div className="bg-muted h-2 sm:h-2.5 md:h-3 rounded-md w-12 sm:w-16 md:w-20 animate-pulse" />
              <div className="bg-muted h-2 sm:h-2.5 md:h-3 rounded-md w-8 sm:w-10 md:w-12 animate-pulse opacity-80" />
              <div className="bg-muted h-2 sm:h-2.5 md:h-3 rounded-md w-6 sm:w-8 md:w-10 animate-pulse opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
