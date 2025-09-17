import type { Chat } from '@/lib/db/types';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontalIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  XIcon,
} from '../common/icons';
import { memo, useState, useRef, useEffect } from 'react';
import { renameChatAction } from '@/app/(chat)/actions';
import { toast } from 'sonner';
import { mutate } from 'swr';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  mutateChatHistory,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  mutateChatHistory?: any; // The mutate function from useSWRInfinite
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    if (!editedTitle.trim() || editedTitle.trim() === chat.title) {
      setIsEditing(false);
      setEditedTitle(chat.title);
      return;
    }

    setIsRenaming(true);
    try {
      await renameChatAction({
        chatId: chat.id,
        title: editedTitle.trim(),
      });

      // Optimistically update the SWR cache immediately
      if (mutateChatHistory) {
        mutateChatHistory(
          (data: Array<{ chats: Chat[]; hasMore: boolean }> | undefined) => {
            if (!data || !Array.isArray(data)) return data;

            // Handle paginated data structure from useSWRInfinite
            return data.map((page) => ({
              ...page,
              chats: page.chats.map((c) =>
                c.id === chat.id ? { ...c, title: editedTitle.trim() } : c,
              ),
            }));
          },
          false, // Don't revalidate immediately, just update the cache
        );
      } else {
        // Fallback to global mutate if mutateChatHistory is not available
        mutate(
          (key) => typeof key === 'string' && key.includes('/api/chat/history'),
        );
      }

      toast.success('Chat renamed successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error renaming chat:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to rename chat',
      );
      setEditedTitle(chat.title);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle(chat.title);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <SidebarMenuItem>
      {isEditing ? (
        <div className="flex items-center gap-1 px-2 py-1">
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleRename}
            className="flex-1 bg-transparent border-none outline-none text-sm focus:ring-0 min-w-0"
            disabled={isRenaming}
            maxLength={100}
          />
          <button
            type="button"
            onClick={handleRename}
            disabled={isRenaming}
            className="p-1 hover:bg-sidebar-accent rounded opacity-60 hover:opacity-100"
          >
            <CheckIcon size={12} />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isRenaming}
            className="p-1 hover:bg-sidebar-accent rounded opacity-60 hover:opacity-100"
          >
            <XIcon size={12} />
          </button>
        </div>
      ) : (
        <SidebarMenuButton asChild isActive={isActive}>
          <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
            <span className="truncate">{chat.title}</span>
          </Link>
        </SidebarMenuButton>
      )}

      {!isEditing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
              showOnHover={!isActive}
            >
              <MoreHorizontalIcon />
              <span className="sr-only">More</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem
              onClick={() => setIsEditing(true)}
              className="cursor-pointer"
            >
              <EditIcon />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(chat.id)}
              className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            >
              <TrashIcon />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.chat.id !== nextProps.chat.id) return false;
  if (prevProps.chat.title !== nextProps.chat.title) return false;

  return true;
});
