// src/context/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, getOAuthRedirectUrl, isOAuthLinked } from '../lib/supabase';
import { AuthContextType, AuthError, AuthState, AuthUser } from '../types/auth';

const INITIAL_STATE: AuthState = {
  status: 'IDLE',
  user: null,
  session: null,
  loading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const rememberAuthProvider = (provider: 'email' | 'google') => {
  try {
    localStorage.setItem('last_auth_provider', provider);
  } catch {
    // Remembering the convenience hint must never fail authentication.
  }
};

// Reset global authentication state
const resetGlobalAuth = () => {
  try {
    localStorage.removeItem('had_session');
    localStorage.removeItem('is_session_restored');
    localStorage.removeItem('financialHealthContext');

    // Clear user-scoped caches without deleting device identity, theme, or the
    // remembered sign-in method. Those values belong to the browser, not a user.
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('mofisc_user_profile_') || key.includes('_cache')) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Supabase still removes its in-memory session when browser storage is unavailable.
  }

  // Session storage contains user-scoped API responses, encryption keys, and
  // device-check state. Clear it centrally for every sign-out entry point.
  try {
    sessionStorage.clear();
  } catch {
    // Restricted storage must not prevent the sign-out state transition.
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          if (session?.user) {
            // This is a session restoration, not a new sign-in
            // Flag this state differently from an active sign-in
            localStorage.setItem('is_session_restored', 'true');

            setState({
              status: 'AUTHENTICATED',
              user: session.user as AuthUser,
              session,
              loading: false,
              error: null
            });
          } else {
            setState({
              ...INITIAL_STATE,
              status: 'UNAUTHENTICATED'
            });
          }
        }
      } catch (error) {
        if (mounted) {
          setState({
            ...INITIAL_STATE,
            status: 'UNAUTHENTICATED',
            error: mapError(error)
          });
        }
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session?.user) {
          // If this is a new sign-in (not a session restoration)
          // we don't need to set any special flag as the sign-in was active
          setState({
            status: 'AUTHENTICATED',
            user: session.user as AuthUser,
            session,
            loading: false,
            error: null
          });
        } else {
          setState({
            ...INITIAL_STATE,
            status: 'UNAUTHENTICATED'
          });
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      rememberAuthProvider('email');

      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: getOAuthRedirectUrl('/app', 'verify'),
        },
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No user data returned from signup');
      }

      // UserContext owns profile creation after authentication. Keeping that
      // write in one place avoids an RLS failure before email verification and
      // prevents duplicate inserts when sign-up immediately returns a session.

      rememberAuthProvider('email');

      return { requiresEmailConfirmation: !data.session };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const signOut = useCallback(async () => {
    let signOutError: unknown = null;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // A normal sign-out should only end this browser session. Supabase's
      // default is global, which would unexpectedly revoke every device.
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        signOutError = error;
      }
    } catch (error) {
      signOutError = error;
    } finally {
      resetGlobalAuth();
      setState({
        ...INITIAL_STATE,
        status: 'UNAUTHENTICATED',
        loading: false
      });
    }

    if (signOutError) {
      throw signOutError;
    }
  }, []);

  const verifyEmail = useCallback(async (token: string): Promise<{ user: AuthUser | null; session: Session | null }> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Try to verify the token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        // If OTP verification fails, try to exchange the token for a session
        // This handles the case where the token is an access token
        try {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            throw sessionError;
          }

          if (sessionData?.session) {
            // We have a session, so the verification is successful
            setState(prev => ({
              ...prev,
              status: 'AUTHENTICATED',
              user: sessionData.session.user as AuthUser,
              session: sessionData.session,
              loading: false,
              error: null
            }));

            return {
              user: sessionData.session.user as AuthUser,
              session: sessionData.session
            };
          }
        } catch (sessionError) {
          // Session fallback failed
        }

        // If we got here, both verification methods failed
        throw error;
      }

      // Success from OTP verification
      if (data?.session && data?.user) {
        setState(prev => ({
          ...prev,
          status: 'AUTHENTICATED',
          user: data.user as AuthUser,
          session: data.session,
          loading: false,
          error: null
        }));
      }

      return {
        user: data?.user as AuthUser || null,
        session: data?.session || null
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getOAuthRedirectUrl(redirectTo || '/app'),
          queryParams: {
            prompt: 'select_account'
          }
        },
      });

      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Function to check if Google is linked to the current account
  const isGoogleLinked = useCallback(async (): Promise<boolean> => {
    return isOAuthLinked('google');
  }, []);

  // Add a new function to link Google to existing account
  const linkGoogleAccount = useCallback(async (): Promise<void> => {
    try {
      if (!state.user) {
        throw new Error('User must be logged in to link accounts');
      }

      const isAlreadyLinked = await isOAuthLinked('google');
      if (isAlreadyLinked) {
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: getOAuthRedirectUrl('/profile', 'link'),
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [state.user]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: mapError(error)
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextType>(() => ({
      ...state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      verifyEmail,
      signInWithGoogle,
      isGoogleLinked,
      linkGoogleAccount,
      clearError
    }), [
      state,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      verifyEmail,
      signInWithGoogle,
      isGoogleLinked,
      linkGoogleAccount,
      clearError
    ]);

  if (initializing) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#F8FAFC] text-sm font-medium text-[#5F6368]"
        role="status"
        aria-live="polite"
      >
        Checking your session…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const mapError = (error: any): AuthError => {
  return {
    code: error.code || 'unknown_error',
    message: error.message || 'An unknown error occurred',
    details: error.details || undefined,
  };
};
