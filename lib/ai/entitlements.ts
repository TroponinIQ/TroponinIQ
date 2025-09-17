import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      'claude-4-sonnet',
      'claude-3.5-sonnet',
      'gpt-5-mini',
      'gpt-4o-mini',
      'gemini-2.5-flash',
      'chat-model', // Backwards compatibility
    ],
  },
};
