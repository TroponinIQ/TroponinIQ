'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Info,
  CheckCircle,
  Wrench,
  Megaphone,
  History,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  targetUsers?: 'all' | 'pro' | 'free';
  createdAt: Date;
}

interface SystemMessageHistoryDialogProps {
  children: React.ReactNode;
}

const messageTypeConfig = {
  update: {
    icon: CheckCircle,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Update',
  },
  feature: {
    icon: Megaphone,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'New Feature',
  },
  maintenance: {
    icon: Wrench,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Maintenance',
  },
  error: {
    icon: AlertTriangle,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-destructive dark:text-destructive',
    iconBg: 'bg-destructive/10 dark:bg-destructive/10',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Service Issue',
  },
  announcement: {
    icon: Info,
    color: 'bg-card dark:bg-card border-border dark:border-border',
    iconColor: 'text-muted-foreground dark:text-muted-foreground',
    iconBg: 'bg-muted dark:bg-muted',
    titleColor: 'text-foreground dark:text-foreground',
    typeLabel: 'Announcement',
  },
};

export function SystemMessageHistoryDialog({
  children,
}: SystemMessageHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAllMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/system-messages?history=true');
      const data = await response.json();

      if (response.ok && data.success) {
        const parsedMessages = data.messages.map((msg: any) => ({
          ...msg,
          startDate: msg.startDate ? new Date(msg.startDate) : undefined,
          endDate: msg.endDate ? new Date(msg.endDate) : undefined,
          createdAt: new Date(msg.createdAt),
        }));
        setMessages(parsedMessages);
      } else {
        toast.error(data.message || 'Failed to load system message history');
      }
    } catch (error) {
      console.error('Error fetching system message history:', error);
      toast.error('Failed to load system message history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAllMessages();
    }
  }, [open]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const MessageItem = ({ message }: { message: SystemMessage }) => {
    const typeConfig = messageTypeConfig[message.type];
    const Icon = typeConfig.icon;

    const getPriorityBadgeVariant = (priority: string) => {
      switch (priority) {
        case 'critical':
          return 'destructive';
        case 'high':
          return 'default';
        case 'medium':
          return 'secondary';
        default:
          return 'outline';
      }
    };

    return (
      <Card
        className={cn('mb-3 transition-all hover:shadow-sm', typeConfig.color)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div
              className={cn('flex-shrink-0 p-2 rounded-lg', typeConfig.iconBg)}
            >
              <Icon className={cn('h-4 w-4', typeConfig.iconColor)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={cn(
                    'font-medium text-sm leading-5',
                    typeConfig.titleColor,
                  )}
                >
                  {message.title}
                </h3>
                <div className="flex gap-1 flex-wrap">
                  <Badge variant="outline" className="text-xs font-normal">
                    {typeConfig.typeLabel}
                  </Badge>
                  {message.priority !== 'low' && (
                    <Badge
                      variant={getPriorityBadgeVariant(message.priority)}
                      className="text-xs font-normal"
                    >
                      {message.priority.charAt(0).toUpperCase() +
                        message.priority.slice(1)}
                    </Badge>
                  )}
                  {!message.isActive && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>

              {/* Message content */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {message.content}
              </p>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{formatDate(message.createdAt)}</span>
                {message.startDate && message.endDate && (
                  <span className="text-right">
                    Active: {formatDate(message.startDate)} -{' '}
                    {formatDate(message.endDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-5" />
            System Message History
          </DialogTitle>
          <DialogDescription>
            View all system messages and announcements from the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <Card key={`loading-skeleton-${Date.now()}-${i}`}>
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-5 w-5 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-16" />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No system messages</h3>
              <p className="text-muted-foreground">
                No system messages have been created yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {messages.length} message{messages.length !== 1 ? 's' : ''}{' '}
                  found
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAllMessages}
                  disabled={isLoading}
                  className="h-8"
                >
                  <RefreshCw
                    className={cn('h-4 w-4', isLoading && 'animate-spin')}
                  />
                </Button>
              </div>

              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
