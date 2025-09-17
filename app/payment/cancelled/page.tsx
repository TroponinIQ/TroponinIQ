'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircleIcon } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <XCircleIcon className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled and no charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            You can try again anytime. Your account remains unchanged.
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/chat/new-chat">
                Return to Chat
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/#upgrade">
                Try Again
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 