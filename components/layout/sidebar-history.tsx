'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState, Component, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/types';
import { fetcher } from '@/lib/utils';
import { ChatItem } from './sidebar-history-item';
import useSWRInfinite from 'swr/infinite';
import { LoaderIcon } from '../common/icons';

// Simple error boundary component
class SidebarHistoryErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(
      '[SidebarHistory] Error boundary caught error:',
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-2 text-red-500 w-full flex flex-col justify-center items-center text-sm gap-2">
              <div>Error loading chat history</div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-xs underline"
              >
                Refresh page
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return this.props.children;
  }
}

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 50;

export const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      // Handle both Firestore Timestamp and regular Date/string formats
      let chatDate: Date;
      if (
        chat.createdAt &&
        typeof chat.createdAt === 'object' &&
        'toDate' in chat.createdAt
      ) {
        // Firestore Timestamp
        chatDate = (chat.createdAt as any).toDate();
      } else {
        // Regular Date or string
        chatDate = new Date(chat.createdAt);
      }

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory,
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) return `/api/chat/history?limit=${PAGE_SIZE}`;

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) return null;

  return `/api/chat/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

// Safe wrapper for useSidebar that handles missing context during sign-out
function useSidebarSafe() {
  try {
    return useSidebar();
  } catch (error) {
    // If SidebarProvider is not available (e.g., during sign-out or initial render), return safe defaults
    // This is expected behavior, so no warning is needed
    return {
      open: false,
      setOpen: () => {},
      openMobile: false,
      setOpenMobile: () => {},
      isMobile: false,
      toggleSidebar: () => {},
      state: 'collapsed' as const,
    };
  }
}

export function SidebarHistory({
  user,
  hasAccess = true,
}: { user: User | undefined; hasAccess?: boolean }) {
  return (
    <SidebarHistoryErrorBoundary>
      <SidebarHistoryContent user={user} hasAccess={hasAccess} />
    </SidebarHistoryErrorBoundary>
  );
}

function SidebarHistoryContent({
  user,
  hasAccess = true,
}: { user: User | undefined; hasAccess?: boolean }) {
  const { setOpenMobile } = useSidebarSafe();
  const params = useParams();
  const id = params?.id as string;

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const hasReachedEnd =
    paginatedChatHistories && paginatedChatHistories.length > 0
      ? paginatedChatHistories[paginatedChatHistories.length - 1]?.hasMore ===
        false
      : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = async () => {
    const isCurrentChat = deleteId === id;

    console.log(
      `[SidebarHistory] Deleting chat ${deleteId}, current chat: ${id}`,
    );

    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to delete chat: ${response.statusText}`);
      }

      console.log(
        `[SidebarHistory] Successfully deleted chat ${deleteId}, updating cache`,
      );

      // Update the cache immediately with improved deduplication
      await mutate((chatHistories) => {
        if (chatHistories) {
          return chatHistories.map((chatHistory) => {
            const filteredChats = chatHistory.chats.filter(
              (chat) => chat.id !== deleteId,
            );
            return {
              ...chatHistory,
              chats: filteredChats,
            };
          });
        }
        return chatHistories;
      }, false); // false = don't revalidate, just update cache

      console.log(`[SidebarHistory] Cache updated after deleting ${deleteId}`);

      // If we're deleting the current chat, redirect immediately after successful deletion
      if (isCurrentChat) {
        console.log(
          `[SidebarHistory] Redirecting to new chat since current chat was deleted`,
        );
        router.push('/chat/new-chat');
        router.refresh(); // Force a refresh to clear any cached state
      }

      return response;
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: 'Chat deleted successfully',
      error: (error) => {
        console.error('Delete error:', error);
        return 'Failed to delete chat';
      },
    });

    setShowDeleteDialog(false);
  };

  if (!user) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to save and revisit previous chats!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!hasAccess) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-400 w-full flex flex-col justify-center items-center text-sm gap-2 opacity-50">
            <div className="text-center">🔒 Chat History</div>
            <div className="text-xs text-center text-zinc-500">
              Upgrade to Pro to access your chat history
            </div>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here once you start chatting!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {paginatedChatHistories &&
              (() => {
                // Flatten chats from all pages and deduplicate by ID to prevent React key conflicts
                const chatsFromHistory = paginatedChatHistories
                  .flatMap((paginatedChatHistory) => paginatedChatHistory.chats)
                  .filter((chat, index, array) => {
                    // Keep only the first occurrence of each chat ID
                    return array.findIndex((c) => c.id === chat.id) === index;
                  });

                console.log(
                  `[SidebarHistory] Rendering ${chatsFromHistory.length} deduplicated chats`,
                );

                const groupedChats = groupChatsByDate(chatsFromHistory);

                return (
                  <div className="flex flex-col gap-6">
                    {groupedChats.today.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Today
                        </div>
                        {groupedChats.today.map((chat) => (
                          <ChatItem
                            key={`today-${chat.id}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            mutateChatHistory={mutate}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.yesterday.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Yesterday
                        </div>
                        {groupedChats.yesterday.map((chat) => (
                          <ChatItem
                            key={`yesterday-${chat.id}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            mutateChatHistory={mutate}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.lastWeek.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Last 7 days
                        </div>
                        {groupedChats.lastWeek.map((chat) => (
                          <ChatItem
                            key={`lastWeek-${chat.id}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            mutateChatHistory={mutate}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.lastMonth.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Last 30 days
                        </div>
                        {groupedChats.lastMonth.map((chat) => (
                          <ChatItem
                            key={`lastMonth-${chat.id}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            mutateChatHistory={mutate}
                          />
                        ))}
                      </div>
                    )}

                    {groupedChats.older.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                          Older than last month
                        </div>
                        {groupedChats.older.map((chat) => (
                          <ChatItem
                            key={`older-${chat.id}`}
                            chat={chat}
                            isActive={chat.id === id}
                            onDelete={(chatId) => {
                              setDeleteId(chatId);
                              setShowDeleteDialog(true);
                            }}
                            setOpenMobile={setOpenMobile}
                            mutateChatHistory={mutate}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
          </SidebarMenu>

          {/* Remove auto-load trigger - require manual action */}

          {/* Manual Load More button - requires user action */}
          {!hasReachedEnd && !isValidating && (
            <div className="px-2 py-2 w-full flex justify-center">
              <button
                type="button"
                onClick={() => {
                  console.log(
                    '[SidebarHistory] User manually loading more chats...',
                  );
                  setSize((size) => size + 1);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded border border-border hover:bg-muted"
              >
                Load More Chats ({PAGE_SIZE} more)
              </button>
            </div>
          )}

          {isValidating && (
            <div className="p-2 text-zinc-500 dark:text-zinc-400 flex flex-row gap-2 items-center justify-center mt-2">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div className="text-xs">Loading...</div>
            </div>
          )}

          {hasReachedEnd && (
            <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2 mt-4">
              <div className="text-xs">End of chat history</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
