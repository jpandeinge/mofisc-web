// src/components/Planning/BudgetForm.tsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  Calendar,
  Bell,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Film,
  Lightbulb,
  Dumbbell,
  Plane,
  GraduationCap,
  Sparkles,
  Package,
  Tag
} from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';

type EditableBudget = {
  id: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  alertThreshold?: number;
};

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget?: EditableBudget | null;
}

const CATEGORIES = [
  { value: 'Food & Dining', Icon: UtensilsCrossed },
  { value: 'Transportation', Icon: Car },
  { value: 'Shopping', Icon: ShoppingBag },
  { value: 'Entertainment', Icon: Film },
  { value: 'Bills & Utilities', Icon: Lightbulb },
  { value: 'Health & Fitness', Icon: Dumbbell },
  { value: 'Travel', Icon: Plane },
  { value: 'Education', Icon: GraduationCap },
  { value: 'Personal Care', Icon: Sparkles },
  { value: 'Other', Icon: Package }
];

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const BudgetForm: React.FC<BudgetFormProps> = ({ isOpen, onClose, editingBudget = null }) => {
  const { createBudget, updateBudget, loading } = useBudget();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const isEditing = Boolean(editingBudget);

  useEffect(() => {
    if (!isOpen) return;

    if (editingBudget) {
      setCategory(editingBudget.category);
      setAmount(editingBudget.amount.toString());
      setPeriod(editingBudget.period);
      setAlertThreshold(editingBudget.alertThreshold ?? 80);
    } else {
      setCategory('');
      setAmount('');
      setPeriod('monthly');
      setAlertThreshold(80);
    }
  }, [editingBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount) return;

    if (isEditing && editingBudget) {
      await updateBudget(editingBudget.id, {
        category,
        amount: parseFloat(amount),
        period,
        alertThreshold,
      });
    } else {
      await createBudget({
        category,
        amount: parseFloat(amount),
        period,
        alertThreshold,
        startDate: new Date().toISOString(),
        isActive: true
      });
    }

    // Reset form
    setCategory('');
    setAmount('');
    setPeriod('monthly');
    setAlertThreshold(80);
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
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5 flex-shrink-0"
            style={{
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)'
            }}
          >
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {isEditing ? 'Adjust Budget' : 'Create Budget'}
              </h2>
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {isEditing ? 'Update limits and alerts' : 'Set spending limits by category'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl transition-colors hover:opacity-80"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <X size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Category Selection */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <Tag size={16} style={{ color: 'var(--accent-color)' }} />
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const IconComponent = cat.Icon;
                  const isSelected = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-all text-left"
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--accent-color)'
                          : 'var(--bg-primary)',
                        color: isSelected
                          ? '#FFFFFF'
                          : 'var(--text-primary)',
                        border: isSelected
                          ? '2px solid var(--accent-color)'
                          : '2px solid transparent'
                      }}
                    >
                      <IconComponent
                        size={18}
                        style={{
                          color: isSelected ? '#FFFFFF' : 'var(--accent-color)'
                        }}
                      />
                      <span className="truncate">{cat.value}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <DollarSign size={16} style={{ color: 'var(--accent-color)' }} />
                Budget Amount
              </label>
              <div className="relative">
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  NAD
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="w-full pl-14 pr-4 py-3.5 rounded-xl text-lg font-semibold transition-all focus:outline-none"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border-color)'
                  }}
                />
              </div>
            </div>

            {/* Period Selection */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <Calendar size={16} style={{ color: 'var(--accent-color)' }} />
                Budget Period
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                    style={{
                      backgroundColor: period === p.value
                        ? 'var(--accent-color)'
                        : 'var(--bg-primary)',
                      color: period === p.value
                        ? '#FFFFFF'
                        : 'var(--text-secondary)'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert Threshold */}
            <div>
              <label
                className="flex items-center gap-2 text-sm font-medium mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                <Bell size={16} style={{ color: 'var(--accent-color)' }} />
                Alert Threshold
              </label>
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Notify when spending reaches
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {alertThreshold}%
                  </span>
                </div>
                <input
                  type="range"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                  min="50"
                  max="100"
                  step="5"
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${(alertThreshold - 50) * 2}%, var(--border-color) ${(alertThreshold - 50) * 2}%, var(--border-color) 100%)`
                  }}
                />
                <div
                  className="flex justify-between text-xs mt-2"
                  style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}
                >
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !category || !amount}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 rounded-xl text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--accent-color)',
                color: '#FFFFFF'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Budget' : 'Create Budget'
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BudgetForm;
