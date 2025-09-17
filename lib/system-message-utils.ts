/**
 * Production-safe system message filtering utilities
 *
 * Key Safety Principles:
 * 1. Fail Open: If anything goes wrong, show the message (don't hide it)
 * 2. Comprehensive Logging: Log all decisions for debugging
 * 3. Multiple Fallbacks: Handle every possible edge case
 * 4. Feature Flag: Allow toggling/reverting in production
 */

interface SystemMessage {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'maintenance' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

interface FilteringContext {
  userId: string;
  userCreatedAt?: string | null;
  featureFlagEnabled?: boolean;
}

/**
 * Safely parse a date string or Date object
 * Returns null if invalid, which triggers fallback behavior
 */
function safeParseDate(dateValue: any): Date | null {
  try {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
      return Number.isNaN(dateValue.getTime()) ? null : dateValue;
    }

    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    // Handle Firestore Timestamp-like objects
    if (dateValue && typeof dateValue.toDate === 'function') {
      try {
        return dateValue.toDate();
      } catch {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.warn('[SystemMessage] Error parsing date:', { dateValue, error });
    return null;
  }
}

/**
 * Determines if a system message should be shown to a user based on their registration date
 *
 * Safety Rules:
 * 1. If feature flag is disabled, show all messages (old behavior)
 * 2. If user creation date is missing/invalid, show all messages
 * 3. If message creation date is missing/invalid, show the message
 * 4. If dates are valid but comparison fails, show the message
 * 5. Only hide messages if we're 100% certain they're older than user registration
 */
export function shouldShowSystemMessage(
  message: SystemMessage,
  context: FilteringContext,
): { shouldShow: boolean; reason: string } {
  const logContext = {
    messageId: message.id,
    userId: context.userId,
    messageCreatedAt: message.createdAt,
    userCreatedAt: context.userCreatedAt,
  };

  // Feature flag check - allow disabling this feature in production
  const featureFlagEnabled =
    context.featureFlagEnabled ??
    process.env.SYSTEM_MESSAGE_DATE_FILTERING_ENABLED === 'true';

  if (!featureFlagEnabled) {
    console.log(
      '[SystemMessage] Date filtering disabled via feature flag',
      logContext,
    );
    return { shouldShow: true, reason: 'feature_flag_disabled' };
  }

  // If user creation date is missing, show all messages (fail open)
  if (!context.userCreatedAt) {
    console.log(
      '[SystemMessage] User creation date missing, showing message',
      logContext,
    );
    return { shouldShow: true, reason: 'user_created_at_missing' };
  }

  // Parse user creation date safely
  const userCreatedDate = safeParseDate(context.userCreatedAt);
  if (!userCreatedDate) {
    console.warn(
      '[SystemMessage] Invalid user creation date, showing message',
      logContext,
    );
    return { shouldShow: true, reason: 'user_created_at_invalid' };
  }

  // Parse message creation date safely
  const messageCreatedDate = safeParseDate(message.createdAt);
  if (!messageCreatedDate) {
    console.warn(
      '[SystemMessage] Invalid message creation date, showing message',
      logContext,
    );
    return { shouldShow: true, reason: 'message_created_at_invalid' };
  }

  try {
    // Only hide messages that were created BEFORE the user registered
    // If message was created AFTER user registration, show it
    const shouldShow = messageCreatedDate >= userCreatedDate;

    const reason = shouldShow
      ? 'message_after_user_registration'
      : 'message_before_user_registration';

    console.log('[SystemMessage] Date comparison result:', {
      ...logContext,
      messageCreatedDate: messageCreatedDate.toISOString(),
      userCreatedDate: userCreatedDate.toISOString(),
      shouldShow,
      reason,
    });

    return { shouldShow, reason };
  } catch (error) {
    // If date comparison fails for any reason, show the message (fail open)
    console.error('[SystemMessage] Error comparing dates, showing message', {
      ...logContext,
      error,
    });
    return { shouldShow: true, reason: 'date_comparison_error' };
  }
}

/**
 * Filters an array of system messages for a specific user
 * Applies the same safety principles as shouldShowSystemMessage
 */
export function filterSystemMessagesForUser(
  messages: SystemMessage[],
  context: FilteringContext,
): {
  filteredMessages: SystemMessage[];
  filteringSummary: {
    totalMessages: number;
    shownMessages: number;
    hiddenMessages: number;
    reasons: Record<string, number>;
  };
} {
  if (!Array.isArray(messages)) {
    console.warn(
      '[SystemMessage] Invalid messages array, returning empty array',
    );
    return {
      filteredMessages: [],
      filteringSummary: {
        totalMessages: 0,
        shownMessages: 0,
        hiddenMessages: 0,
        reasons: { invalid_input: 1 },
      },
    };
  }

  const reasons: Record<string, number> = {};
  const filteredMessages: SystemMessage[] = [];

  for (const message of messages) {
    const { shouldShow, reason } = shouldShowSystemMessage(message, context);

    reasons[reason] = (reasons[reason] || 0) + 1;

    if (shouldShow) {
      filteredMessages.push(message);
    }
  }

  const summary = {
    totalMessages: messages.length,
    shownMessages: filteredMessages.length,
    hiddenMessages: messages.length - filteredMessages.length,
    reasons,
  };

  console.log('[SystemMessage] Filtering summary:', {
    userId: context.userId,
    ...summary,
  });

  return { filteredMessages, filteringSummary: summary };
}

/**
 * Environment variable to enable/disable the new filtering behavior
 * Set SYSTEM_MESSAGE_DATE_FILTERING_ENABLED=true to enable
 * Defaults to false for safety
 */
export function isDateFilteringEnabled(): boolean {
  return process.env.SYSTEM_MESSAGE_DATE_FILTERING_ENABLED === 'true';
}
