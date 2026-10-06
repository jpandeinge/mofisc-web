// src/pages/ComingSoonPage.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiBell, FiMail, FiShield, FiZap, FiTrendingUp, FiCheck } from 'react-icons/fi';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { secureLogger } from '../utils/secureLogger';
import { colors } from '../styles/colors';

const LOG_CONTEXT = 'ComingSoonPage';

const ComingSoonPage: React.FC = () => {
  const { currentBankAccount, setCurrentBankAccount } = useAppContext();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill email with user's email
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure user_id is available
      if (!user?.id) {
        setError('User not authenticated. Please sign in again.');
        return;
      }

      // Insert notification preference into Supabase using the generic feature_notifications table
      // Let database handle timestamps via DEFAULT NOW() and triggers
      // @ts-ignore - Custom table not in generated types yet
      const { error: insertError } = await (supabase as any)
        .from('feature_notifications')
        .upsert({
          user_id: user.id,
          email: email.trim().toLowerCase(), // Normalize email
          feature_type: 'bank_integration',
          feature_identifier: currentBankAccount,
          metadata: {
            source: 'coming_soon_page',
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
          },
          is_active: true,
          is_notified: false
          // created_at and updated_at handled by database
        }, {
          onConflict: 'user_id,feature_type,feature_identifier',
          ignoreDuplicates: false // Ensure we update existing records
        });

      if (insertError) {
        secureLogger.error(LOG_CONTEXT, 'Failed to save notification preference', insertError);
        setError('Failed to save your notification preference. Please try again.');
        return;
      }

      secureLogger.info(LOG_CONTEXT, 'Notification preference saved successfully');
      setIsSubmitted(true);

      // Keep the success message visible
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);

    } catch (err) {
      secureLogger.error(LOG_CONTEXT, 'Error saving notification preference', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToBankStatement = () => {
    setCurrentBankAccount('Bank Statement');
  };

  const features = [
    {
      icon: FiZap,
      title: 'Real-time Sync',
      description: 'Instant transaction updates as they happen',
      bgColor: colors.primary.main,
      borderColor: colors.primary.light
    },
    {
      icon: FiShield,
      title: 'Bank-level Security',
      description: '256-bit encryption & multi-factor authentication',
      bgColor: colors.status.success,
      borderColor: '#10B98133'
    },
    {
      icon: FiTrendingUp,
      title: 'Smart Insights',
      description: 'AI-powered categorization and spending analysis',
      bgColor: colors.primary.dark,
      borderColor: colors.primary.light
    }
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 md:p-6"
      style={{
        background: `linear-gradient(to bottom right, ${colors.background.primary}, ${colors.background.secondary})`
      }}
    >
      {/* Animated Gradient Orbs */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: `${colors.primary.main}20` }}
      ></div>
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          backgroundColor: `${colors.primary.light}30`,
          animationDelay: '1s'
        }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          backgroundColor: `${colors.primary.main}10`,
          animationDelay: '2s'
        }}
      ></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-4xl w-full"
      >
        {/* Main Card */}
        <div
          className="backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl"
          style={{
            background: `linear-gradient(to bottom right, ${colors.background.secondary}e6, ${colors.background.primary}e6)`,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: colors.border.light
          }}
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-3xl opacity-20 blur-xl"
                style={{
                  background: `linear-gradient(to right, ${colors.primary.main}, ${colors.primary.light}, ${colors.primary.main})`
                }}
              ></motion.div>
              <div
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.primary.dark}, ${colors.primary.main})`
                }}
              >
                <FiClock
                  className="w-10 h-10 md:w-12 md:h-12"
                  style={{ color: colors.text.inverse }}
                />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(to bottom right, ${colors.status.success}, #059669)`
                }}
              >
                <FiBell
                  className="w-3 h-3 md:w-4 md:h-4"
                  style={{ color: colors.text.inverse }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-center"
          >
            <h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${colors.primary.dark}, ${colors.primary.main})`
              }}
            >
              Coming Soon
            </h1>
            <p
              className="text-lg md:text-xl mb-2 font-semibold"
              style={{ color: colors.text.primary }}
            >
              {currentBankAccount} Integration
            </p>
            <p
              className="text-sm md:text-base mb-10 max-w-2xl mx-auto leading-relaxed"
              style={{ color: colors.text.secondary }}
            >
              We're building something extraordinary. Direct bank connections with enterprise-grade security,
              real-time sync, and AI-powered insights to transform how you manage your finances.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="rounded-2xl p-6 text-left transition-all"
                  style={{
                    background: `${feature.bgColor}0d`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: feature.borderColor,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-md"
                    style={{
                      backgroundColor: feature.bgColor
                    }}
                  >
                    <feature.icon
                      className="w-6 h-6"
                      style={{ color: colors.text.inverse }}
                    />
                  </div>
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: colors.text.primary }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Notification Signup */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="rounded-2xl p-6 md:p-8"
              style={{
                backgroundColor: `${colors.primary.light}1a`,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: colors.border.subtle
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <FiMail
                  className="w-5 h-5"
                  style={{ color: colors.primary.main }}
                />
                <p
                  className="text-base font-semibold"
                  style={{ color: colors.text.primary }}
                >
                  Get Notified When We Launch
                </p>
              </div>
              <p
                className="text-xs md:text-sm mb-6"
                style={{ color: colors.text.secondary }}
              >
                Be the first to know when {currentBankAccount} integration goes live
              </p>

              {!isSubmitted ? (
                <form onSubmit={handleNotifyMe} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: colors.background.secondary,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: colors.border.light,
                        color: colors.text.primary,
                      }}
                    />
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                      className="px-6 py-3 rounded-xl font-semibold text-sm shadow-md transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(to right, ${colors.primary.dark}, ${colors.primary.main})`,
                        color: colors.text.inverse
                      }}
                    >
                      {isSubmitting ? 'Saving...' : 'Notify Me'}
                    </motion.button>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-center"
                      style={{ color: colors.status.error }}
                    >
                      {error}
                    </motion.div>
                  )}
                </form>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={{
                    backgroundColor: `${colors.status.success}1a`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `${colors.status.success}4d`
                  }}
                >
                  <FiCheck
                    className="w-5 h-5"
                    style={{ color: colors.status.success }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: colors.status.success }}
                  >
                    Thanks! We'll notify you when it's ready.
                  </span>
                </motion.div>
              )}
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="mt-8"
            >
              <p
                className="text-xs md:text-sm"
                style={{ color: colors.text.secondary }}
              >
                In the meantime, continue using{' '}
                <button
                  onClick={handleBackToBankStatement}
                  className="font-semibold underline underline-offset-2 transition-colors"
                  style={{ color: colors.primary.main }}
                  onMouseEnter={(e) => e.currentTarget.style.color = colors.primary.dark}
                  onMouseLeave={(e) => e.currentTarget.style.color = colors.primary.main}
                >
                  Bank Statement uploads
                </button>
                {' '}to track your finances
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ComingSoonPage;
