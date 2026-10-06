import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSearch, FiExternalLink, FiHelpCircle } from 'react-icons/fi';
import { colors, withOpacity } from '../../styles/colors';

interface CancellationHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionName: string;
}

export const CancellationHelpModal: React.FC<CancellationHelpModalProps> = ({
  isOpen,
  onClose,
  subscriptionName,
}) => {
  if (!isOpen) return null;

  const handleGoogleSearch = () => {
    const searchQuery = encodeURIComponent(`how to cancel ${subscriptionName} subscription`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
  };

  const handleProviderSearch = () => {
    const searchQuery = encodeURIComponent(`${subscriptionName} cancel subscription`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: colors.overlay.backdrop }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: colors.background.secondary }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full z-10 transition-colors"
          style={{
            color: colors.text.secondary,
            backgroundColor: withOpacity(colors.text.secondary, 0.08),
          }}
        >
          <FiX size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: withOpacity(colors.primary.main, 0.1) }}
            >
              <FiHelpCircle size={24} style={{ color: colors.primary.main }} />
            </div>
            <h3 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
              How to Cancel
            </h3>
          </div>

          <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
            To cancel your <strong>{subscriptionName}</strong> subscription, visit their website or app.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSearch}
              className="w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.inverse,
              }}
            >
              <span className="flex items-center gap-3">
                <FiSearch size={20} />
                <span className="font-medium">Search how to cancel</span>
              </span>
              <FiExternalLink size={16} />
            </button>

            <button
              onClick={handleProviderSearch}
              className="w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-95"
              style={{
                backgroundColor: withOpacity(colors.text.secondary, 0.08),
                color: colors.text.primary,
              }}
            >
              <span className="flex items-center gap-3">
                <FiExternalLink size={20} />
                <span className="font-medium">Find cancellation page</span>
              </span>
              <FiExternalLink size={16} style={{ color: colors.text.secondary }} />
            </button>
          </div>

          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: withOpacity(colors.text.secondary, 0.05) }}>
            <p className="text-xs font-medium mb-2" style={{ color: colors.text.primary }}>
              General steps:
            </p>
            <ol className="text-xs space-y-1" style={{ color: colors.text.secondary }}>
              <li>1. Log in to your {subscriptionName} account</li>
              <li>2. Go to Account or Settings</li>
              <li>3. Look for Subscription or Billing</li>
              <li>4. Select Cancel or Downgrade</li>
            </ol>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
