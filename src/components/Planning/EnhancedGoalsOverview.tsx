// src/components/Planning/EnhancedGoalsOverview.tsx

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Archive, ArchiveRestore, TrendingUp, Target, Clock } from 'lucide-react';
import { useGoals } from '../../context/GoalsContext';
import type { Goal } from '../../types/goals';
import GoalCard from './GoalCard';
import GoalForm from './GoalForm';
import { formatCurrency } from '../../utils/formatters';

const EnhancedGoalsOverview: React.FC = () => {
  const { goals, archiveGoal, unarchiveGoal, deleteGoal } = useGoals();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Filter goals by status
  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === 'active'),
    [goals]
  );

  const completedGoals = useMemo(
    () => goals.filter((g) => g.status === 'completed'),
    [goals]
  );

  const archivedGoals = useMemo(
    () => goals.filter((g) => g.status === 'archived'),
    [goals]
  );

  const displayGoals = showArchived ? archivedGoals : [...activeGoals, ...completedGoals];

  // Calculate stats
  const stats = useMemo(() => {
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      activeCount: activeGoals.length,
      completedCount: completedGoals.length,
      archivedCount: archivedGoals.length,
      totalTarget,
      totalSaved,
      overallProgress,
    };
  }, [activeGoals, completedGoals, archivedGoals]);

  const priorityGoal = useMemo(() => {
    if (!activeGoals.length) return null;
    return [...activeGoals].sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0];
  }, [activeGoals]);

  const priorityInsights = useMemo(() => {
    if (!priorityGoal) return null;
    const progress = (priorityGoal.currentAmount / priorityGoal.targetAmount) * 100;
    const milestones = [25, 50, 75, 100];
    const nextMilestone = milestones.find((m) => m > progress) ?? 100;
    const milestoneAmount = (priorityGoal.targetAmount * nextMilestone) / 100;
    const contributionNeeded = Math.max(milestoneAmount - priorityGoal.currentAmount, 0);
    const remaining = Math.max(priorityGoal.targetAmount - priorityGoal.currentAmount, 0);
    const now = new Date();
    const daysRemaining = Math.max(
      Math.ceil((priorityGoal.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      1
    );
    const monthsRemaining = Math.max(Math.ceil(daysRemaining / 30), 1);
    const monthlyPace = remaining / monthsRemaining;

    return {
      progress,
      nextMilestone,
      milestoneAmount,
      contributionNeeded,
      remaining,
      monthsRemaining,
      monthlyPace,
      dueDateLabel: priorityGoal.deadline.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [priorityGoal]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleArchive = async (goalId: string) => {
    try {
      await archiveGoal(goalId);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleUnarchive = async (goalId: string) => {
    try {
      await unarchiveGoal(goalId);
    } catch (error) {
      // Error handled by context
    }
  };

  const handleDelete = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
      } catch (error) {
        // Error handled by context
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="heading-md text-[color:var(--text-primary)]">Goals</h2>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-primary-lighter)',
                color: 'var(--color-primary-dark)',
              }}
            >
              <Target className="h-3.5 w-3.5" />
              Goal tracking
            </span>
          </div>
          <p className="body-sm text-[color:var(--text-secondary)] mt-1">
            Stay aligned with milestones, contributions, and timelines.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Goal</span>
        </motion.button>
      </div>

      {/* Stats Cards */}
      {!showArchived && stats.activeCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-[color:var(--accent-color)]/15 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--text-secondary)]">Overall Progress</p>
                <p className="text-2xl font-semibold text-[color:var(--text-primary)]">
                  {stats.overallProgress.toFixed(1)}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[color:var(--color-primary-light)]/60">
                <TrendingUp className="h-5 w-5 text-[color:var(--accent-color)]" />
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden bg-[color:var(--color-bg-tertiary)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.overallProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
              />
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-[#10B981]/15 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--text-secondary)]">Total Saved</p>
                <p className="text-2xl font-semibold text-[color:var(--text-primary)]">
                  NAD {stats.totalSaved.toLocaleString()}
                </p>
                <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
                  of NAD {stats.totalTarget.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/15">
                <Target className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden">
            <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-[#F59E0B]/15 blur-3xl" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--text-secondary)]">Active Goals</p>
                <p className="text-2xl font-semibold text-[color:var(--text-primary)]">
                  {stats.activeCount}
                </p>
                <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
                  {stats.completedCount} completed
                </p>
              </div>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/15">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!showArchived && priorityGoal && priorityInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-4"
        >
          <div className="glass-card p-5 lg:col-span-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[color:var(--text-secondary)]">Next milestone</p>
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                  {priorityInsights.nextMilestone}% for {priorityGoal.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[color:var(--text-secondary)]">Due {priorityInsights.dueDateLabel}</p>
                <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                  {priorityInsights.progress.toFixed(0)}% complete
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full overflow-hidden bg-[color:var(--color-bg-tertiary)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(priorityInsights.progress, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[color:var(--text-secondary)]">
              <span>{formatCurrency(priorityInsights.contributionNeeded)} to hit {priorityInsights.nextMilestone}%</span>
              <span>{formatCurrency(priorityInsights.remaining)} remaining</span>
            </div>
          </div>

          <div className="glass-card p-5 lg:col-span-5">
            <p className="text-xs text-[color:var(--text-secondary)]">Pace to stay on track</p>
            <p className="text-lg font-semibold text-[color:var(--text-primary)] mt-1">
              {formatCurrency(priorityInsights.monthlyPace)} / month
            </p>
            <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
              Based on {priorityInsights.monthsRemaining} months remaining
            </p>
            <div className="mt-4 rounded-xl border border-[color:var(--border-color)] bg-white/70 p-3">
              <p className="text-xs text-[color:var(--text-secondary)]">Priority goal</p>
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                {priorityGoal.name}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Toggle Archive View */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            backgroundColor: showArchived ? 'var(--accent-color)' : 'var(--bg-secondary)',
            color: showArchived ? '#FFFFFF' : 'var(--text-secondary)',
            border: showArchived ? '1px solid transparent' : '1px solid var(--border-color)',
          }}
        >
          {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          {showArchived ? 'Show Active' : `Archived (${stats.archivedCount})`}
        </motion.button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {displayGoals.map((goal) => (
            <motion.div
              key={goal.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <GoalCard
                goal={goal}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal.id)}
                onArchive={showArchived ? undefined : () => handleArchive(goal.id)}
                onUnarchive={showArchived ? () => handleUnarchive(goal.id) : undefined}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {displayGoals.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 glass-card"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[color:var(--color-bg-tertiary)] rounded-2xl mb-4">
            {showArchived ? (
              <Archive className="w-8 h-8 text-[color:var(--text-tertiary)]" />
            ) : (
              <Target className="w-8 h-8 text-[color:var(--text-tertiary)]" />
            )}
          </div>
          <h3 className="text-lg font-medium text-[color:var(--text-primary)] mb-2">
            {showArchived ? 'No Archived Goals' : 'No Active Goals'}
          </h3>
          <p className="text-sm text-[color:var(--text-secondary)] mb-6">
            {showArchived
              ? 'Archived goals will appear here when you pause them.'
              : 'Create your first goal and start tracking progress.'}
          </p>
          {!showArchived && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 rounded-xl text-white font-medium shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all"
              style={{ background: 'var(--gradient-primary)' }}
            >
              Create Your First Goal
            </motion.button>
          )}
        </motion.div>
      )}

      <GoalForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
      />
    </div>
  );
};

export default EnhancedGoalsOverview;
