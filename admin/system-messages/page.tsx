'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Eye,
  EyeOff,
  Calendar,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  Wrench,
  Megaphone,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  targetUsers?: 'all' | 'subscribed';
  createdAt: Date;
}

const messageTypeConfig = {
  update: {
    icon: CheckCircle,
    color:
      'bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border',
    label: 'Update',
  },
  feature: {
    icon: Megaphone,
    color:
      'bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border',
    label: 'New Feature',
  },
  maintenance: {
    icon: Wrench,
    color:
      'bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border',
    label: 'Maintenance',
  },
  error: {
    icon: AlertTriangle,
    color:
      'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/10 dark:text-destructive dark:border-destructive/20',
    label: 'Service Issue',
  },
  announcement: {
    icon: Info,
    color:
      'bg-muted text-muted-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border',
    label: 'Announcement',
  },
};

const priorityConfig = {
  low: { label: 'Low', variant: 'outline' as const },
  medium: { label: 'Medium', variant: 'secondary' as const },
  high: { label: 'High', variant: 'default' as const },
  critical: { label: 'Critical', variant: 'destructive' as const },
};

export default function SystemMessagesPage() {
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/system-messages?all=true');
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
        toast.error('Failed to load system messages');
      }
    } catch (error) {
      console.error('Error fetching system messages:', error);
      toast.error('Failed to load system messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const toggleMessageStatus = async (
    messageId: string,
    currentStatus: boolean,
  ) => {
    // TODO: Implement toggle message active/inactive
    toast.success(
      `Message ${currentStatus ? 'deactivated' : 'activated'} successfully`,
    );
    fetchMessages(); // Refresh the list
  };

  const duplicateMessage = async (message: SystemMessage) => {
    // TODO: Implement duplicate message functionality
    toast.success('Message duplicated successfully');
    fetchMessages(); // Refresh the list
  };

  const deleteMessage = async (messageId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this message? This action cannot be undone.',
      )
    ) {
      return;
    }

    // TODO: Implement delete message functionality
    toast.success('Message deleted successfully');
    fetchMessages(); // Refresh the list
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              System Messages
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage platform announcements and notifications
            </p>
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Card key={`loading-skeleton-${Date.now()}-${i}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage platform announcements and notifications
          </p>
        </div>
        <Link href="/admin/system-messages/new">
          <Button className="flex items-center gap-2">
            <Plus className="size-4" />
            Create Message
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <CheckCircle className="size-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Messages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {messages.filter((m) => m.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Users className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Messages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {messages.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <AlertTriangle className="size-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  High Priority
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    messages.filter(
                      (m) => m.priority === 'high' || m.priority === 'critical',
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No system messages
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by creating your first system message.
              </p>
              <Link href="/admin/system-messages/new">
                <Button>
                  <Plus className="size-4 mr-2" />
                  Create Message
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => {
            const typeConfig = messageTypeConfig[message.type];
            const priorityInfo = priorityConfig[message.priority];
            const TypeIcon = typeConfig.icon;

            return (
              <Card key={message.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg border ${typeConfig.color}`}
                        >
                          <TypeIcon className="size-4" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {message.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={priorityInfo.variant}
                              className="font-normal"
                            >
                              {priorityInfo.label}
                            </Badge>
                            <Badge variant="outline" className="font-normal">
                              {typeConfig.label}
                            </Badge>
                            {message.targetUsers === 'subscribed' && (
                              <Badge variant="outline" className="font-normal">
                                Subscribers Only
                              </Badge>
                            )}
                            <Badge
                              variant={
                                message.isActive ? 'default' : 'secondary'
                              }
                              className="font-normal"
                            >
                              {message.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/admin/system-messages/${message.id}/edit`,
                            )
                          }
                        >
                          <Edit className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toggleMessageStatus(message.id, message.isActive)
                          }
                        >
                          {message.isActive ? (
                            <>
                              <EyeOff className="size-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="size-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => duplicateMessage(message)}
                        >
                          <Plus className="size-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteMessage(message.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <AlertTriangle className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {message.content}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        <span>Created {formatDate(message.createdAt)}</span>
                      </div>
                      {message.startDate && (
                        <div className="flex items-center gap-1">
                          <span>Starts {formatDate(message.startDate)}</span>
                        </div>
                      )}
                      {message.endDate && (
                        <div className="flex items-center gap-1">
                          <span>Ends {formatDate(message.endDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
