// src/components/Planning/BudgetOverview.tsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Trash2,
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
  TrendingUp,
  Wallet,
  LucideIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useBudget } from '../../context/BudgetContext';
import BudgetForm from './BudgetForm';

type EditableBudget = {
  id: string;
  category: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  alertThreshold?: number;
};

type DisplayBudget = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  percentage: number;
  remaining: number;
  status: 'healthy' | 'on_track' | 'warning' | 'critical' | 'exceeded';
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  alertThreshold: number;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Food & Dining': UtensilsCrossed,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Bills & Utilities': Lightbulb,
  'Health & Fitness': Dumbbell,
  'Travel': Plane,
  'Education': GraduationCap,
  'Personal Care': Sparkles,
  'Other': Package,
};

const formatCurrency = (value: number) => `NAD ${value.toLocaleString()}`;

const BudgetOverview: React.FC = () => {
  const { budgets, budgetStatuses, loading, deleteBudget, fetchBudgetStatus } = useBudget();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<EditableBudget | null>(null);
  const previousBudgetRef = useRef<Record<string, { status: string; percentage: number }>>({});
  const initialAlertSkipped = useRef(false);

  // Combine budgets with status data, or use budgets alone if no status
  const displayBudgets: DisplayBudget[] = budgetStatuses.length > 0
    ? budgetStatuses.map(status => {
        const budget = budgets.find(b => b.id === status.budgetId);
        return {
          id: status.budgetId,
          category: status.category,
          amount: status.budgetAmount,
          spent: status.spentAmount,
          percentage: status.percentage,
          remaining: status.remaining,
          status: status.status,
          period: (budget?.period || 'monthly') as DisplayBudget['period'],
          alertThreshold: budget?.alertThreshold ?? 80,
        };
      })
    : budgets.map(budget => ({
        id: budget.id,
        category: budget.category,
        amount: budget.amount,
        spent: 0,
        percentage: 0,
        remaining: budget.amount,
        status: 'healthy' as const,
        period: budget.period as DisplayBudget['period'],
        alertThreshold: budget.alertThreshold ?? 80,
      }));

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'exceeded':
        return { label: 'Exceeded', color: '#EF4444' };
      case 'critical':
        return { label: 'Critical', color: '#F97316' };
      case 'warning':
        return { label: 'Watch', color: '#EAB308' };
      case 'on_track':
        return { label: 'On Track', color: '#3B82F6' };
      default:
        return { label: 'Healthy', color: '#10B981' };
    }
  };

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || Package;
    return Icon;
  };

  const handleDelete = async (budgetId: string) => {
    await deleteBudget(budgetId);
    setActiveMenu(null);
  };

  const handleEdit = (budget: EditableBudget) => {
    setEditingBudget(budget);
    setIsFormOpen(true);
    setActiveMenu(null);
  };

  const totals = useMemo(() => {
    const totalBudget = displayBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = displayBudgets.reduce((sum, b) => sum + b.spent, 0);
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const totalRemaining = totalBudget - totalSpent;
    const riskCount = displayBudgets.filter((b) => ['warning', 'critical', 'exceeded'].includes(b.status)).length;
    const onTrackCount = displayBudgets.filter((b) => ['healthy', 'on_track'].includes(b.status)).length;
    const topCategory = displayBudgets.reduce((current, next) => {
      if (!current) return next;
      return (next.percentage || 0) > (current.percentage || 0) ? next : current;
    }, displayBudgets[0] || null);

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      riskCount,
      onTrackCount,
      topCategory,
    };
  }, [displayBudgets]);

  const alignment = useMemo(() => {
    const total = displayBudgets.length;
    if (!total) {
      return {
        score: 0,
        withinThreshold: 0,
        atRisk: 0,
        actions: [] as Array<{ title: string; detail: string }>,
      };
    }

    const withinThreshold = displayBudgets.filter((budget) => {
      const threshold = budget.alertThreshold ?? 80;
      return budget.percentage < threshold && budget.remaining >= 0;
    }).length;

    const atRisk = total - withinThreshold;
    const score = Math.round((withinThreshold / total) * 100);

    const severityRank: Record<string, number> = {
      exceeded: 4,
      critical: 3,
      warning: 2,
      on_track: 1,
      healthy: 0,
    };

    const actionCandidates = [...displayBudgets]
      .filter((budget) => {
        const threshold = budget.alertThreshold ?? 80;
        return budget.remaining < 0 || budget.percentage >= threshold || budget.status === 'critical' || budget.status === 'warning' || budget.status === 'exceeded';
      })
      .sort((a, b) => {
        const severityDiff = (severityRank[b.status] || 0) - (severityRank[a.status] || 0);
        if (severityDiff !== 0) return severityDiff;
        return (b.percentage || 0) - (a.percentage || 0);
      });

    const actions = actionCandidates.slice(0, 3).map((budget) => {
      const threshold = budget.alertThreshold ?? 80;
      if (budget.remaining < 0) {
        return {
          title: `${budget.category} is over by ${formatCurrency(Math.abs(budget.remaining))}`,
          detail: 'Reduce spend or raise the budget to realign this category.',
        };
      }
      if (budget.percentage >= threshold) {
        return {
          title: `${budget.category} is at ${Math.min(budget.percentage, 100)}%`,
          detail: `Alert set at ${threshold}%. Slow spend to stay aligned.`,
        };
      }
      return {
        title: `${budget.category} needs attention`,
        detail: 'Review recent transactions and adjust your budget if needed.',
      };
    });

    return { score, withinThreshold, atRisk, actions };
  }, [displayBudgets]);

  const healthMeta = useMemo(() => {
    if (totals.overallPercentage >= 100) return { label: 'Over Budget', color: '#EF4444' };
    if (totals.overallPercentage >= 85) return { label: 'Tight', color: '#F59E0B' };
    if (totals.overallPercentage >= 70) return { label: 'Watch', color: '#FBBF24' };
    return { label: 'On Track', color: '#10B981' };
  }, [totals.overallPercentage]);

  const ringProgress = Math.min(Math.max(totals.overallPercentage, 0), 100);

  useEffect(() => {
    const refresh = () => {
      fetchBudgetStatus();
    };

    refresh();
    const interval = window.setInterval(refresh, 60000);
    const handleFocus = () => refresh();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchBudgetStatus]);

  useEffect(() => {
    if (!displayBudgets.length) return;

    if (!initialAlertSkipped.current) {
      initialAlertSkipped.current = true;
      previousBudgetRef.current = displayBudgets.reduce((acc, budget) => {
        acc[budget.id] = { status: budget.status, percentage: budget.percentage || 0 };
        return acc;
      }, {} as Record<string, { status: string; percentage: number }>);
      return;
    }

    const severityRank: Record<string, number> = {
      healthy: 0,
      on_track: 1,
      warning: 2,
      critical: 3,
      exceeded: 4,
    };

    displayBudgets.forEach((budget) => {
      const prev = previousBudgetRef.current[budget.id];
      if (!prev) return;
      const threshold = budget.alertThreshold ?? 80;
      const currentPercentage = budget.percentage || 0;
      const crossedThreshold = prev.percentage < threshold && currentPercentage >= threshold;
      const statusWorsened = (severityRank[budget.status] ?? 0) > (severityRank[prev.status] ?? 0);

      if (crossedThreshold || statusWorsened) {
        toast.warn(
          `${budget.category} is at ${Math.min(currentPercentage, 100)}% of budget`,
          { autoClose: 6000 }
        );
      }
    });

    previousBudgetRef.current = displayBudgets.reduce((acc, budget) => {
      acc[budget.id] = { status: budget.status, percentage: budget.percentage || 0 };
      return acc;
    }, {} as Record<string, { status: string; percentage: number }>);
  }, [displayBudgets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 rounded-full"
          style={{
            borderColor: 'var(--border-color)',
            borderTopColor: 'var(--accent-color)',
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="heading-md text-[color:var(--text-primary)]">Budgets</h2>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-primary-lighter)',
                color: 'var(--color-primary-dark)',
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Smart planning
            </span>
          </div>
          <p className="body-sm text-[color:var(--text-secondary)] mt-1">
            Shape your monthly spending and keep every category in control.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setEditingBudget(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#4285F4] to-[#5A9FFF] shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all"
          >
            <Plus size={18} />
            Add Budget
          </motion.button>
        </div>
      </div>

      {/* Summary */}
      {displayBudgets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card relative overflow-hidden p-6 lg:col-span-8"
          >
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[color:var(--accent-color)]/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[color:var(--color-primary-light)]/20 blur-3xl" />

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-color)' }}
                >
                  <Wallet size={22} color="#FFFFFF" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--text-secondary)]">
                    Total Budget
                  </p>
                  <p className="text-3xl font-semibold text-[color:var(--text-primary)]">
                    {formatCurrency(totals.totalBudget)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border-color)] bg-white/70 px-3 py-2">
                <div
                  className="relative h-12 w-12 rounded-full"
                  style={{
                    background: `conic-gradient(${healthMeta.color} ${ringProgress * 3.6}deg, var(--color-bg-tertiary) 0deg)`,
                  }}
                >
                  <div className="absolute inset-1 rounded-full bg-[color:var(--bg-secondary)]" />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold" style={{ color: healthMeta.color }}>
                    {ringProgress}%
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[color:var(--text-secondary)]">Budget Health</p>
                  <p className="text-sm font-semibold" style={{ color: healthMeta.color }}>
                    {healthMeta.label}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl border border-[color:var(--border-color)] bg-white/70 p-4">
                <p className="text-xs text-[color:var(--text-secondary)] mb-1">Spent so far</p>
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                  {formatCurrency(totals.totalSpent)}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border-color)] bg-white/70 p-4">
                <p className="text-xs text-[color:var(--text-secondary)] mb-1">Remaining</p>
                <p
                  className="text-lg font-semibold"
                  style={{ color: totals.totalRemaining < 0 ? '#EF4444' : 'var(--text-primary)' }}
                >
                  {totals.totalRemaining < 0 ? '-' : ''}{formatCurrency(Math.abs(totals.totalRemaining))}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border-color)] bg-white/70 p-4">
                <p className="text-xs text-[color:var(--text-secondary)] mb-1">Categories</p>
                <p className="text-lg font-semibold text-[color:var(--text-primary)]">
                  {displayBudgets.length}
                </p>
                <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
                  {totals.onTrackCount} on track
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)] mb-2">
                <span>{formatCurrency(totals.totalSpent)} spent</span>
                <span>{ringProgress}% used</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[color:var(--color-bg-tertiary)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${ringProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'var(--gradient-primary)' }}
                />
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-[color:var(--text-primary)]">Budget Alerts</p>
                  <p className="text-xs text-[color:var(--text-secondary)]">Action needed</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold" style={{ color: totals.riskCount > 0 ? '#EF4444' : '#10B981' }}>
                    {totals.riskCount}
                  </p>
                  <p className="text-xs text-[color:var(--text-tertiary)]">categories</p>
                </div>
              </div>
              <div className="space-y-2">
                {['warning', 'critical', 'exceeded'].map((statusKey) => {
                  const count = displayBudgets.filter((b) => b.status === statusKey).length;
                  if (!count) return null;
                  const meta = getStatusMeta(statusKey);
                  return (
                    <div key={statusKey} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                        <span style={{ color: meta.color }}>{meta.label}</span>
                      </div>
                      <span className="text-[color:var(--text-secondary)]">{count} categories</span>
                    </div>
                  );
                })}
                {totals.riskCount === 0 && (
                  <div className="text-xs text-[color:var(--text-secondary)]">
                    All categories are within target.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[color:var(--text-primary)]">Alignment</p>
                  <p className="text-xs text-[color:var(--text-secondary)]">Against your thresholds</p>
                </div>
                <TrendingUp className="h-5 w-5 text-[color:var(--accent-color)]" />
              </div>

              <div className="mt-4 rounded-xl border border-[color:var(--border-color)] bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)]">Alignment score</p>
                    <p className="text-2xl font-semibold text-[color:var(--text-primary)]">{alignment.score}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[color:var(--text-secondary)]">Within threshold</p>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {alignment.withinThreshold} of {displayBudgets.length}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[color:var(--color-bg-tertiary)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${alignment.score}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: 'var(--gradient-primary)' }}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {alignment.actions.length > 0 ? (
                  alignment.actions.map((action, index) => (
                    <div key={`${action.title}-${index}`} className="rounded-xl border border-[color:var(--border-color)] bg-white/70 p-3">
                      <p className="text-xs font-semibold text-[color:var(--text-primary)]">{action.title}</p>
                      <p className="text-xs text-[color:var(--text-secondary)] mt-1">{action.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-[color:var(--text-secondary)]">
                    You are aligned with your budget thresholds. Keep it up.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {displayBudgets.map((budget, index) => {
            const Icon = getCategoryIcon(budget.category);
            const statusMeta = getStatusMeta(budget.status);
            const safePercentage = Math.min(Math.max(budget.percentage || 0, 0), 100);
            const remaining = budget.remaining;

            return (
              <motion.div
                key={budget.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card hover-lift rounded-2xl p-5 relative"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${statusMeta.color}15` }}
                  >
                    <Icon size={22} style={{ color: statusMeta.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-[color:var(--text-primary)] truncate">
                          {budget.category}
                        </h3>
                        <p className="text-xs text-[color:var(--text-secondary)]">
                          {budget.period ? `${budget.period.charAt(0).toUpperCase()}${budget.period.slice(1)}` : 'Monthly'} budget
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit({
                            id: budget.id,
                            category: budget.category,
                            amount: budget.amount,
                            period: budget.period,
                            alertThreshold: budget.alertThreshold,
                          })}
                          className="text-xs font-semibold text-[color:var(--accent-color)] hover:opacity-80"
                        >
                          Adjust
                        </button>
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            color: statusMeta.color,
                            backgroundColor: `${statusMeta.color}15`,
                          }}
                        >
                          {statusMeta.label}
                        </span>
                        <button
                          onClick={() => setActiveMenu(activeMenu === budget.id ? null : budget.id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                        >
                          <MoreHorizontal size={18} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-[color:var(--text-secondary)] mb-2">
                        <span>{formatCurrency(budget.spent)} spent</span>
                        <span>{safePercentage}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden bg-[color:var(--color-bg-tertiary)]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${safePercentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: statusMeta.color }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-[color:var(--text-secondary)]">
                        {formatCurrency(budget.spent)} of {formatCurrency(budget.amount)}
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: remaining < 0 ? '#EF4444' : 'var(--text-secondary)' }}
                      >
                        {remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining))} left
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-[color:var(--text-tertiary)]">
                      <span>Alert at {budget.alertThreshold ?? 80}%</span>
                      <span>Status: {statusMeta.label}</span>
                    </div>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {activeMenu === budget.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-4 top-16 z-20 rounded-xl shadow-lg overflow-hidden"
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} className="text-red-500" />
                        <span className="text-sm font-medium text-red-500">Delete</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {displayBudgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 px-6 glass-card"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <TrendingUp size={40} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[color:var(--text-primary)]">
            Start your first budget
          </h3>
          <p className="text-sm mb-6 max-w-sm mx-auto text-[color:var(--text-secondary)]">
            Create category budgets and track every spend with fintech-grade clarity.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-[#4285F4] to-[#5A9FFF] shadow-lg shadow-blue-500/20 hover:opacity-90"
          >
            <Plus size={20} />
            Create Budget
          </motion.button>
        </motion.div>
      )}

      {/* Click outside to close menu */}
      {activeMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setActiveMenu(null)}
        />
      )}

      {/* Budget Form Modal */}
      <BudgetForm
        isOpen={isFormOpen}
        editingBudget={editingBudget}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBudget(null);
        }}
      />
    </div>
  );
};

export default BudgetOverview;
