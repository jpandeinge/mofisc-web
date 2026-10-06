// src/types/auth.ts

import { User, Session, WeakPassword } from '@supabase/supabase-js';

export type AuthStatus = 'IDLE' | 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

export interface AuthUser extends User {
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_type: 'individual' | 'organisation';
  full_name: string;
  email: string;
  phone?: string;  // Changed from string | null | undefined
  profile_picture?: string;  // Changed from string | null | undefined
  preferences?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  organisation_id?: string | null;
  organisation_name?: string;
  organisation_slug?: string;
  organisation_role?: 'owner' | 'admin' | 'analyst' | 'member';
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends SignInCredentials {
  full_name: string;
  user_type: 'individual' | 'organisation';
  organisation_name?: string;
}

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  weakPassword?: WeakPassword;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<{ user: AuthUser | null; session: Session | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  isGoogleLinked: () => Promise<boolean>;
  linkGoogleAccount: () => Promise<void>;
  clearError: () => void;
}
