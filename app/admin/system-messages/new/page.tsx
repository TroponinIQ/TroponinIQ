'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import Link from 'next/link';
import { SystemMessageBanner } from '@/components/system/system-message-banner';

interface FormData {
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetUsers: 'all' | 'subscribed';
  startDate: string;
  endDate: string;
}

const initialFormData: FormData = {
  title: '',
  content: '',
  type: 'announcement',
  priority: 'medium',
  targetUsers: 'all',
  startDate: '',
  endDate: '',
};

export default function NewSystemMessagePage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.title.trim()) {
      return 'Title is required';
    }
    if (!formData.content.trim()) {
      return 'Content is required';
    }
    if (formData.title.length > 100) {
      return 'Title must be 100 characters or less';
    }
    if (formData.content.length > 1000) {
      return 'Content must be 1000 characters or less';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      return 'End date must be after start date';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type,
        priority: formData.priority,
        targetUsers: formData.targetUsers,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      const response = await fetch('/api/admin/system-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('System message created successfully!');
        router.push('/admin/system-messages');
      } else {
        toast.error(data.message || 'Failed to create system message');
      }
    } catch (error) {
      console.error('Error creating system message:', error);
      toast.error('Failed to create system message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
  };

  // Create a mock message for preview
  const previewMessage = {
    id: 'preview',
    title: formData.title || 'Your message title',
    content: formData.content || 'Your message content will appear here',
    type: formData.type,
    priority: formData.priority,
    isActive: true,
    targetUsers: formData.targetUsers,
    createdAt: new Date(),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/system-messages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4 mr-2" />
              Back to Messages
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create System Message</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create a new announcement for your users
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2"
        >
          <Eye className="size-4" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">Message Preview</CardTitle>
            <CardDescription className="text-blue-600 dark:text-blue-400">
              This is how your message will appear to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemMessageBanner 
              message={previewMessage}
              onDismiss={() => {}} // Preview doesn't need real dismiss functionality
            />
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Details</CardTitle>
                <CardDescription>
                  Basic information about your system message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Welcome to TroponinIQ!"
                    maxLength={100}
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.title.length}/100 characters
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write your message content here..."
                    maxLength={1000}
                    rows={6}
                    required
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {formData.content.length}/1000 characters
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduling (Optional)</CardTitle>
                <CardDescription>
                  When should this message be shown to users?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      Leave empty to show immediately
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      Leave empty to show indefinitely
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Settings</CardTitle>
                <CardDescription>
                  Configure how your message appears and behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="type">Message Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: typeof formData.type) => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">📢 Announcement</SelectItem>
                      <SelectItem value="update">🔄 Update</SelectItem>
                      <SelectItem value="feature">✨ Feature</SelectItem>
                      <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
                      <SelectItem value="error">⚠️ Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: typeof formData.priority) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🔵 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="critical">🔴 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetUsers">Target Audience</Label>
                  <Select
                    value={formData.targetUsers}
                    onValueChange={(value: typeof formData.targetUsers) => handleInputChange('targetUsers', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">👥 All Users</SelectItem>
                      <SelectItem value="subscribed">💎 Subscribers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>
                  Use a template to get started faster
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      title: "🎉 Thank You for Launching With Us!",
                      content: "🎉 Thank you for being an early adopter of TroponinIQ! We've resolved today's launch hiccups and are now running smoothly.\n\n💪 Get personalized nutrition advice: Complete your profile with your goals, dietary preferences, and health info for responses tailored specifically to you!\n\nWe're confident TroponinIQ will exceed your expectations. Stay tuned—we're constantly updating with new features!",
                      type: "announcement",
                      priority: "medium"
                    });
                  }}
                >
                  Launch Day Message
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      title: "🛠️ Scheduled Maintenance",
                      content: "We'll be performing scheduled maintenance tonight from 11 PM to 1 AM EST. You may experience brief interruptions. Thank you for your patience!",
                      type: "maintenance",
                      priority: "medium"
                    });
                  }}
                >
                  Maintenance Notice
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      title: "✨ New Feature Released",
                      content: "We've just released an exciting new feature! Check out the latest updates in your dashboard.",
                      type: "feature",
                      priority: "low"
                    });
                  }}
                >
                  Feature Announcement
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Link href="/admin/system-messages">
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Save className="size-4" />
            {isLoading ? 'Creating...' : 'Create Message'}
          </Button>
        </div>
      </form>
    </div>
  );
} 