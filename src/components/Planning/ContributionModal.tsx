// src/components/Planning/ContributionModal.tsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Plus, Minus } from 'lucide-react';
import { Goal } from '../../types/goals';
import { useGoals } from '../../context/GoalsContext';
import { formatCurrency, formatCompactCurrency } from '../../utils/formatters';
import { toast } from 'react-toastify';
import { handleError } from '../../utils/errorHandling';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
}

const ContributionModal: React.FC<ContributionModalProps> = ({ isOpen, onClose, goal }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { addContribution } = useGoals();

  // Quick amount suggestions based on goal target
  const quickAmounts = [
    Math.round(goal.targetAmount * 0.05), // 5%
    Math.round(goal.targetAmount * 0.1),  // 10%
    Math.round(goal.targetAmount * 0.2),  // 20%
  ].filter(amt => amt > 0);

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
  };

  const handleQuickAmountSelect = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const adjustAmount = (delta: number) => {
    const currentAmount = Number(amount) || 0;
    setAmount(Math.max(0, currentAmount + delta).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsProcessing(true);
    try {
      const numericAmount = Number(amount);
      await addContribution(goal.id, numericAmount);
      toast.success(`Added ${formatCurrency(numericAmount)} to ${goal.name}`);
      onClose();
      setAmount('');
    } catch (error) {
      handleError(error, 'data', 'Failed to add contribution. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };


  // Render the modal content
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
             role="dialog"
             aria-modal="true"
             aria-labelledby="modal-title">
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
            className="relative w-full max-w-[320px] bg-[color:var(--bg-primary)]
                       rounded-xl shadow-xl border border-[color:var(--border-color)] overflow-hidden"
          >
            {/* Accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: goal.color }}
            />

            {/* Header */}
            <div className="px-4 py-3 border-b border-[color:var(--border-color)] mt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 id="modal-title" className="text-sm font-semibold text-[color:var(--text-primary)]">
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
            <form onSubmit={handleSubmit} className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[color:var(--text-tertiary)] text-sm font-medium">NAD</span>
                  </div>
                  <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 mr-1">
                    <button
                      type="button"
                      onClick={() => adjustAmount(-100)}
                      className="p-1.5 rounded-md hover:bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] transition-colors"
                      aria-label="Decrease amount by 100"
                    >
                      <Minus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustAmount(100)}
                      className="p-1.5 rounded-md hover:bg-[color:var(--bg-secondary)] text-[color:var(--text-secondary)] transition-colors"
                      aria-label="Increase amount by 100"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <input
                    id="contribution-amount"
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="block w-full pl-12 pr-16 py-2.5
                             bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)]
                             rounded-lg text-[color:var(--text-primary)] placeholder-[color:var(--text-tertiary)] text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 focus:border-[#4285F4]
                             transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {quickAmounts.map((quickAmount) => (
                  <motion.button
                    key={quickAmount}
                    type="button"
                    onClick={() => handleQuickAmountSelect(quickAmount)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative overflow-hidden
                              bg-[color:var(--bg-secondary)]
                              rounded-lg border border-[color:var(--border-color)]
                              py-2 px-2 group transition-all
                              hover:border-[#4285F4]/30"
                  >
                    {/* Background glow on hover */}
                    <div
                      className="absolute -right-4 -bottom-4 w-12 h-12
                                 rounded-full opacity-0 blur-xl transition-opacity
                                 group-hover:opacity-20"
                      style={{ backgroundColor: goal.color }}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-[color:var(--text-tertiary)]">Quick Add</span>
                      <span className="text-xs font-semibold text-[color:var(--text-primary)] leading-tight"
                            style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatCompactCurrency(quickAmount)}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!amount || isProcessing}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4
                         bg-[#4285F4] text-white text-sm font-medium rounded-lg
                         hover:bg-[#3367D6]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors duration-200"
              >
                <TrendingUp size={14} />
                {isProcessing ? 'Processing...' : 'Add Contribution'}
              </button>
            </form>
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

export default ContributionModal;