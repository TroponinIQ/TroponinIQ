'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Plus,
  Settings,
  ArrowLeft,
} from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage system-wide announcements and notifications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Chat
            </Button>
          </Link>
          <Link href="/admin/system-messages/new">
            <Button className="gap-2">
              <Plus className="size-4" />
              New System Message
            </Button>
          </Link>
        </div>
      </div>

      {/* System Messages Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Messages Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              System Messages
            </CardTitle>
            <CardDescription>
              Create and manage system-wide announcements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/system-messages">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Settings className="size-4" />
                Manage System Messages
              </Button>
            </Link>
            
            <Link href="/admin/system-messages/new">
              <Button className="w-full justify-start gap-2">
                <Plus className="size-4" />
                Create New Message
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Quick guide to using the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">System Messages</h4>
              <p className="text-sm text-muted-foreground">
                Create announcements that will be displayed to users across the platform. 
                Messages can be targeted to specific user groups and scheduled for activation.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Navigation</h4>
              <p className="text-sm text-muted-foreground">
                Use the &quot;Back to Chat&quot; button to return to the main application at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="size-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-200">
                Admin Dashboard v1
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Currently supports system message management. Additional admin features will be added in future updates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 