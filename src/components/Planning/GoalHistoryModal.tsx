// src/components/Planning/GoalHistoryModal.tsx

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Edit2, Clock, Star, CheckCircle, RefreshCw } from 'lucide-react';
import { Goal, GoalHistory } from '../../types/goals';
import { formatCurrency } from '../../utils/formatters';

interface GoalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  history: GoalHistory[];
  isLoading: boolean;
}

const GoalHistoryModal: React.FC<GoalHistoryModalProps> = ({
  isOpen,
  onClose,
  goal,
  history,
  isLoading
}) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'created':
        return <Star size={16} className="text-blue-400" />;
      case 'updated':
        return <Edit2 size={16} className="text-amber-400" />;
      case 'contribution':
        return <TrendingUp size={16} className="text-green-400" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'deleted':
        return <X size={16} className="text-red-500" />;
      default:
        return <RefreshCw size={16} className="text-gray-400" />;
    }
  };

  const getEventDescription = (event: GoalHistory) => {
    switch (event.eventType) {
      case 'created':
        return 'Goal created';
      case 'updated':
        return 'Goal updated';
      case 'contribution':
        return `Contribution of ${formatCurrency(event.metadata?.contributionAmount || 0)}`;
      case 'completed':
        return 'Goal completed';
      case 'deleted':
        return 'Goal deleted';
      default:
        return 'Goal updated';
    }
  };

  // Format date to a readable format
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render the modal content
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
             role="dialog"
             aria-modal="true"
             aria-labelledby="history-modal-title">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[400px] bg-[color:var(--bg-primary)]
                       rounded-xl shadow-xl border border-[color:var(--border-color)] overflow-hidden max-h-[80vh] flex flex-col"
          >
            {/* Header with goal color accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: goal.color }}
            />
            <div className="px-4 py-3 border-b border-[color:var(--border-color)] shrink-0 mt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="history-modal-title" className="text-sm font-semibold text-[color:var(--text-primary)]">
                    {goal.name}
                  </h2>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)} saved
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[color:var(--bg-secondary)] transition-colors"
                  aria-label="Close modal"
                >
                  <X size={16} className="text-[color:var(--text-secondary)]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto grow">
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    className="w-5 h-5 border-2 border-[color:var(--border-color)] rounded-full"
                    style={{ borderTopColor: goal.color }}
                  />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-[color:var(--text-secondary)] text-sm">
                  No history available for this goal
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-[color:var(--border-color)]" />

                  {/* Timeline events */}
                  <div className="space-y-3">
                    {history.map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        {/* Event icon */}
                        <div className="rounded-full p-1.5 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] z-10">
                          {getEventIcon(event.eventType)}
                        </div>

                        {/* Event content */}
                        <div className="bg-[color:var(--bg-secondary)] rounded-lg border border-[color:var(--border-color)] p-2.5 grow">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-medium text-[color:var(--text-primary)]">
                              {getEventDescription(event)}
                            </span>
                            <div className="flex items-center text-2xs text-[color:var(--text-tertiary)] shrink-0">
                              <Clock size={10} className="mr-1" />
                              {formatDate(event.eventTimestamp)}
                            </div>
                          </div>

                          {/* Event details */}
                          <div className="mt-2 text-2xs text-[color:var(--text-secondary)] space-y-0.5">
                            <div className="flex justify-between">
                              <span>Amount saved:</span>
                              <span className="font-medium text-[color:var(--text-primary)]">
                                {formatCurrency(event.currentAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Progress:</span>
                              <span className="font-medium" style={{ color: goal.color }}>
                                {((event.currentAmount / event.targetAmount) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use createPortal to render the modal at the document root
  return createPortal(
    modalContent,
    document.body
  );
};

export default GoalHistoryModal;