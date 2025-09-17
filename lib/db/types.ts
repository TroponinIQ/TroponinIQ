// Firestore-compatible types to replace Drizzle schema imports
import type { Timestamp } from 'firebase-admin/firestore';

// Local type definitions
export interface User {
  id: string;
  email: string;
  password?: string | null;
  displayName?: string;
  displayImage?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Magic link fields
  magicLinkToken?: string | null;
  magicLinkExpires?: Timestamp | null;
  magicLinkUsed?: boolean;
  lastMagicLinkSent?: Timestamp | null;
  magicLinkCount?: number; // For rate limiting
  // Stripe fields
  stripeCustomerId?: string;
  previousStripeCustomerId?: string;
  activeSubscriptionId?: string;
}

// Subscription-related types
export interface Subscription {
  id?: string;
  userId: string;
  userEmail: string; // ✅ Add email for easier tracking
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status:
    | 'active'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'past_due'
    | 'trialing'
    | 'unpaid';
  priceId: string;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CheckoutSession {
  id?: string;
  userId: string;
  stripeSessionId: string;
  priceId: string;
  amount: number;
  status: 'complete' | 'expired' | 'open';
  createdAt: Timestamp;
}

export interface StripeEvent {
  id?: string;
  stripeEventId?: string;
  type: string;
  payload?: any; // Store the entire Stripe event object
  processed: boolean;
  createdAt: Timestamp;
  errorMessage?: string;
  retryCount?: number;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  label?: string; // Folder label - defaults to "General" if not set
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface DBMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'data' | 'tool';
  content: string; // Keep for backward compatibility
  parts?: Array<{ type: string; text: string }>; // New UI format
  attachments?: any[]; // For future use
  createdAt: Timestamp;
}

export interface Document {
  id: string;
  createdAt: Timestamp;
  title: string;
  content?: string;
  kind: 'text' | 'code' | 'image' | 'sheet';
  userId: string;
}

export interface Suggestion {
  id: string;
  documentId: string;
  documentCreatedAt: Timestamp;
  originalText: string;
  suggestedText: string;
  description?: string;
  isResolved: boolean;
  userId: string;
  createdAt: Timestamp;
}

export interface Vote {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}

export interface Stream {
  id: string;
  chatId: string;
  createdAt: Timestamp;
}

export interface Feedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  userAgent?: string;
  url?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  userEmail?: string; // For guest users or manual entry
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// System Messages for platform-wide announcements
export interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  startDate?: Timestamp; // When to start showing the message
  endDate?: Timestamp; // When to stop showing the message
  targetUsers?: 'all' | 'subscribed'; // Who should see this message
  createdBy: string; // Admin user ID who created this
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Track which users have dismissed which system messages
export interface SystemMessageDismissal {
  id: string;
  userId: string;
  messageId: string;
  dismissedAt: Timestamp;
}

export interface PromotionCode {
  id?: string;
  stripePromotionCodeId: string;
  code: string;
  intendedEmail: string;
  clientName?: string;
  campaign: string;
  isRedeemed: boolean;
  redeemedBy?: string; // user ID who redeemed
  redeemedEmail?: string; // email of user who redeemed
  redeemedAt?: Timestamp;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  metadata?: Record<string, string>;
}

export interface PromotionCodeRedemption {
  id?: string;
  sessionId: string;
  userId: string;
  userEmail: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  redeemedAt: Timestamp;
  metadata?: Record<string, any>;
}
