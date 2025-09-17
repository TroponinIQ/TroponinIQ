import type { CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Document } from '@/lib/db/types';
import { ChatSDKError, type ErrorCode } from './errors';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

/**
 * THE UNIFIED profile completion calculation for the entire app
 * This ensures consistent percentages across ALL components
 */
export function calculateProfileCompletion(profile: any): number {
  if (!profile) return 0;

  // REQUIRED profile fields that count toward completion - EQUAL WEIGHT
  // These are the essential fields needed for effective coaching
  const requiredFields = [
    'preferred_name',
    'age',
    'weight_lbs',
    'height_feet',
    'height_inches',
    'gender',
    'current_activity_level',
    'primary_goal',
    'years_training',
    'current_diet',
    'target_weight_lbs',
    'timeline_weeks',
  ];

  // OPTIONAL profile fields - these don't count toward completion
  // Users shouldn't need to enter "none" for fields that don't apply
  const optionalFields = [
    'training_time_preference', // Helpful but not essential
    'dietary_restrictions', // Many users have none
    'supplement_stack', // Not everyone takes supplements
    'health_conditions', // Many users have none
    'additional_notes', // Supplementary information
    'body_fat_percentage', // Hard to measure, optional
  ];

  const completedFields = requiredFields.filter((field) => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  }).length;

  return Math.round((completedFields / requiredFields.length) * 100);
}
