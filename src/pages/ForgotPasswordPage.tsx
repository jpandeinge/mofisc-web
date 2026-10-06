import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { secureLogger } from '../utils/secureLogger';

interface ForgotPasswordFormInputs {
  email: string;
}

const ForgotPasswordPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    setIsLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email);
      if (error) throw error;
      setMessage('A password reset link has been sent to your email.');
    } catch (resetError) {
      secureLogger.error('Error sending password reset email:', 'ForgotPasswordPage', resetError);
      setMessage('We could not send the reset email. Please try again.');
    } finally {
      setIsLoading(false);
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
        <div className="mx-auto max-w-[420px]">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#15263c]">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6f82]">Enter the email address used for your Mofisc account.</p>
          <div className="mt-8 border border-[#d7dee7] bg-white p-6 sm:p-7">
            {message ? <div className="mb-5 border border-[#cad7e8] bg-[#f4f7fb] p-3 text-sm leading-6 text-[#40546d]">{message}</div> : null}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="reset-email" className="text-sm font-medium text-[#15263c]">Email</label>
                <input id="reset-email" type="email" autoComplete="email" className="mt-2 h-11 w-full rounded-lg border border-[#cfd7e2] bg-white px-3 text-sm text-[#15263c] outline-none focus:border-[#246bfd]" {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Enter a valid email address' } })} />
                {errors.email ? <p className="mt-1 text-xs text-[#b04444]">{errors.email.message}</p> : null}
              </div>
              <button type="submit" disabled={isLoading} className="h-11 w-full rounded-lg bg-[#15263c] text-sm font-medium text-white disabled:opacity-60">{isLoading ? 'Sending...' : 'Send reset link'}</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
