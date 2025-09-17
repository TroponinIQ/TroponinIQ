'use client';

import type { Message } from 'ai';
import { Button } from '@/components/ui/button';
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { deleteMessagesAfterMessage } from '@/app/(chat)/actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { toast } from 'sonner';

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  chatId?: string;
  status?: UseChatHelpers['status'];
  isLastUserMessage?: boolean;
};

export function MessageEditor({
  message,
  setMode,
  setMessages,
  reload,
  chatId,
  status,
  isLastUserMessage = false,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [draftContent, setDraftContent] = useState<string>(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Smart disable logic: only block during streaming or when editing the last user message while submitted
  const isDisabled = isSubmitting || status === 'streaming' || (status === 'submitted' && isLastUserMessage);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
        disabled={isDisabled}
        placeholder={
          isDisabled && status === 'streaming' 
            ? 'Cannot edit while agent is responding...' 
            : isDisabled && status === 'submitted' && isLastUserMessage
            ? 'Please wait for agent response...'
            : 'Edit your message...'
        }
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          disabled={isDisabled}
          onClick={() => {
            setMode('view');
          }}
        >
          Cancel
        </Button>
        
        {chatId && (
          <Button
            data-testid="message-editor-save-button"
            variant="outline"
            className="h-fit py-2 px-3"
            disabled={isDisabled || draftContent.trim().length === 0}
            onClick={async () => {
              if (!draftContent.trim()) {
                toast.error('Message cannot be empty');
                return;
              }
              
              setIsSubmitting(true);
              
              try {
                console.log(`[MessageEditor] Saving message ${message.id} in chat ${chatId}`);
                const response = await fetch(`/api/chat/message?messageId=${message.id}&chatId=${chatId}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ content: draftContent.trim() }),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log(`[MessageEditor] Backend response:`, result);
                  
                  // Only update UI after successful backend save
                  setMessages((messages) => {
                    const index = messages.findIndex((m) => m.id === message.id);
                    if (index !== -1) {
                      const updatedMessage = {
                        ...message,
                        content: draftContent.trim(),
                        parts: [{ type: 'text' as const, text: draftContent.trim() }],
                      };
                      return [...messages.slice(0, index), updatedMessage, ...messages.slice(index + 1)];
                    }
                    return messages;
                  });
                  setMode('view');
                  toast.success('Message saved successfully');
                } else {
                  // Handle HTTP error responses
                  let errorMessage = `Failed to save message (${response.status})`;
                  try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                  } catch {
                    const errorText = await response.text();
                    console.error(`❌ Failed to save message. Status: ${response.status}, Response: ${errorText}`);
                  }
                  
                  console.error(`❌ Failed to save message:`, errorMessage);
                  toast.error(`${errorMessage}. Please try again.`);
                }
              } catch (error) {
                console.error(`[MessageEditor] Network error saving message ${message.id}:`, error);
                toast.error('Network error while saving message. Please check your connection and try again.');
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        )}
        
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isDisabled || draftContent.trim().length === 0}
          onClick={async () => {
            if (!chatId) {
              console.error('No chatId provided for message editing');
              toast.error('Error: No chat ID provided');
              return;
            }
            
            if (!draftContent.trim()) {
              toast.error('Message cannot be empty');
              return;
            }
            
            setIsSubmitting(true);
            
            try {
              // FIRST: Save the edited message to the database
              console.log(`[MessageEditor] Saving edited message ${message.id} in chat ${chatId}`);
              const saveResponse = await fetch(`/api/chat/message?messageId=${message.id}&chatId=${chatId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: draftContent.trim() }),
              });
              
              if (!saveResponse.ok) {
                // Handle HTTP error responses
                let errorMessage = `Failed to save edited message (${saveResponse.status})`;
                try {
                  const errorData = await saveResponse.json();
                  errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                  const errorText = await saveResponse.text();
                  console.error(`❌ Failed to save edited message. Status: ${saveResponse.status}, Response: ${errorText}`);
                }
                
                console.error(`❌ Failed to save edited message:`, errorMessage);
                toast.error(`${errorMessage}. Please try again.`);
                return;
              }
              
              const saveResult = await saveResponse.json();
              console.log(`[MessageEditor] Successfully saved edited message:`, saveResult);
              
              // SECOND: Delete trailing messages after this message ID (more reliable than timestamp)
              console.log(`[MessageEditor] Deleting trailing messages after message ${message.id} in chat ${chatId}`);
              
              const deletedCount = await deleteMessagesAfterMessage({
                chatId: chatId,
                messageId: message.id,
              });

              console.log(`[MessageEditor] Successfully deleted ${deletedCount} trailing messages`);

              // THIRD: Update local state with the edited message FIRST
              // @ts-expect-error todo: support UIMessage in setMessages
              setMessages((messages) => {
                const index = messages.findIndex((m) => m.id === message.id);

                if (index !== -1) {
                  const updatedMessage = {
                    ...message,
                    content: draftContent.trim(),
                    parts: [{ type: 'text', text: draftContent.trim() }],
                  };

                  return [...messages.slice(0, index), updatedMessage];
                }

                return messages;
              });

              setMode('view');
              toast.success('Message saved and regenerating response...');
              
              // FOURTH: Add a small delay to ensure cache invalidation propagates
              // This prevents the agent API from loading stale conversation history
              console.log(`[MessageEditor] Waiting for cache invalidation to propagate...`);
              await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
              
              // FIFTH: Now call reload() with the updated state
              // reload() should now use the edited message content
              console.log(`[MessageEditor] About to call reload() with chatId: ${chatId}`);
              console.log(`[MessageEditor] Current chat state before reload:`, { chatId, messageId: message.id });
              console.log(`[MessageEditor] Edited message content: "${draftContent.trim()}"`);
              
              // TODO: Add a way to indicate this is an edit scenario to the agent API
              // For now, reload() will use the improved regeneration detection logic
              reload();
            } catch (error) {
              console.error('Failed to save message and delete trailing messages:', error);
              if (error instanceof Error) {
                toast.error(`Error: ${error.message}`);
              } else {
                toast.error('Network error while saving message. Please check your connection and try again.');
              }
              // Keep editor open so user can try again
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send & Regenerate'}
        </Button>
      </div>
    </div>
  );
}
