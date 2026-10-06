// src/components/Planning/GoalCard.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, TrendingUp, History, Archive, ArchiveRestore } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { Goal } from '../../types/goals';
import { useGoals } from '../../context/GoalsContext';
import ContributionModal from './ContributionModal';
import GoalHistoryModal from './GoalHistoryModal';

interface GoalCardProps {
  goal: Goal;
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onArchive, onUnarchive }) => {
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const { getGoalHistory, goalHistories, loadingHistoryForGoal } = useGoals();
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const categoryLabel = goal.category.charAt(0).toUpperCase() + goal.category.slice(1);

  const handleOpenHistory = async () => {
    if (!goalHistories[goal.id]) {
      await getGoalHistory(goal.id);
    }
    setIsHistoryModalOpen(true);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="glass-card hover-lift relative overflow-hidden rounded-2xl p-5"
    >
      <div
        className="absolute -top-20 -right-16 h-32 w-32 rounded-full opacity-20 blur-3xl"
        style={{ background: goal.color }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[color:var(--text-tertiary)] mb-1">{categoryLabel} goal</p>
          <h3 className="text-base font-semibold text-[color:var(--text-primary)] truncate">
            {goal.name}
          </h3>
          <p className="text-xs text-[color:var(--text-secondary)] mt-1">
            {formatCurrency(goal.currentAmount)} saved • {formatCurrency(remaining)} to go
          </p>
        </div>

        <div className="text-right">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ color: goal.color, backgroundColor: `${goal.color}1A` }}
          >
            {progress.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2 bg-[color:var(--color-bg-tertiary)] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: goal.color }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs mb-3">
        <span className={`font-medium ${formatTimeRemaining(goal.deadline) === 'Overdue' ? 'text-rose-500' : 'text-[color:var(--text-secondary)]'}`}>
          {formatTimeRemaining(goal.deadline)}
        </span>
        <span className="text-[color:var(--text-secondary)]">
          Target {formatCurrency(goal.targetAmount)}
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsContributionModalOpen(true)}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          title="Add contribution"
        >
          <TrendingUp size={16} style={{ color: goal.color }} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpenHistory}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          title="View history"
        >
          <History size={16} className="text-[color:var(--text-secondary)]" />
        </motion.button>

        {onArchive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onArchive}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            title="Archive goal"
          >
            <Archive size={16} className="text-[color:var(--text-secondary)]" />
          </motion.button>
        )}

        {onUnarchive && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUnarchive}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            title="Unarchive goal"
          >
            <ArchiveRestore size={16} className="text-[color:var(--text-secondary)]" />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEdit}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          title="Edit goal"
        >
          <Edit2 size={16} className="text-[color:var(--text-secondary)]" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          title="Delete goal"
        >
          <Trash2 size={16} className="text-rose-500" />
        </motion.button>
      </div>

      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        goal={goal}
      />

      <GoalHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        goal={goal}
        history={goalHistories[goal.id] || []}
        isLoading={loadingHistoryForGoal[goal.id] || false}
      />
    </motion.div>
  );
};

const formatTimeRemaining = (deadline: Date): string => {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return '1 day left';
  if (days < 30) return `${days} days left`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} left`;
};

export default GoalCard;
