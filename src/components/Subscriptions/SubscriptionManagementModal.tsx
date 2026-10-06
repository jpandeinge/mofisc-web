import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit3, FiPause, FiPlay, FiTrash2, FiCheck, FiExternalLink } from 'react-icons/fi';
import { Subscription } from '../../types/Subscriptions';
import { SubscriptionManagementService } from '../../services/subscriptionManagementService';
import { toast } from 'react-toastify';
import { colors, withOpacity } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { getCancellationLink } from '../../config/subscriptionCancellationLinks';
import { CancellationHelpModal } from './CancellationHelpModal';

interface SubscriptionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onSuccess: () => void;
}

type Action = 'main' | 'rename' | 'pause' | 'delete' | 'success';

export const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSuccess,
}) => {
  const [action, setAction] = useState<Action>('main');
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [resumeDate, setResumeDate] = useState('');
  const [pauseIndefinitely, setPauseIndefinitely] = useState(true);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  if (!isOpen || !subscription) return null;

  const cancellationLink = getCancellationLink(subscription.name);

  const getNextPaymentDate = () => {
    const today = new Date();
    const nextDate = new Date(today.getFullYear(), today.getMonth(), subscription.dueDate);
    if (nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleCancel = () => {
    if (cancellationLink) {
      // Direct cancellation link available - open it
      window.open(cancellationLink.url, '_blank', 'noopener,noreferrer');

      // Show helpful instructions
      if (cancellationLink.instructions) {
        toast.info(cancellationLink.instructions, {
          autoClose: 5000,
          position: 'bottom-center',
        });
      }
    } else {
      // Unknown subscription - show help modal with search options
      setShowHelpModal(true);
    }
  };

  const handlePauseResume = async () => {
    setLoading(true);
    try {
      if (subscription.isPaused) {
        await SubscriptionManagementService.resumeSubscription(subscription.id);
        toast.success('Subscription resumed');
      } else {
        await SubscriptionManagementService.pauseSubscription(
          subscription.id,
          pauseIndefinitely ? undefined : resumeDate
        );
        toast.success('Subscription paused');
      }
      setAction('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!customName.trim()) return;

    setLoading(true);
    try {
      await SubscriptionManagementService.renameSubscription(subscription.id, customName.trim());
      toast.success('Renamed successfully');
      setAction('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmed) return;

    setLoading(true);
    try {
      await SubscriptionManagementService.deleteSubscription(subscription.id);
      toast.success('Deleted (30-day recovery)');
      setAction('success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAction('main');
    setCustomName('');
    setResumeDate('');
    setPauseIndefinitely(true);
    setDeleteConfirmed(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ backgroundColor: colors.overlay.backdrop }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          style={{
            backgroundColor: colors.background.secondary,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full z-10 transition-colors"
            style={{
              color: colors.text.secondary,
              backgroundColor: withOpacity(colors.text.secondary, 0.08),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = withOpacity(colors.text.secondary, 0.15);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = withOpacity(colors.text.secondary, 0.08);
            }}
          >
            <FiX size={20} />
          </button>

          {/* Success State */}
          {action === 'success' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
                style={{ backgroundColor: withOpacity(colors.status.success, 0.1) }}
              >
                <FiCheck size={40} style={{ color: colors.status.success }} strokeWidth={3} />
              </motion.div>
              <p style={{ color: colors.text.primary }} className="text-lg font-semibold">
                Done!
              </p>
            </motion.div>
          )}

          {/* Main View - Revolut Style */}
          {action === 'main' && (
            <div className="p-6 sm:p-8">
              {/* Subscription Info Card */}
              <div className="text-center mb-8 mt-4">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: colors.text.primary }}>
                    {formatCurrency(subscription.amount)}<span className="text-2xl font-normal" style={{ color: colors.text.secondary }}>/mo</span>
                  </h2>
                  <p className="text-lg" style={{ color: colors.text.secondary }}>
                    {getNextPaymentDate()}
                  </p>
                  <p className="text-sm mt-1" style={{ color: colors.text.tertiary }}>
                    {subscription.name}
                  </p>
                </motion.div>
              </div>

              {/* Primary Actions - Revolut Style Pills */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 gap-3 mb-6"
              >
                {/* Pause/Resume Button */}
                <button
                  onClick={() => {
                    if (subscription.isPaused) {
                      handlePauseResume();
                    } else {
                      setAction('pause');
                    }
                  }}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-base transition-transform active:scale-95"
                  style={{
                    backgroundColor: subscription.isPaused
                      ? withOpacity(colors.status.success, 0.12)
                      : withOpacity(colors.text.secondary, 0.08),
                    color: subscription.isPaused ? colors.status.success : colors.text.primary,
                  }}
                >
                  {subscription.isPaused ? (
                    <>
                      <FiPlay size={20} strokeWidth={2.5} />
                      Resume
                    </>
                  ) : (
                    <>
                      <FiPause size={20} strokeWidth={2.5} />
                      Pause
                    </>
                  )}
                </button>

                {/* Cancel Button */}
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-base transition-transform active:scale-95"
                  style={{
                    backgroundColor: withOpacity(colors.status.error, 0.12),
                    color: colors.status.error,
                  }}
                >
                  <FiX size={22} strokeWidth={2.5} />
                  Cancel
                  {cancellationLink && <FiExternalLink size={14} />}
                </button>
              </motion.div>

              {/* Secondary Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <button
                  onClick={() => {
                    setCustomName(subscription.userDisplayName || subscription.name);
                    setAction('rename');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: colors.text.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = withOpacity(colors.text.secondary, 0.05);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span className="text-sm font-medium">Rename subscription</span>
                  <FiEdit3 size={16} style={{ color: colors.text.secondary }} />
                </button>

                <button
                  onClick={() => setAction('delete')}
                  className="w-full flex items-center justify-between p-3 rounded-xl transition-colors"
                  style={{
                    backgroundColor: 'transparent',
                    color: colors.text.primary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = withOpacity(colors.status.error, 0.05);
                    e.currentTarget.style.color = colors.status.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                >
                  <span className="text-sm font-medium">Delete subscription</span>
                  <FiTrash2 size={16} style={{ color: colors.text.secondary }} />
                </button>
              </motion.div>
            </div>
          )}

          {/* Rename Screen */}
          {action === 'rename' && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setAction('main')}
                className="flex items-center gap-2 mb-6 text-sm font-medium"
                style={{ color: colors.primary.main }}
              >
                ← Back
              </button>

              <h3 className="text-xl font-semibold mb-6" style={{ color: colors.text.primary }}>
                Rename Subscription
              </h3>

              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter new name"
                maxLength={100}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl text-base mb-2 outline-none transition-all"
                style={{
                  backgroundColor: withOpacity(colors.text.secondary, 0.05),
                  color: colors.text.primary,
                  border: `2px solid transparent`,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary.main;
                  e.target.style.backgroundColor = colors.background.secondary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'transparent';
                  e.target.style.backgroundColor = withOpacity(colors.text.secondary, 0.05);
                }}
              />
              <p className="text-xs mb-6" style={{ color: colors.text.tertiary }}>
                {customName.length}/100
              </p>

              <button
                onClick={handleRename}
                disabled={loading || !customName.trim()}
                className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-95"
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.inverse,
                  opacity: loading || !customName.trim() ? 0.5 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}

          {/* Pause Screen */}
          {action === 'pause' && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setAction('main')}
                className="flex items-center gap-2 mb-6 text-sm font-medium"
                style={{ color: colors.primary.main }}
              >
                ← Back
              </button>

              <h3 className="text-xl font-semibold mb-6" style={{ color: colors.text.primary }}>
                Pause Subscription
              </h3>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                  style={{
                    backgroundColor: pauseIndefinitely ? withOpacity(colors.primary.main, 0.08) : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    checked={pauseIndefinitely}
                    onChange={() => setPauseIndefinitely(true)}
                    className="w-5 h-5"
                    style={{ accentColor: colors.primary.main }}
                  />
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    Pause indefinitely
                  </span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-colors"
                  style={{
                    backgroundColor: !pauseIndefinitely ? withOpacity(colors.primary.main, 0.08) : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    checked={!pauseIndefinitely}
                    onChange={() => setPauseIndefinitely(false)}
                    className="w-5 h-5"
                    style={{ accentColor: colors.primary.main }}
                  />
                  <span className="font-medium" style={{ color: colors.text.primary }}>
                    Auto-resume on date
                  </span>
                </label>
              </div>

              {!pauseIndefinitely && (
                <input
                  type="date"
                  value={resumeDate}
                  onChange={(e) => setResumeDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3.5 rounded-xl text-base mb-6 outline-none"
                  style={{
                    backgroundColor: withOpacity(colors.text.secondary, 0.05),
                    color: colors.text.primary,
                    border: `2px solid ${colors.primary.main}`,
                  }}
                />
              )}

              <button
                onClick={handlePauseResume}
                disabled={loading || (!pauseIndefinitely && !resumeDate)}
                className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-95"
                style={{
                  backgroundColor: colors.status.warning,
                  color: colors.text.inverse,
                  opacity: loading || (!pauseIndefinitely && !resumeDate) ? 0.5 : 1,
                }}
              >
                {loading ? 'Pausing...' : 'Pause Subscription'}
              </button>
            </div>
          )}

          {/* Delete Screen */}
          {action === 'delete' && (
            <div className="p-6 sm:p-8">
              <button
                onClick={() => setAction('main')}
                className="flex items-center gap-2 mb-6 text-sm font-medium"
                style={{ color: colors.primary.main }}
              >
                ← Back
              </button>

              <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text.primary }}>
                Delete Subscription?
              </h3>
              <p className="text-sm mb-6" style={{ color: colors.text.secondary }}>
                You can recover it within 30 days from your account settings
              </p>

              <label
                className="flex items-start gap-3 p-4 rounded-xl mb-6 cursor-pointer"
                style={{ backgroundColor: withOpacity(colors.status.error, 0.05) }}
              >
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  className="mt-0.5 w-5 h-5"
                  style={{ accentColor: colors.status.error }}
                />
                <span className="text-sm" style={{ color: colors.text.primary }}>
                  I understand this will hide the subscription from my dashboard
                </span>
              </label>

              <button
                onClick={handleDelete}
                disabled={loading || !deleteConfirmed}
                className="w-full py-4 rounded-2xl font-semibold text-base transition-all active:scale-95"
                style={{
                  backgroundColor: colors.status.error,
                  color: colors.text.inverse,
                  opacity: loading || !deleteConfirmed ? 0.5 : 1,
                }}
              >
                {loading ? 'Deleting...' : 'Delete Subscription'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Help Modal for Unknown Subscriptions */}
      <CancellationHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        subscriptionName={subscription.name}
      />
    </AnimatePresence>
  );
};
