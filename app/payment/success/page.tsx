'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircleIcon, LoaderIcon } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    async function verifyPayment() {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }

      try {
        // Give Stripe webhooks a moment to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify the payment was processed
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setIsVerified(data.hasAccess);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyPayment();
  }, [sessionId]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <LoaderIcon className="size-8 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing Payment</h2>
              <p className="text-muted-foreground">
                Please wait while we verify your subscription...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircleIcon className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            {isVerified 
              ? "Your subscription is now active. Welcome to Premium!"
              : "Your payment was processed. Your subscription will be active shortly."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            {isVerified 
              ? "You now have unlimited access to all premium features. Start chatting with your AI coach!"
              : "If you don't see access immediately, please refresh the page in a few moments."
            }
          </div>
          
          <div className="flex flex-col space-y-2">

            
            <Button variant="outline" asChild className="w-full">
              <Link href="/chat/new-chat">
                Start Chatting
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <LoaderIcon className="size-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">
              Please wait while we load the page...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 