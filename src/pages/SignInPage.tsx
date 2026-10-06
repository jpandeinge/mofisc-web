//src/pages/SignInPage.tsx

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Button } from '../components/UI/button';
import { Input } from '../components/UI/input';
import { motion, useReducedMotion } from 'framer-motion';
import { colors, gradients, withOpacity } from '../styles/colors';
import { sanitizeAuthRedirect } from '../utils/authRedirect';

interface SignInFormInputs {
  email: string;
  password: string;
}

const getLastAuthProvider = (): 'email' | 'google' => {
  try {
    return localStorage.getItem('last_auth_provider') === 'email' ? 'email' : 'google';
  } catch {
    return 'google';
  }
};

const SignIn: React.FC = () => {
  // Form and state management
  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormInputs>();
  const [showPassword, setShowPassword] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'password' | 'google' | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Auth and navigation
  const { signIn, signInWithGoogle, loading: authLoading, error, clearError, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [lastAuthProvider, setLastAuthProvider] = useState<'email' | 'google'>(getLastAuthProvider);

  // Handle email verification success from localStorage and URL parameters
  useEffect(() => {
    // Only show verification success message
    const verificationSuccess = localStorage.getItem('email_verification_success');
    if (verificationSuccess === 'true') {
      toast.success('Email verified successfully! Please sign in.');
      localStorage.removeItem('email_verification_success');
    }

    // Only show session expired message - other errors are shown directly on the verification page
    const errorParam = searchParams.get('error');
    if (errorParam === 'session-expired') {
      toast.warning('Your session has expired. Please sign in again.');
    }

    // Clear URL parameters after processing
    if (errorParam || searchParams.has('token') || searchParams.has('type')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const fallbackRedirect =
    typeof location.state?.from === 'string' ? location.state.from : '/app';
  const redirectTo = sanitizeAuthRedirect(
    searchParams.get('redirectTo'),
    sanitizeAuthRedirect(fallbackRedirect)
  );

  // Handle authentication status changes
  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      // Clear the session restoration flag
      localStorage.removeItem('is_session_restored');

      navigate(redirectTo, { replace: true });
    }
  }, [status, navigate, redirectTo]);

  // Handle auth errors
  useEffect(() => {
    if (error) {
      let message = error.message;
      if (error.code === 'invalid_credentials') {
        message = 'Invalid email or password. Please try again.';
      } else if (error.code === 'email_not_confirmed') {
        message = 'Please verify your email before signing in. Check your inbox for a verification link.';
      } else if (error.code === 'rate_limited') {
        message = 'Too many sign-in attempts. Please try again later.';
      } else if (error.code === 'oauth_linked_already') {
        message = 'This Google account is already linked to another user.';
      }
      toast.error(message);
      setSubmissionMethod(null);
      clearError();
    }
  }, [clearError, error]);

  useEffect(() => () => clearError(), [clearError]);

  const onSubmit = async (data: SignInFormInputs) => {
    try {
      clearError();
      setSubmissionMethod('password');
      await signIn(data.email, data.password);
    } catch (error) {
      // Error is handled in the useEffect above
      setSubmissionMethod(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      setSubmissionMethod('google');
      setLastAuthProvider('google');
      try {
        localStorage.setItem('last_auth_provider', 'google');
      } catch {
        // The visual hint is optional when browser storage is restricted.
      }
      await signInWithGoogle(redirectTo);
      // Note: For Google sign-in, the user is redirected to the Google sign-in page
      // The auth state change and redirect will be handled in the OAuth callback
    } catch (error) {
      setSubmissionMethod(null);
    }
  };

  const isButtonDisabled = submissionMethod !== null || authLoading;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: gradients.light }}>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="p-4 sm:p-5">
          <Link
            to="/"
            className="flex w-fit items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shadow-md" style={{ background: gradients.primary }}>
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold" style={{ color: colors.primary.dark }}>
              Mofisc
            </span>
          </Link>
        </div>

        <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-center gap-8 px-4 pb-8 sm:px-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="hidden flex-col gap-6 lg:flex">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: colors.text.tertiary }}>
                Mofisc Access
              </span>
              <p className="mt-3 max-w-lg text-balance text-3xl font-semibold leading-tight" style={{ color: colors.primary.dark }}>
                Your money, orchestrated with calm precision.
              </p>
              <p className="mt-3 max-w-lg text-sm leading-6" style={{ color: colors.text.secondary }}>
                Sign in once and step into a workspace that keeps every decision clear, every move intentional, and every insight ready.
              </p>
            </div>

            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: colors.background.secondary, border: `1px solid ${colors.border.light}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>
                    Financial Snapshot
                  </p>
                  <p className="mt-1.5 text-base font-semibold" style={{ color: colors.primary.dark }}>
                    Budgets, cards, and cash flow in one view.
                  </p>
                </div>
                <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: withOpacity(colors.primary.main, 0.12), color: colors.primary.dark }}>
                  Live preview
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3.5" style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Monthly budget</p>
                  <p className="mt-1.5 text-xl font-semibold" style={{ color: colors.primary.dark }}>NAD 18,420</p>
                  <div className="mt-3 space-y-1.5">
                    <div>
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.text.secondary }}>
                        <span>Essentials</span>
                        <span>52%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: colors.border.light }}>
                        <div className="h-1.5 rounded-full" style={{ width: '52%', backgroundColor: colors.primary.main }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.text.secondary }}>
                        <span>Investments</span>
                        <span>24%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: colors.border.light }}>
                        <div className="h-1.5 rounded-full" style={{ width: '24%', backgroundColor: withOpacity(colors.primary.main, 0.6) }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs" style={{ color: colors.text.secondary }}>
                        <span>Flex</span>
                        <span>24%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: colors.border.light }}>
                        <div className="h-1.5 rounded-full" style={{ width: '24%', backgroundColor: withOpacity(colors.status.success, 0.7) }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-xl p-3.5" style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Card status</p>
                      <p className="mt-1.5 text-base font-semibold" style={{ color: colors.primary.dark }}>Mofisc Platinum</p>
                      <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>•••• 4729 · Active</p>
                    </div>
                    <div className="h-10 w-16 rounded-lg" style={{ background: gradients.primary }}></div>
                  </div>

                  <div className="rounded-xl p-3.5" style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Cash flow</p>
                    <p className="mt-1.5 text-base font-semibold" style={{ color: colors.primary.dark }}>+NAD 6,240</p>
                    <div className="mt-3 flex h-12 items-end gap-1.5">
                      {[38, 52, 30, 64, 48, 70, 58].map((height, idx) => (
                        <div
                          key={`flow-${idx}`}
                          className="flex-1 rounded-full"
                          style={{
                            height: `${height}%`,
                            backgroundColor: idx === 3 ? colors.primary.main : withOpacity(colors.primary.main, 0.35)
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="mx-auto w-full max-w-sm"
          >
            <div
              className="space-y-5 overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-xl"
              style={{
                backgroundColor: colors.background.secondary,
                border: `1px solid ${colors.border.light}`
              }}
            >
              <div className="text-center">
                <h1 className="bg-gradient-to-r bg-clip-text text-balance text-2xl font-bold text-transparent" style={{
                  backgroundImage: `linear-gradient(to right, ${colors.primary.dark}, ${colors.primary.main})`
                }}>
                  Welcome back
                </h1>
                <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
                  Sign in to continue your financial journey
                </p>
              </div>

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={isButtonDisabled}
                  className="min-h-11 w-full font-medium"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #747775',
                    color: '#1F1F1F'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8F9FA'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                  aria-busy={submissionMethod === 'google'}
                >
                  <span className="flex items-center justify-center w-full">
                    {submissionMethod === 'google' ? (
                      <FiLoader className="mr-2 h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <FcGoogle className="mr-2 h-5 w-5" aria-hidden="true" />
                    )}
                    {submissionMethod === 'google' ? 'Redirecting to Google…' : 'Sign in with Google'}
                  </span>
                </Button>
                {lastAuthProvider === 'google' && (
                  <span
                    className="absolute -top-2 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      right: -10,
                      backgroundColor: colors.status.success,
                      borderColor: withOpacity(colors.status.success, 0.9),
                      color: colors.text.inverse,
                      boxShadow: `0 2px 6px ${withOpacity(colors.status.success, 0.25)}`
                    }}
                  >
                    Last used
                  </span>
                )}
              </div>

              <div className="flex items-center w-full gap-3">
                <div className="flex-1 h-[1px]" style={{ backgroundColor: colors.border.light }} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.secondary }}>or</span>
                <div className="flex-1 h-[1px]" style={{ backgroundColor: colors.border.light }} />
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="signin-email" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>
                    Email
                  </label>
                  <div className="relative mt-2">
                    <Input
                      type="email"
                      id="signin-email"
                      autoComplete="email"
                      spellCheck={false}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'signin-email-error' : undefined}
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: "Invalid email address"
                        }
                      })}
                      placeholder="Enter your email address"
                      className="pl-10"
                      style={{
                        backgroundColor: colors.background.primary,
                        border: `1px solid ${colors.border.light}`,
                        color: colors.text.primary
                      }}
                      disabled={isButtonDisabled}
                    />
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} aria-hidden="true" />
                  </div>
                  {errors.email && (
                    <p id="signin-email-error" role="alert" className="mt-1 text-sm" style={{ color: colors.status.error }}>{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="signin-password" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>
                    Password
                  </label>
                  <div className="relative mt-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="signin-password"
                      autoComplete="current-password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'signin-password-error' : undefined}
                      {...register("password", {
                        required: "Password is required",
                        minLength: {
                          value: 8,
                          message: "Password must be at least 8 characters"
                        }
                      })}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      style={{
                        backgroundColor: colors.background.primary,
                        border: `1px solid ${colors.border.light}`,
                        color: colors.text.primary
                      }}
                      disabled={isButtonDisabled}
                    />
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                      style={{ color: colors.text.tertiary }}
                      onMouseEnter={(e) => e.currentTarget.style.color = colors.text.primary}
                      onMouseLeave={(e) => e.currentTarget.style.color = colors.text.tertiary}
                      disabled={isButtonDisabled}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="signin-password-error" role="alert" className="mt-1 text-sm" style={{ color: colors.status.error }}>{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    to="/forgot-password"
                    className="rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                    style={{ color: colors.primary.main }}
                  >
                    Forgot your password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold shadow-lg"
                  style={{
                    background: gradients.primary,
                    color: colors.text.inverse,
                    border: 'none'
                  }}
                  disabled={isButtonDisabled}
                  aria-busy={submissionMethod === 'password'}
                >
                  {submissionMethod === 'password' ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Signing in…
                    </>
                  ) : 'Sign in'}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
                    style={{ color: colors.primary.main }}
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
