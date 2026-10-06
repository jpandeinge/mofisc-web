// src/components/Planning/GoalForm.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, DollarSign, AlertCircle } from 'lucide-react';
import {
  Home,
  Car,
  GraduationCap,
  Plane,
  Shield,
  Tag,
} from 'lucide-react';
import type { Goal } from '../../types/goals';
import { useGoals } from '../../context/GoalsContext';
import DatePicker from '../Common/DatePicker';

// Types
type GoalCategory = 'emergency' | 'vacation' | 'house' | 'car' | 'education' | 'other';
type GoalColor = '#4285F4' | '#EC4899' | '#10B981' | '#F59E0B' | '#3B82F6' | '#6B7280';

// Categories configuration
const GOAL_CATEGORIES = [
  {
    id: 'emergency',
    name: 'Emergency',
    color: '#4285F4',
    icon: Shield,
    description: 'Safety net',
  },
  {
    id: 'vacation',
    name: 'Vacation',
    color: '#EC4899',
    icon: Plane,
    description: 'Dream trip',
  },
  {
    id: 'house',
    name: 'House',
    color: '#10B981',
    icon: Home,
    description: 'Dream home',
  },
  {
    id: 'car',
    name: 'Car',
    color: '#F59E0B',
    icon: Car,
    description: 'Dream ride',
  },
  {
    id: 'education',
    name: 'Education',
    color: '#3B82F6',
    icon: GraduationCap,
    description: 'Future growth',
  },
  {
    id: 'other',
    name: 'Other',
    color: '#6B7280',
    icon: Tag,
    description: 'Custom goal',
  },
] as const;

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

interface FormData {
  name: string;
  targetAmount: string;
  deadline: Date | null;
  category: GoalCategory;
  color: GoalColor;
}

const CategoryCard: React.FC<{
  category: typeof GOAL_CATEGORIES[number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ category, isSelected, onClick }) => {
  const Icon = category.icon;
  const tint = `${category.color}1A`;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 rounded-xl border p-3 text-left transition-all"
      style={{
        borderColor: isSelected ? category.color : 'var(--border-color)',
        backgroundColor: isSelected ? tint : 'var(--bg-secondary)',
      }}
    >
      <div
        className="h-9 w-9 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: tint }}
      >
        <Icon size={16} style={{ color: category.color }} />
      </div>
      <div>
        <p
          className="text-sm font-medium"
          style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {category.name}
        </p>
        <p className="text-xs text-[color:var(--text-tertiary)]">{category.description}</p>
      </div>
    </motion.button>
  );
};

const GoalForm: React.FC<GoalFormProps> = ({ isOpen, onClose, editingGoal }) => {
  const { addGoal, updateGoal } = useGoals();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    targetAmount: '',
    deadline: null,
    category: 'emergency',
    color: '#4285F4',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount.toString(),
        deadline: editingGoal.deadline,
        category: editingGoal.category,
        color: editingGoal.color as GoalColor,
      });
    }
  }, [editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name.trim()) throw new Error('Goal name is required');
      if (isNaN(parseFloat(formData.targetAmount)) || parseFloat(formData.targetAmount) <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (!formData.deadline) throw new Error('Goal target date is required');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(formData.deadline);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        throw new Error('Target date cannot be in the past');
      }

      const goalData = {
        name: formData.name.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        deadline: formData.deadline,
        category: formData.category,
        color: formData.color,
        currentAmount: editingGoal?.currentAmount || 0,
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
      } else {
        await addGoal(goalData);
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      name: '',
      targetAmount: '',
      deadline: null,
      category: 'emergency',
      color: '#4285F4',
    });
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg glass-card overflow-hidden"
          >
            <div className="relative z-10 p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-[color:var(--text-primary)]">
                    {editingGoal ? 'Adjust Goal' : 'Create Goal'}
                  </h2>
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    Set a clear target and timeline.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl hover:bg-black/5 transition-colors"
                >
                  <X size={18} className="text-[color:var(--text-secondary)]" />
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-xs text-red-500">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Goal Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--text-primary)]">
                    Goal name
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]" size={16} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] rounded-xl text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/40 transition-all"
                      placeholder="e.g., Dream Vacation"
                      required
                    />
                  </div>
                </div>

                {/* Target Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--text-primary)]">
                    Target amount
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]" size={16} />
                    <input
                      type="number"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                      className="w-full pl-10 pr-3 py-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] rounded-xl text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/40 transition-all"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Target Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--text-primary)]">
                    Target date
                  </label>
                  <DatePicker
                    value={formData.deadline}
                    onChange={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                    placeholder="Select target date"
                    minDate={new Date()}
                    size="sm"
                    className="w-full"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[color:var(--text-primary)]">
                    Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {GOAL_CATEGORIES.map(category => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        isSelected={formData.category === category.id}
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          category: category.id as GoalCategory,
                          color: category.color as GoalColor,
                        }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>{editingGoal ? 'Update Goal' : 'Create Goal'}</span>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GoalForm;
