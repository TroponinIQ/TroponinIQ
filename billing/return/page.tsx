'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircleIcon, LoaderIcon, AlertCircleIcon } from 'lucide-react';
import Link from 'next/link';

export default function BillingReturnPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Give the session time to load and any webhooks to process
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (session) {
      router.push('/chat/new-chat');
    } else {
      router.push('/login');
    }
  };

  // Show loading while checking session
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center">
              <LoaderIcon className="size-6 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Processing Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              We&apos;re updating your billing information. This may take a moment.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if something went wrong
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertCircleIcon className="size-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              {error}
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={handleContinue} className="w-full">
                Continue to Chat
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">
                  Sign In Again
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success message
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircleIcon className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">All Set!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            Your billing settings have been updated successfully.
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleContinue} className="w-full">
              {session ? 'Continue to Chat' : 'Sign In'}
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 