import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug logging for environment variables
console.log('[Supabase] Environment check:', {
  url: supabaseUrl ? 'SET' : 'MISSING',
  anonKey: supabaseAnonKey ? 'SET' : 'MISSING',
  serviceKey: supabaseServiceRoleKey ? 'SET' : 'MISSING',
});

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Client-side Supabase client (with Row Level Security)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (bypasses Row Level Security)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database types will be generated here later
export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          dietary_preferences: string | null;
          goals: string | null;
          allergies: string | null;
          current_weight: number | null;
          target_weight: number | null;
          activity_level: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dietary_preferences?: string | null;
          goals?: string | null;
          allergies?: string | null;
          current_weight?: number | null;
          target_weight?: number | null;
          activity_level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dietary_preferences?: string | null;
          goals?: string | null;
          allergies?: string | null;
          current_weight?: number | null;
          target_weight?: number | null;
          activity_level?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_memory: {
        Row: {
          id: string;
          user_id: string;
          memory_type: 'preference' | 'fact' | 'goal' | 'progress' | 'context';
          content: string;
          importance_score: number;
          source_chat_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          memory_type: 'preference' | 'fact' | 'goal' | 'progress' | 'context';
          content: string;
          importance_score?: number;
          source_chat_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          memory_type?: 'preference' | 'fact' | 'goal' | 'progress' | 'context';
          content?: string;
          importance_score?: number;
          source_chat_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversation_summaries: {
        Row: {
          id: string;
          user_id: string;
          chat_id: string;
          summary: string;
          key_points: string[];
          topics: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          chat_id: string;
          summary: string;
          key_points?: string[];
          topics?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          chat_id?: string;
          summary?: string;
          key_points?: string[];
          topics?: string[];
          created_at?: string;
        };
      };
    };
  };
};
