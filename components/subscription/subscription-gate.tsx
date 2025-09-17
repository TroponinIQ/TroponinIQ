'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, LoaderIcon, TestTubeIcon } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionGateProps {
  userId: string;
}

export function SubscriptionGate({ userId }: SubscriptionGateProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingSubscription, setIsTestingSubscription] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      // Show success message and redirect to Stripe Checkout
      toast.success('Redirecting to checkout...');
      
      // Navigate to Stripe Checkout
      // Don't set loading to false here - let it stay active until navigation happens
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      // Only set loading to false on error
      setIsLoading(false);
    }
  };

  const handleTestSubscription = async () => {
    try {
      setIsTestingSubscription(true);

      const response = await fetch('/api/dev/simulate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to simulate subscription');
      }

      toast.success('Subscription simulated! Refreshing page...');
      
      // Refresh the page to update subscription status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error simulating subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to simulate subscription');
    } finally {
      setIsTestingSubscription(false);
    }
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <CheckIcon className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Get Started Today</CardTitle>
          <CardDescription>
            Get unlimited access to our AI-powered chat assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-4xl font-bold">$29.99</div>
            <div className="text-sm text-muted-foreground">per month</div>
            <Badge variant="secondary" className="mt-2">
              Cancel anytime
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckIcon className="size-4 text-green-500 shrink-0" />
              <span className="text-sm">Access 25+ years of coaching expertise</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckIcon className="size-4 text-green-500 shrink-0" />
              <span className="text-sm">Customizable profile</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckIcon className="size-4 text-green-500 shrink-0" />
              <span className="text-sm">Weekly feature updates</span>
            </div>
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoaderIcon className="mr-2 size-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Your Subscription'
            )}
          </Button>

          {isDevelopment && (
            <Button 
              variant="outline"
              className="w-full" 
              size="sm" 
              onClick={handleTestSubscription}
              disabled={isTestingSubscription}
            >
              {isTestingSubscription ? (
                <>
                  <LoaderIcon className="mr-2 size-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <TestTubeIcon className="mr-2 size-4" />
                  [DEV] Simulate Subscription
                </>
              )}
            </Button>
          )}

          <div className="text-center text-xs text-muted-foreground">
            Secure payment powered by Stripe
          </div>
        </CardContent>
      </Card>
  );
} 