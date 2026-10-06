import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { secureLogger } from '../utils/secureLogger';

const VerifyEmail = () => {
  const { status } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countDown, setCountDown] = useState(0);

  useEffect(() => {
    const email = searchParams.get('email') || sessionStorage.getItem('pendingVerificationEmail');
    if (email) {
      setUserEmail(email);
      sessionStorage.setItem('pendingVerificationEmail', email);
    }
    if (searchParams.get('email')) window.history.replaceState({}, document.title, window.location.pathname);
  }, [searchParams]);

  useEffect(() => {
    if (status === 'AUTHENTICATED') {
      toast.success('You are already signed in.');
      navigate('/app');
    }
  }, [status, navigate]);

  useEffect(() => {
    if (countDown > 0) {
      const timer = window.setTimeout(() => setCountDown((value) => value - 1), 1000);
      return () => window.clearTimeout(timer);
    }
    if (resendDisabled) setResendDisabled(false);
    return undefined;
  }, [countDown, resendDisabled]);

  const handleResendVerification = async () => {
    if (!userEmail) {
      toast.error('The email address is missing. Please create the account again.');
      navigate('/signup');
      return;
    }

    try {
      setResendDisabled(true);
      setCountDown(60);
      const { error } = await supabase.auth.resend({ type: 'signup', email: userEmail, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      toast.info(`A new verification email was sent to ${userEmail}`);
    } catch (resendError: any) {
      secureLogger.error('Failed to resend verification email:', 'VerifyEmailPage', resendError);
      toast.error(resendError.message || 'We could not resend the verification email.');
      setResendDisabled(false);
      setCountDown(0);
    }
  };

  return (
    <div className="public-page min-h-screen bg-[#f8fafc]">
      <header className="border-b border-[#dfe5ec] bg-white px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#246bfd] text-sm font-semibold text-white">M</span><span className="text-lg font-semibold text-[#15263c]">Mofisc</span></Link>
          <Link to="/signin" className="text-sm text-[#245dc7]">Sign in</Link>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-[460px]">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#15263c]">Verify your email</h1>
          <p className="mt-3 text-sm leading-6 text-[#5f6f82]">Open the verification message sent to your email address and follow the link.</p>

          <div className="mt-8 border border-[#d7dee7] bg-white p-6 sm:p-7">
            {userEmail ? <div className="border-b border-[#dfe5ec] pb-5"><p className="text-xs text-[#738194]">Verification email sent to</p><p className="mt-1 break-all text-sm font-medium text-[#15263c]">{userEmail}</p></div> : null}

            <div className="mt-5 space-y-3">
              <button type="button" onClick={handleResendVerification} disabled={resendDisabled} className="h-11 w-full rounded-lg bg-[#15263c] text-sm font-medium text-white disabled:opacity-60">{resendDisabled ? `Send again in ${countDown} seconds` : 'Send another email'}</button>
              <button type="button" onClick={() => navigate('/signin')} className="h-11 w-full rounded-lg border border-[#cfd7e2] bg-white text-sm font-medium text-[#15263c]">I have verified my email</button>
            </div>

            <p className="mt-5 text-xs leading-5 text-[#738194]">If the message does not arrive, check the address and your spam folder.</p>
          </div>

          <p className="mt-6 text-center text-sm text-[#5f6f82]">Need help? <a href="mailto:support@mofisc.com" className="text-[#245dc7]">Contact support</a></p>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
