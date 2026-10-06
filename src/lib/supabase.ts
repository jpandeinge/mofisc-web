// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { logEvent } from '../utils/errorHandling';
import { sanitizeAuthRedirect } from '../utils/authRedirect';

// Environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

// Create Supabase client with configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for enhanced security
  },
  global: {
    headers: {
      'x-application-name': 'fisc',
    },
  },
  // Configure realtime subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type AuthCallbackFlow = 'signin' | 'link' | 'verify';

// Build a same-origin callback and keep the eventual destination constrained to app paths.
export const getOAuthRedirectUrl = (
  redirectTo?: string,
  flow: AuthCallbackFlow = 'signin'
) => {
  const callbackUrl = new URL('/auth/callback', window.location.origin);
  callbackUrl.searchParams.set('redirectTo', sanitizeAuthRedirect(redirectTo));

  if (flow !== 'signin') {
    callbackUrl.searchParams.set('flow', flow);
  }

  return callbackUrl.toString();
};

// Helper functions for session management
export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    logEvent('Failed to fetch session');
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    logEvent('Failed to fetch user');
    return null;
  }
};

// Type for handling Supabase errors
export interface SupabaseError {
  message: string;
  status?: number;
  details?: string;
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any): SupabaseError => {
  if (error.error_description) {
    return {
      message: error.error_description,
      status: error.status,
      details: error.message
    };
  }

  if (error.message) {
    return {
      message: error.message,
      status: error.status
    };
  }

  return {
    message: 'An unexpected error occurred',
    status: 500
  };
};

// Helper to check if OAuth account is already linked
export const isOAuthLinked = async (providerId: string): Promise<boolean> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;

    // Check if the user's identities include the provider
    if (user.identities) {
      return user.identities.some(identity => identity.provider === providerId);
    }

    return false;
  } catch (error) {
    logEvent('Failed to check OAuth links');
    return false;
  }
};
