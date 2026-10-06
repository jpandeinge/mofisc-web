import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, useReducedMotion } from 'framer-motion';
import { FcGoogle } from 'react-icons/fc';
import { FiBriefcase, FiCheck, FiEye, FiEyeOff, FiLoader, FiLock, FiMail, FiUser } from 'react-icons/fi';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI/button';
import { Input } from '../components/UI/input';
import { SignUpData } from '../types/auth';
import { colors, gradients, withOpacity } from '../styles/colors';

const SignUp = () => {
  const [searchParams] = useSearchParams();
  const initialUserType = searchParams.get('account') === 'organisation' || searchParams.get('plan') === 'enterprise'
    ? 'organisation'
    : 'individual';
  const { register, handleSubmit, watch, formState: { errors }, setValue, unregister } = useForm<SignUpData>({
    defaultValues: { user_type: initialUserType },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState<'password' | 'google' | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const { signUp, signInWithGoogle, loading: authLoading, error, clearError, status } = useAuth();
  const navigate = useNavigate();
  const userType = watch('user_type', 'individual');

  useEffect(() => {
    if (status === 'AUTHENTICATED') navigate('/app');
  }, [status, navigate]);

  useEffect(() => () => clearError(), [clearError]);

  useEffect(() => {
    if (!error) return;
    let message = error.message;
    if (error.code === 'user_already_registered') message = 'An account with this email already exists.';
    if (error.code === 'invalid_email') message = 'Enter a valid email address.';
    if (error.code === 'weak_password') message = 'Choose a stronger password.';
    if (error.code === 'oauth_error') message = 'Google sign in was not completed. Try again or use email.';
    toast.error(message);
    setSubmissionMethod(null);
    clearError();
  }, [clearError, error]);

  const onSubmit = async (data: SignUpData) => {
    try {
      clearError();
      setSubmissionMethod('password');
      const { requiresEmailConfirmation } = await signUp(data.email, data.password, {
        full_name: data.full_name,
        user_type: data.user_type,
        organisation_name: data.organisation_name,
        requested_plan: data.user_type === 'organisation' ? 'enterprise' : undefined,
      });

      if (requiresEmailConfirmation) {
        sessionStorage.setItem('pendingVerificationEmail', data.email);
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
        toast.success('Check your email to verify your account.');
      } else {
        toast.success('Your account has been created.');
        navigate('/app');
      }
    } catch {
      setSubmissionMethod(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      setSubmissionMethod('google');
      await signInWithGoogle('/app');
    } catch {
      setSubmissionMethod(null);
    }
  };

  const isButtonDisabled = submissionMethod !== null || authLoading;

  const selectUserType = (type: SignUpData['user_type']) => {
    if (type === 'individual') unregister('organisation_name');
    setValue('user_type', type, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden" style={{ background: gradients.light }}>
      <div className="relative z-10 flex min-h-screen flex-col">
        <div className="p-4 sm:p-5">
          <Link
            to="/"
            className="flex w-fit items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg shadow-md" style={{ background: gradients.primary }}>
              <span className="text-lg font-bold text-white">M</span>
            </div>
            <span className="text-xl font-bold" style={{ color: colors.primary.dark }}>Mofisc</span>
          </Link>
        </div>

        <div className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-center gap-8 px-4 pb-8 sm:px-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="hidden flex-col gap-6 lg:flex">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: colors.text.tertiary }}>
                Mofisc Access
              </span>
              <p className="mt-3 max-w-lg text-balance text-3xl font-semibold leading-tight" style={{ color: colors.primary.dark }}>
                Build a clearer financial future from day one.
              </p>
              <p className="mt-3 max-w-lg text-sm leading-6" style={{ color: colors.text.secondary }}>
                Start personally or create a secure workspace for your organisation. Your account structure and plan access follow you every time you sign in.
              </p>
            </div>

            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: colors.background.secondary, border: `1px solid ${colors.border.light}` }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Built for your next step</p>
                  <p className="mt-1.5 text-base font-semibold" style={{ color: colors.primary.dark }}>
                    One secure account, the right workspace.
                  </p>
                </div>
                <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: withOpacity(colors.status.success, 0.12), color: colors.status.success }}>
                  7-day trial
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: withOpacity(colors.primary.main, 0.12), color: colors.primary.main }}>
                    <FiUser aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold" style={{ color: colors.primary.dark }}>Individual</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: colors.text.secondary }}>Personal insights, budgets, goals, and account activity in one place.</p>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: withOpacity(colors.status.success, 0.12), color: colors.status.success }}>
                    <FiBriefcase aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-sm font-semibold" style={{ color: colors.primary.dark }}>Organisation</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: colors.text.secondary }}>An enterprise workspace with ownership, roles, API access, and team-ready controls.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {['No payment card required', 'Encrypted account data', 'Cancel or change plans anytime'].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2 text-xs" style={{ color: colors.text.secondary }}>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: withOpacity(colors.status.success, 0.12), color: colors.status.success }}>
                      <FiCheck className="h-3 w-3" aria-hidden="true" />
                    </span>
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="mx-auto w-full max-w-md"
          >
            <div
              className="space-y-5 overflow-hidden rounded-2xl p-6 shadow-xl backdrop-blur-xl"
              style={{ backgroundColor: colors.background.secondary, border: `1px solid ${colors.border.light}` }}
            >
              <div className="text-center">
                <h1
                  className="bg-gradient-to-r bg-clip-text text-balance text-2xl font-bold text-transparent"
                  style={{ backgroundImage: `linear-gradient(to right, ${colors.primary.dark}, ${colors.primary.main})` }}
                >
                  Create your account
                </h1>
                <p className="mt-2 text-sm" style={{ color: colors.text.secondary }}>
                  Start your seven-day trial. No payment card required.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl p-1" role="group" aria-label="Account type" style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}` }}>
                {(['individual', 'organisation'] as const).map((type) => {
                  const isSelected = userType === type;
                  const Icon = type === 'individual' ? FiUser : FiBriefcase;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => selectUserType(type)}
                      disabled={isButtonDisabled}
                      aria-pressed={isSelected}
                      className="flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        background: isSelected ? gradients.primary : 'transparent',
                        color: isSelected ? colors.text.inverse : colors.text.secondary,
                        boxShadow: isSelected ? `0 4px 12px ${withOpacity(colors.primary.main, 0.2)}` : 'none',
                      }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {type === 'individual' ? 'Individual' : 'Organisation'}
                    </button>
                  );
                })}
              </div>

              {userType === 'individual' ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={isButtonDisabled}
                    className="min-h-11 w-full font-medium"
                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #747775', color: '#1F1F1F' }}
                    aria-busy={submissionMethod === 'google'}
                  >
                    {submissionMethod === 'google' ? (
                      <FiLoader className="mr-2 h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                      <FcGoogle className="mr-2 h-5 w-5" aria-hidden="true" />
                    )}
                    {submissionMethod === 'google' ? 'Redirecting to Google…' : 'Sign up with Google'}
                  </Button>
                  <div className="flex w-full items-center gap-3">
                    <div className="h-px flex-1" style={{ backgroundColor: colors.border.light }} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.secondary }}>or</span>
                    <div className="h-px flex-1" style={{ backgroundColor: colors.border.light }} />
                  </div>
                </>
              ) : (
                <div className="rounded-xl px-3 py-2.5 text-xs leading-5" style={{ backgroundColor: withOpacity(colors.primary.main, 0.07), border: `1px solid ${withOpacity(colors.primary.main, 0.16)}`, color: colors.text.secondary }}>
                  Use your work email to create the organisation owner account. Team access can then be managed from the workspace.
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label htmlFor="signup-full-name" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Full name</label>
                  <div className="relative mt-2">
                    <Input
                      id="signup-full-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      className="pl-10"
                      style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}`, color: colors.text.primary }}
                      disabled={isButtonDisabled}
                      aria-invalid={Boolean(errors.full_name)}
                      aria-describedby={errors.full_name ? 'signup-full-name-error' : undefined}
                      {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })}
                    />
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} aria-hidden="true" />
                  </div>
                  {errors.full_name ? <p id="signup-full-name-error" role="alert" className="mt-1 text-sm" style={{ color: colors.status.error }}>{errors.full_name.message}</p> : null}
                </div>

                {userType === 'organisation' ? (
                  <div>
                    <label htmlFor="signup-organisation" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Organisation name</label>
                    <div className="relative mt-2">
                      <Input
                        id="signup-organisation"
                        type="text"
                        autoComplete="organization"
                        placeholder="Enter your organisation name"
                        className="pl-10"
                        style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}`, color: colors.text.primary }}
                        disabled={isButtonDisabled}
                        aria-invalid={Boolean(errors.organisation_name)}
                        aria-describedby={errors.organisation_name ? 'signup-organisation-error' : undefined}
                        {...register('organisation_name', { required: 'Organisation name is required', minLength: { value: 2, message: 'Enter at least 2 characters' } })}
                      />
                      <FiBriefcase className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} aria-hidden="true" />
                    </div>
                    {errors.organisation_name ? <p id="signup-organisation-error" role="alert" className="mt-1 text-sm" style={{ color: colors.status.error }}>{errors.organisation_name.message}</p> : null}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>{userType === 'organisation' ? 'Work email' : 'Email'}</label>
                  <div className="relative mt-2">
                    <Input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="Enter your email address"
                      className="pl-10"
                      style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}`, color: colors.text.primary }}
                      disabled={isButtonDisabled}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'signup-email-error' : undefined}
                      {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address' } })}
                    />
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} aria-hidden="true" />
                  </div>
                  {errors.email ? <p id="signup-email-error" role="alert" className="mt-1 text-sm" style={{ color: colors.status.error }}>{errors.email.message}</p> : null}
                </div>

                <div>
                  <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: colors.text.tertiary }}>Password</label>
                  <div className="relative mt-2">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Create a secure password"
                      className="pl-10 pr-10"
                      style={{ backgroundColor: colors.background.primary, border: `1px solid ${colors.border.light}`, color: colors.text.primary }}
                      disabled={isButtonDisabled}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'signup-password-error' : 'signup-password-hint'}
                      {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must contain at least 8 characters' }, pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w\W]{8,}$/, message: 'Use uppercase, lowercase and a number' } })}
                    />
                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: colors.text.tertiary }} aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((show) => !show)}
                      disabled={isButtonDisabled}
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]"
                      style={{ color: colors.text.tertiary }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p id="signup-password-error" role="alert" className="mt-1 text-sm" style={{ color: colors.status.error }}>{errors.password.message}</p>
                  ) : (
                    <p id="signup-password-hint" className="mt-1 text-xs leading-5" style={{ color: colors.text.secondary }}>Use at least 8 characters with uppercase, lowercase, and a number.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold shadow-lg"
                  style={{ background: gradients.primary, color: colors.text.inverse, border: 'none' }}
                  disabled={isButtonDisabled}
                  aria-busy={submissionMethod === 'password'}
                >
                  {submissionMethod === 'password' ? (
                    <>
                      <FiLoader className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                      Creating account…
                    </>
                  ) : userType === 'organisation' ? 'Create organisation workspace' : 'Create account'}
                </Button>
              </form>

              <p className="text-center text-xs leading-5" style={{ color: colors.text.secondary }}>
                By creating an account, you agree to the{' '}
                <Link to="/terms" className="rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: colors.primary.main }}>terms of service</Link>
                {' '}and{' '}
                <Link to="/data-policy" className="rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]" style={{ color: colors.primary.main }}>data policy</Link>.
              </p>

              <p className="text-center text-sm" style={{ color: colors.text.secondary }}>
                Already have an account?{' '}
                <Link to="/signin" className="rounded font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4] focus-visible:ring-offset-2" style={{ color: colors.primary.main }}>Sign in</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
