import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { sanitizeAuthRedirect } from '../utils/authRedirect';

type CallbackStatus = 'verifying' | 'success' | 'error';
type CallbackFlow = 'signin' | 'link' | 'verify';
type CallbackOutcome =
  | { status: 'success'; target: string }
  | { status: 'error'; message: string };

interface CallbackAttempt {
  key: string;
  promise: Promise<CallbackOutcome>;
}

const setStorageFlag = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage-backed notices are optional and must not block authentication.
  }
};

const getSessionStorageItem = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeSessionStorageItem = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Optional redirect state can be discarded when storage is restricted.
  }
};

export const normalizeAuthCallbackError = (
  code: string | null,
  description: string | null
): string => {
  const normalized = `${code || ''} ${description || ''}`.toLowerCase();

  if (normalized.includes('identity_already_exists')) {
    return 'That Google account is already linked to another Mofisc account. Choose a different Google account or sign in to the existing account.';
  }

  if (normalized.includes('access_denied')) {
    return 'Google sign-in was cancelled. You can try again when you are ready.';
  }

  if (normalized.includes('unable to exchange external code')) {
    return 'This Google sign-in attempt expired or was already used. Start the sign-in process again.';
  }

  if (normalized.includes('redirect_uri_mismatch')) {
    return 'Google sign-in is not configured for this address. Please contact support.';
  }

  return 'We could not complete authentication. Please try again.';
};

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const callbackAttemptRef = useRef<CallbackAttempt | null>(null);

  const flowParam = searchParams.get('flow');
  const flow: CallbackFlow =
    flowParam === 'link' || flowParam === 'verify' ? flowParam : 'signin';
  const isAccountLink = flow === 'link';
  const storedRedirect = getSessionStorageItem('post_auth_redirect');
  const redirectTo = sanitizeAuthRedirect(
    searchParams.get('redirectTo'),
    sanitizeAuthRedirect(storedRedirect)
  );
  const retryTarget = isAccountLink
    ? '/profile'
    : `/signin?redirectTo=${encodeURIComponent(redirectTo)}`;
  const callbackKey = searchParams.toString();
  const providerError = searchParams.get('error');
  const providerErrorCode = searchParams.get('error_code');
  const providerErrorDescription = searchParams.get('error_description');
  const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
  const verificationType = searchParams.get('type');

  useEffect(() => {
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const finishWithError = (message: string) => {
      if (!active) return;
      setErrorMessage(message);
      setStatus('error');
    };

    const finishWithSuccess = (target: string) => {
      if (!active) return;
      setStatus('success');
      redirectTimer = setTimeout(() => {
        navigate(target, { replace: true });
      }, 700);
    };

    const completeCallback = async (): Promise<CallbackOutcome> => {
      if (providerError || providerErrorCode) {
        return {
          status: 'error',
          message: normalizeAuthCallbackError(
            providerErrorCode || providerError,
            providerErrorDescription
          ),
        };
      }

      try {
        // Email verification links may carry an OTP directly. PKCE OAuth codes
        // are exchanged automatically by the configured browser client.
        if (tokenHash && verificationType) {
          const { error } = await supabase.auth.verifyOtp({
            type: verificationType as any,
            token_hash: tokenHash,
          });
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        removeSessionStorageItem('post_auth_redirect');

        if (data.session?.user) {
          if (isAccountLink) {
            setStorageFlag('account_linking_success', 'true');
            return { status: 'success', target: '/profile' };
          }

          if (flow !== 'verify' && verificationType !== 'signup') {
            setStorageFlag('last_auth_provider', 'google');
          }

          return { status: 'success', target: redirectTo };
        }

        if (flow === 'verify' || verificationType === 'signup') {
          setStorageFlag('email_verification_success', 'true');
          return { status: 'success', target: '/signin' };
        }

        return {
          status: 'error',
          message: isAccountLink
            ? 'We could not link that Google account. Return to your profile and try again.'
            : 'We could not create a secure session. Start the sign-in process again.',
        };
      } catch (error) {
        const authError = error as { code?: string; message?: string };
        return {
          status: 'error',
          message: normalizeAuthCallbackError(
            authError.code || null,
            authError.message || null
          ),
        };
      }
    };

    // React Strict Mode intentionally sets up, cleans up, and sets up effects
    // again in development. Reuse the same callback promise so the live effect
    // receives the result without exchanging an OAuth/OTP credential twice.
    if (!callbackAttemptRef.current || callbackAttemptRef.current.key !== callbackKey) {
      callbackAttemptRef.current = {
        key: callbackKey,
        promise: completeCallback(),
      };
    }

    void callbackAttemptRef.current.promise.then((outcome) => {
      if (outcome.status === 'success') {
        finishWithSuccess(outcome.target);
      } else {
        finishWithError(outcome.message);
      }
    });

    return () => {
      active = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [
    callbackKey,
    flow,
    isAccountLink,
    navigate,
    providerError,
    providerErrorCode,
    providerErrorDescription,
    redirectTo,
    tokenHash,
    verificationType,
  ]);

  const title =
    status === 'verifying'
      ? isAccountLink
        ? 'Linking your Google account'
        : 'Completing sign in'
      : status === 'success'
        ? isAccountLink
          ? 'Google account linked'
          : flow === 'verify'
            ? 'Email verified'
            : 'You are signed in'
        : 'Authentication needs attention';

  const description =
    status === 'verifying'
      ? 'We are securely finishing the authentication request.'
      : status === 'success'
        ? flow === 'verify'
          ? 'Your email and session are ready. Opening Mofisc now.'
          : 'Your session is ready. Opening Mofisc now.'
        : errorMessage || 'We could not complete authentication. Please try again.';

  return (
    <main className="public-page min-h-screen bg-[#f8fafc]">
      <header className="border-b border-[#d9e0e8] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
          <Link to="/" className="text-xl font-semibold tracking-[-0.02em] text-[#15263c]">
            Mofisc
          </Link>
        </div>
      </header>

      <section
        className="mx-auto mt-16 w-[calc(100%-2.5rem)] max-w-md border border-[#d9e0e8] bg-white p-6 sm:mt-24 sm:p-8"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#5f6f82]">
            {status === 'error' ? 'Action needed' : status === 'success' ? 'Ready' : 'Verifying'}
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.02em] text-[#15263c]">
            {title}
          </h1>
          <p className="text-pretty text-sm leading-6 text-[#5f6f82]">
            {description}
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-[#d9e0e8] pt-4">
          <span className="text-sm text-[#15263c]">
            Secure session
          </span>
          <span className={`text-xs font-semibold ${status === 'error' ? 'text-[#b42318]' : 'text-[#1f5f99]'}`}>
            {status === 'error' ? 'Action needed' : status === 'success' ? 'Ready' : 'Verifying'}
          </span>
        </div>

        {status === 'error' && (
          <Link
            to={retryTarget}
            replace
            className="mt-5 inline-flex h-11 w-full items-center justify-center bg-[#15263c] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#213852] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5f99] focus-visible:ring-offset-2"
          >
            {isAccountLink ? 'Return to profile' : 'Try signing in again'}
          </Link>
        )}
      </section>
    </main>
  );
};

export default AuthCallback;
