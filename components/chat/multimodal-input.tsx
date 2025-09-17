/**
 * MULTIMODAL INPUT COMPONENT - TroponinIQ Chat Interface
 *
 * This component handles text input and file uploads for the nutrition coaching chat.
 *
 * CURRENT STATE:
 * - Text input: ✅ Fully functional
 * - File upload: 🚧 UI ready but backend disabled (returns 501)
 *
 * FILE UPLOAD FEATURES (when enabled):
 * - Food photos for meal analysis
 * - Progress photos for body composition tracking
 * - PDF documents (meal plans, lab results)
 * - Drag & drop support
 * - Multiple file selection
 * - Upload progress tracking
 *
 * TECHNICAL NOTES:
 * - File input is visually hidden but functional
 * - Upload queue system prevents UI blocking
 * - Error handling with user-friendly messages
 * - Integrates with AI chat for contextual analysis
 *
 * TODO: Enable file uploads once storage backend is configured
 * See: app/api/chat/files/upload/route.ts for implementation details
 */

'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type { UseChatHelpers } from '@ai-sdk/react';
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
} from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon, StopIcon } from '../common/icons';
import { ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { SuggestedActions } from './suggested-actions';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { memo } from 'react';
import equal from 'fast-deep-equal';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  isLoading = false,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  isLoading?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  // Enhanced mobile-first textarea classes
  const textareaClasses = useMemo(
    () =>
      cx(
        // Base styles with mobile-first approach
        'min-h-[60px] sm:min-h-[80px] md:min-h-[98px]',
        'max-h-[40vh] sm:max-h-[50vh] md:max-h-[calc(75dvh)]',
        'overflow-hidden resize-none rounded-xl sm:rounded-2xl',
        'text-sm sm:text-base md:!text-base',
        'bg-muted',
        // Mobile-optimized padding - increased bottom padding to prevent text overlap with send button
        'pb-12 sm:pb-14 md:pb-16',
        'px-3 sm:px-4 md:px-4',
        'pt-3 sm:pt-4 md:pt-4',
        // Focus and border styles
        'dark:border-zinc-500 focus-visible:outline-2 focus-visible:outline-zinc-700',
        // Only show disabled state when actually loading (not when agent is responding)
        isLoading && 'opacity-50 cursor-not-allowed',
        className,
      ),
    [isLoading, className],
  );

  const shouldShowSuggestedActions = useMemo(
    () =>
      messages.length === 0 && attachments.length === 0 && input.trim() === '',
    [messages.length, attachments.length, input],
  );

  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, [adjustHeight]);

  const resetHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Mobile-responsive min heights
      const minHeight =
        width && width < 640 ? '60px' : width && width < 768 ? '80px' : '98px';
      textareaRef.current.style.height = minHeight;
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value);
      adjustHeight();
    },
    [setInput, adjustHeight],
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    console.log(`[MultimodalInput] submitForm called for chat ${chatId}`);
    console.log(`[MultimodalInput] Current status: ${status}`);
    console.log(`[MultimodalInput] Input value: "${input}"`);
    console.log(`[MultimodalInput] Attachments count: ${attachments.length}`);
    console.log(`[MultimodalInput] isLoading: ${isLoading}`);

    window.history.replaceState({}, '', `/chat/${chatId}`);

    console.log(`[MultimodalInput] About to call handleSubmit`);

    try {
      handleSubmit(undefined, {
        experimental_attachments: attachments,
      });
      console.log(`[MultimodalInput] handleSubmit called successfully`);
    } catch (error) {
      console.error(`[MultimodalInput] Error calling handleSubmit:`, error);
    }

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    // Only focus on larger screens to avoid mobile keyboard issues
    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    resetHeight,
    status,
    input,
    isLoading,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/chat/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();

        // If streaming, stop the stream
        if (status === 'streaming') {
          stop();
          return;
        }

        // Prevent submission when agent is processing (submitted state)
        if (status === 'submitted') {
          return;
        }

        submitForm();
      }
    },
    [status, stop, submitForm],
  );

  const {
    isAtBottom: isScrolledToBottom,
    isScrolling,
    forceScrollToBottom,
  } = useScrollToBottom({
    threshold: 100, // Slightly higher threshold for input component
    autoScrollOnStream: false, // Let messages component handle auto-scroll
    streamingStatus:
      status === 'streaming'
        ? 'streaming'
        : status === 'submitted'
          ? 'loading'
          : 'idle',
  });

  return (
    <div className="relative w-full flex flex-col gap-2 sm:gap-3 md:gap-4">
      {shouldShowSuggestedActions && (
        <div className="mb-2 sm:mb-3 md:mb-4">
          <SuggestedActions chatId={chatId} append={append} />
        </div>
      )}

      <AnimatePresence>
        {!isScrolledToBottom && messages.length > 0 && !isScrolling && (
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 flex justify-center"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              duration: 0.2,
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => forceScrollToBottom('smooth')}
              className="rounded-full bg-background/95 shadow-lg border-border/50 backdrop-blur-md size-10 p-0 hover:bg-accent/80 hover:scale-105 transition-all duration-200 flex items-center justify-center group"
            >
              <ArrowDown
                size={16}
                className="group-hover:translate-y-0.5 transition-transform duration-200"
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex w-full">
        <Textarea
          ref={textareaRef}
          placeholder={
            status === 'streaming'
              ? 'Type your next message... (Enter to stop current response)'
              : status === 'submitted'
                ? 'Type your next message... (will send when response is ready)'
                : messages.length === 0
                  ? "Tell me what's on your mind... (Enter to send)"
                  : 'Send a message... (Enter to send)'
          }
          value={input}
          onChange={handleInput}
          className={textareaClasses}
          rows={1}
          autoFocus={false} // Disable autofocus on mobile
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        {/* Keyboard shortcut hint */}
        <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-2 left-3 sm:left-4 md:left-4 pointer-events-none select-none">
          <div className="text-xs text-muted-foreground/60 hidden sm:block">
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted-foreground/10 rounded border border-muted-foreground/20">
              Shift
            </kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted-foreground/10 rounded border border-muted-foreground/20">
              Enter
            </kbd>
            {' for new line'}
          </div>
        </div>

        {/* Mobile-optimized button positioning */}
        <div className="absolute bottom-1.5 sm:bottom-2 md:bottom-2 right-1.5 sm:right-2 md:right-2 flex flex-row gap-1 sm:gap-2">
          {status === 'streaming' ? (
            <StopButton stop={stop} setMessages={setMessages} />
          ) : (
            <SendButton
              submitForm={submitForm}
              input={input}
              uploadQueue={uploadQueue}
              isLoading={isLoading}
              status={status}
            />
          )}
        </div>
      </div>

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />
    </div>
  );
}

// Enhanced memoization for better performance
export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    // Fast path: if status changes, always re-render
    if (prevProps.status !== nextProps.status) return false;

    // Fast path: if input changes, always re-render
    if (prevProps.input !== nextProps.input) return false;

    // Fast path: if loading state changes, always re-render
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    // Fast path: if message count changes, always re-render
    if (prevProps.messages.length !== nextProps.messages.length) return false;

    // Fast path: if attachment count changes, always re-render
    if (prevProps.attachments.length !== nextProps.attachments.length)
      return false;

    // Fast path: if chatId changes, always re-render
    if (prevProps.chatId !== nextProps.chatId) return false;

    // Deep comparison for attachments (most expensive check last)
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;

    return true;
  },
);

// Mobile-optimized StopButton component
function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      className="rounded-full p-1 sm:p-1.5 md:p-2 size-6 sm:size-7 md:size-8 dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
      disabled={false}
    >
      <div className="sm:hidden">
        <StopIcon size={12} />
      </div>
      <div className="hidden sm:block md:hidden">
        <StopIcon size={14} />
      </div>
      <div className="hidden md:block">
        <StopIcon size={16} />
      </div>
    </Button>
  );
}

const StopButton = memo(PureStopButton, () => true);

// Mobile-optimized SendButton component
function PureSendButton({
  submitForm,
  input,
  uploadQueue,
  isLoading,
  status,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  isLoading: boolean;
  status: UseChatHelpers['status'];
}) {
  // Disable the button when there's no input, files are uploading, general loading,
  // or when the agent is processing (submitted or streaming)
  const isDisabled =
    input.length === 0 ||
    uploadQueue.length > 0 ||
    isLoading ||
    status === 'streaming' ||
    status === 'submitted';

  console.log(
    `[SendButton] Rendered - input.length: ${input.length}, uploadQueue.length: ${uploadQueue.length}, isLoading: ${isLoading}, status: ${status}, isDisabled: ${isDisabled}`,
  );

  return (
    <Button
      className="rounded-full p-1 sm:p-1.5 md:p-2 size-6 sm:size-7 md:size-8 dark:border-zinc-600"
      onClick={(event) => {
        console.log(
          `[SendButton] Clicked! input: "${input}", disabled: ${isDisabled}`,
        );
        event.preventDefault();
        if (!isDisabled) {
          console.log(`[SendButton] Calling submitForm`);
          submitForm();
        } else {
          console.log(
            `[SendButton] Button is disabled, not calling submitForm`,
          );
        }
      }}
      disabled={isDisabled}
    >
      <div className="sm:hidden">
        <ArrowUpIcon size={12} />
      </div>
      <div className="hidden sm:block md:hidden">
        <ArrowUpIcon size={14} />
      </div>
      <div className="hidden md:block">
        <ArrowUpIcon size={16} />
      </div>
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.status !== nextProps.status) return false;
  return true;
});

// Helper function to sanitize UI messages
function sanitizeUIMessages(messages: Array<UIMessage>): Array<UIMessage> {
  return messages.map((message) => ({
    ...message,
    parts: message.parts || [],
  }));
}
