import Stripe from 'stripe';
import { adminDb } from './firebase/admin';
import type { Subscription, CheckoutSession, User } from './db/types';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Stripe
let stripe: Stripe | null = null;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    });
  }
} catch (error) {
  console.warn('[Subscription] Stripe initialization failed:', error);
}

/**
 * Check if a user has active access to the chat
 */
export async function getUserAccess(userId: string): Promise<boolean> {
  try {
    // TEMPORARY: For development without webhooks, grant access to all authenticated users
    // Commented out to test actual subscription logic
    // if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_WEBHOOK_SECRET) {
    //   return true;
    // }

    // Get user's active subscription
    const subscription = await getActiveSubscription(userId);
    
    if (!subscription) {
      return false;
    }

    // Check if subscription is active and current period hasn't ended
    const isActive = subscription.status === 'active' && 
                    subscription.currentPeriodEnd.toMillis() > Date.now();

    return isActive;
  } catch (error) {
    console.error(`[Subscription] Error checking user access for ${userId}:`, error);
    return false;
  }
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  try {
    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    const subscriptionsRef = adminDb.collection('Subscriptions');
    
    // First get all subscriptions for the user
    const snapshot = await subscriptionsRef
      .where('userId', '==', userId)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    // Filter and sort in memory to avoid complex index requirements
    const activeSubscriptions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Subscription))
      .filter(sub => ['active', 'past_due'].includes(sub.status))
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    if (activeSubscriptions.length === 0) {
      return null;
    }
    
    return activeSubscriptions[0];
  } catch (error) {
    console.error(`[Subscription] Error getting active subscription for ${userId}:`, error);
    return null;
  }
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(userId: string, priceId: string): Promise<string> {
  try {
    console.log(`[Subscription] Creating checkout session for user: ${userId}, price: ${priceId}`);

    if (!stripe) {
      throw new Error('Stripe not initialized. Please check STRIPE_SECRET_KEY environment variable.');
    }

    if (!adminDb) {
      throw new Error('Firebase Admin not initialized');
    }

    // Get user details
    const userDoc = await adminDb.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const user = userDoc.data() as User;
    let customerId = user.stripeCustomerId;

    // Create Stripe customer if doesn't exist or if existing customer is invalid
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
          userEmail: user.email, // Backup for identification
          createdAt: new Date().toISOString(),
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await adminDb.collection('Users').doc(userId).update({
        stripeCustomerId: customerId,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Verify the customer exists in the current Stripe environment and has proper metadata
      try {
        const existingCustomer = await stripe.customers.retrieve(customerId);
        
        // Check if customer exists and has userId metadata, if not, update it
        if (!existingCustomer.deleted && !existingCustomer.metadata?.userId) {
          console.log(`[Subscription] Customer ${customerId} missing userId metadata, updating...`);
          await stripe.customers.update(customerId, {
            metadata: {
              ...existingCustomer.metadata,
              userId: userId,
              userEmail: user.email,
              updatedAt: new Date().toISOString(),
            },
          });
          console.log(`[Subscription] Updated customer metadata with userId: ${userId}`);
        }
      } catch (error: any) {
        // If customer doesn't exist (e.g., test mode customer in live environment), create a new one
        if (error.code === 'resource_missing') {
          console.warn(`[Subscription] Customer ${customerId} not found in current Stripe environment. This usually happens when switching between test/live modes.`);
          console.warn(`[Subscription] Creating new customer for user ${userId} (${user.email})`);
          
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userId: userId,
              // Keep track of the old customer ID for reference
              previousCustomerId: customerId,
            },
          });
          customerId = customer.id;

          // Update user with new Stripe customer ID and keep old one for reference
          await adminDb.collection('Users').doc(userId).update({
            stripeCustomerId: customerId,
            // Store the old customer ID for reference/recovery
            previousStripeCustomerId: user.stripeCustomerId,
            updatedAt: Timestamp.now(),
          });
          
          console.log(`[Subscription] Updated user ${userId} with new customer ID: ${customerId}`);
        } else {
          throw error;
        }
      }
    }

    // Use BASE_URL environment variable if available, otherwise fall back to the original logic
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://www.troponiniq.com' 
        : 'http://localhost:3000');

    // Create checkout session with Stripe-native promotion codes
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancelled`,
      allow_promotion_codes: true, // Enable Stripe's native coupon field
      metadata: {
        userId: userId,
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Store checkout session in Firestore
    const checkoutData: Omit<CheckoutSession, 'id'> = {
      userId,
      stripeSessionId: session.id,
      priceId,
      amount: session.amount_total || 0,
      status: session.status as CheckoutSession['status'],
      createdAt: Timestamp.now(),
    };

    await adminDb.collection('checkoutSessions').doc(session.id).set(checkoutData);

    console.log(`[Subscription] Created checkout session: ${session.id}`);
    return session.url || '';
  } catch (error) {
    console.error(`[Subscription] Error creating checkout session:`, error);
    throw error;
  }
}

/**
 * Create a customer portal session for managing subscriptions
 */
export async function createPortalSession(customerId: string): Promise<string> {
  try {
    if (!stripe) {
      throw new Error('Stripe not initialized. Please check STRIPE_SECRET_KEY environment variable.');
    }

    // Verify the customer exists in the current Stripe environment
    try {
      await stripe.customers.retrieve(customerId);
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        throw new Error(`Customer ${customerId} not found in current Stripe environment. Please contact support.`);
      }
      throw error;
    }

    // Use BASE_URL environment variable if available, otherwise fall back to the original logic
    const baseUrl = process.env.BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://www.troponiniq.com' 
        : 'http://localhost:3000');

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/billing/return`,
    });

    return session.url;
  } catch (error) {
    console.error(`[Subscription] Error creating portal session:`, error);
    throw error;
  }
}

/**
 * Get user's subscription status for display
 */
export async function getUserSubscriptionStatus(userId: string) {
  try {
    const subscription = await getActiveSubscription(userId);
    
    if (!subscription) {
      return {
        hasAccess: false,
        status: 'none',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const hasAccess = subscription.status === 'active' && 
                     subscription.currentPeriodEnd.toMillis() > Date.now();

    return {
      hasAccess,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error(`[Subscription] Error getting subscription status:`, error);
    return {
      hasAccess: false,
      status: 'error',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
} 