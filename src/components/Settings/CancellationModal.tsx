// src/components/Settings/CancellationModal.tsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiLoader, FiCheck, FiCalendar, FiHeart } from 'react-icons/fi';
import { colors, withOpacity } from '../../styles/colors';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string, feedback?: string) => Promise<void>;
  planName: string;
  periodEndDate?: string;
  isLoading?: boolean;
}

const CANCELLATION_REASONS = [
  { id: 'too_expensive', label: 'Too expensive' },
  { id: 'not_using', label: 'Not using it enough' },
  { id: 'missing_features', label: 'Missing features I need' },
  { id: 'found_alternative', label: 'Found an alternative' },
  { id: 'temporary', label: 'Just need a break' },
  { id: 'other', label: 'Other reason' },
];

const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  periodEndDate,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'confirm' | 'reason' | 'success'>('confirm');

  const handleConfirm = async () => {
    if (step === 'confirm') {
      setStep('reason');
      return;
    }

    await onConfirm(selectedReason || undefined, feedback || undefined);
    setStep('success');
  };

  const handleClose = () => {
    setStep('confirm');
    setSelectedReason(null);
    setFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: colors.overlay.backdrop }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: colors.background.primary,
            border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors z-10"
            style={{
              backgroundColor: withOpacity(colors.text.secondary, 0.1),
              color: colors.text.secondary,
            }}
          >
            <FiX className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="text-center"
                >
                  {/* Icon */}
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: withOpacity(colors.status.warning, 0.1) }}
                  >
                    <FiAlertTriangle className="w-8 h-8" style={{ color: colors.status.warning }} />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                    Cancel your subscription?
                  </h2>

                  {/* Description */}
                  <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
                    We're sorry to see you go. Your {planName} benefits will continue until your billing period ends.
                  </p>

                  {/* What happens section */}
                  <div
                    className="rounded-xl p-4 mb-6 text-left"
                    style={{
                      backgroundColor: withOpacity(colors.background.secondary, 0.5),
                      border: `1px solid ${withOpacity(colors.text.secondary, 0.1)}`,
                    }}
                  >
                    <h3 className="text-sm font-medium mb-3" style={{ color: colors.text.primary }}>
                      What happens when you cancel:
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-3">
                        <FiCalendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.status.info }} />
                        <span className="text-xs" style={{ color: colors.text.secondary }}>
                          Keep full access until{' '}
                          <span className="font-medium" style={{ color: colors.text.primary }}>
                            {periodEndDate || 'your billing period ends'}
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <FiCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.status.success }} />
                        <span className="text-xs" style={{ color: colors.text.secondary }}>
                          Your data stays safe — reactivate anytime
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <FiHeart className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: colors.status.error }} />
                        <span className="text-xs" style={{ color: colors.text.secondary }}>
                          No more charges after cancellation
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: withOpacity(colors.text.secondary, 0.1),
                        color: colors.text.primary,
                        border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                      }}
                    >
                      Keep Subscription
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: colors.status.error,
                        color: colors.text.inverse,
                      }}
                    >
                      Continue
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'reason' && (
                <motion.div
                  key="reason"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Title */}
                  <h2 className="text-xl font-semibold mb-2 text-center" style={{ color: colors.text.primary }}>
                    Help us improve
                  </h2>
                  <p className="text-sm mb-6 text-center" style={{ color: colors.text.secondary }}>
                    Why are you cancelling? (Optional)
                  </p>

                  {/* Reasons */}
                  <div className="space-y-2 mb-4">
                    {CANCELLATION_REASONS.map((reason) => (
                      <motion.button
                        key={reason.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedReason(reason.id)}
                        className="w-full p-3 rounded-xl text-left text-sm transition-colors flex items-center gap-3"
                        style={{
                          backgroundColor:
                            selectedReason === reason.id
                              ? withOpacity(colors.primary.main, 0.1)
                              : withOpacity(colors.background.secondary, 0.5),
                          border: `1px solid ${
                            selectedReason === reason.id
                              ? colors.primary.main
                              : withOpacity(colors.text.secondary, 0.1)
                          }`,
                          color: colors.text.primary,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                          style={{
                            borderColor:
                              selectedReason === reason.id ? colors.primary.main : colors.text.secondary,
                          }}
                        >
                          {selectedReason === reason.id && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: colors.primary.main }}
                            />
                          )}
                        </div>
                        {reason.label}
                      </motion.button>
                    ))}
                  </div>

                  {/* Feedback textarea */}
                  <div className="mb-6">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Any additional feedback? (Optional)"
                      rows={3}
                      className="w-full p-3 rounded-xl text-sm resize-none transition-colors"
                      style={{
                        backgroundColor: withOpacity(colors.background.secondary, 0.5),
                        border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                        color: colors.text.primary,
                      }}
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('confirm')}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: withOpacity(colors.text.secondary, 0.1),
                        color: colors.text.primary,
                        border: `1px solid ${withOpacity(colors.text.secondary, 0.2)}`,
                      }}
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: colors.status.error,
                        color: colors.text.inverse,
                        opacity: isLoading ? 0.75 : 1,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        'Confirm Cancellation'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: withOpacity(colors.status.success, 0.1) }}
                  >
                    <FiCheck className="w-8 h-8" style={{ color: colors.status.success }} />
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                    Subscription cancelled
                  </h2>

                  {/* Description */}
                  <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
                    You'll keep access to your {planName} benefits until{' '}
                    <span className="font-medium" style={{ color: colors.text.primary }}>
                      {periodEndDate || 'your billing period ends'}
                    </span>
                    . We hope to see you again!
                  </p>

                  {/* Close button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: colors.primary.main,
                      color: colors.text.inverse,
                    }}
                  >
                    Got it
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CancellationModal;
