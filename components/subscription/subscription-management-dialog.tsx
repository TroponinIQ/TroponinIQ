'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoaderIcon, CreditCardIcon, CalendarIcon, DollarSignIcon } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionData {
  hasAccess: boolean;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  priceId?: string;
}

interface SubscriptionManagementDialogProps {
  children: React.ReactNode;
}

export function SubscriptionManagementDialog({ children }: SubscriptionManagementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionData();
    }
  }, [isOpen]);

  const handleManageBilling = async () => {
    try {
      setIsManagingBilling(true);
      
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create portal session');
      }

      // Show success message and navigate to billing portal
      toast.success('Redirecting to billing portal...');
      
      // Navigate to billing portal (mobile-friendly)
      // Don't set loading to false here - let it stay active until navigation happens
      window.location.href = data.portalUrl;
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
      // Only set loading to false on error
      setIsManagingBilling(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsManagingBilling(true);

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
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
      // Only set loading to false on error
      setIsManagingBilling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCardIcon className="size-5" />
            Subscription Management
          </DialogTitle>
          <DialogDescription>
            Manage your subscription and billing settings
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoaderIcon className="size-6 animate-spin" />
            <span className="ml-2">Loading subscription data...</span>
          </div>
        ) : subscriptionData ? (
          <div className="space-y-4">
                         {subscriptionData.hasAccess ? (
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center justify-between text-lg">
                     Premium Subscription
                     <Badge className={getStatusColor(subscriptionData.status)}>
                       {subscriptionData.status}
                     </Badge>
                   </CardTitle>
                   <CardDescription>
                     Your active subscription details
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                     <DollarSignIcon className="size-4" />
                     <span>$29.99 / month</span>
                   </div>
                   
                   {subscriptionData.currentPeriodEnd && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <CalendarIcon className="size-4" />
                       <span>
                         {subscriptionData.cancelAtPeriodEnd 
                           ? `Ends on ${formatDate(subscriptionData.currentPeriodEnd)}`
                           : `Renews on ${formatDate(subscriptionData.currentPeriodEnd)}`
                         }
                       </span>
                     </div>
                   )}

                   {process.env.NODE_ENV === 'production' ? (
                     <div className="pt-2">
                       <Button
                         onClick={handleManageBilling}
                         disabled={isManagingBilling}
                         className="w-full"
                       >
                         {isManagingBilling ? (
                           <>
                             <LoaderIcon className="mr-2 size-4 animate-spin" />
                             Opening...
                           </>
                         ) : (
                           'Manage Billing'
                         )}
                       </Button>
                     </div>
                   ) : (
                     <div className="pt-2 space-y-2">
                       <div className="text-xs text-muted-foreground text-center">
                         Development Mode - Billing management available in production
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                         <Button
                           variant="outline"
                           onClick={() => {
                             toast.info('In production, this would open the Stripe billing portal');
                           }}
                           className="w-full"
                           size="sm"
                         >
                           Preview Portal
                         </Button>
                         <Button
                           variant="destructive"
                           onClick={async () => {
                             try {
                               const response = await fetch('/api/dev/clear-subscription', {
                                 method: 'POST',
                               });
                               const data = await response.json();
                               if (data.success) {
                                 toast.success('Subscription cleared! Refreshing...');
                                 setTimeout(() => window.location.reload(), 1000);
                               } else {
                                 toast.error(data.message || 'Failed to clear subscription');
                               }
                             } catch (error) {
                               toast.error('Failed to clear subscription');
                             }
                           }}
                           className="w-full"
                           size="sm"
                         >
                           Clear Sub
                         </Button>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             ) : (
               <Card>
                 <CardHeader>
                   <CardTitle className="text-lg">Subscription Required</CardTitle>
                   <CardDescription>
                     Subscribe to access the AI chat platform
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-4">
                   <div className="text-sm text-muted-foreground">
                     <p>Your subscription includes:</p>
                     <ul className="list-disc list-inside mt-2 space-y-1">
                       <li>Unlimited AI conversations</li>
                       <li>Advanced AI models</li>
                       <li>Priority support</li>
                       <li>Chat history & exports</li>
                     </ul>
                   </div>

                   <div className="pt-2">
                     <Button
                       onClick={handleUpgrade}
                       disabled={isManagingBilling}
                       className="w-full"
                     >
                       {isManagingBilling ? (
                         <>
                           <LoaderIcon className="mr-2 size-4 animate-spin" />
                           Processing...
                         </>
                       ) : (
                         'Subscribe Now - $30/month'
                       )}
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Failed to load subscription data
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 