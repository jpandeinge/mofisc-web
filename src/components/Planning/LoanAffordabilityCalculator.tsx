// src/components/Planning/LoanAffordabilityCalculator.tsx

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Car, Home } from 'lucide-react';
import MortgageCalculator from './MortgageCalculator';
import PersonalLoanCalculator from './PersonalLoanCalculator';
import VehicleFinanceCalculator from './VehicleFinanceCalculator';
import { useLoanContext } from '../../context/LoanContext';
import { formatCurrency } from '../../utils/formatters';

const LoanAffordabilityCalculator: React.FC = () => {
  const [selectedLoanType, setSelectedLoanType] = useState<string>('personal');
  const [income] = useState<number>(0);
  const [expenses] = useState<number>(0);
  const { personalLoan, vehicleFinance, mortgage } = useLoanContext();

  const loanTypes = [
    {
      value: 'personal',
      label: 'Personal Loan',
      icon: CreditCard,
      description: 'Flexible lending for everyday needs',
    },
    {
      value: 'vehicle',
      label: 'Vehicle Finance',
      icon: Car,
      description: 'Plan repayments for your next car',
    },
    {
      value: 'mortgage',
      label: 'Mortgage',
      icon: Home,
      description: 'Estimate home loan affordability',
    },
  ];

  const renderCalculator = () => {
    switch (selectedLoanType) {
      case 'personal':
        return <PersonalLoanCalculator income={income} expenses={expenses} />;
      case 'vehicle':
        return <VehicleFinanceCalculator income={income} expenses={expenses} />;
      case 'mortgage':
        return <MortgageCalculator income={income} expenses={expenses} />;
      default:
        return null;
    }
  };

  const comparisonItems = useMemo(() => {
    const items = [];
    if (personalLoan.feedback) {
      items.push({
        id: 'personal',
        label: 'Personal Loan',
        monthly: personalLoan.feedback.monthlyRepayments,
        total: personalLoan.feedback.totalRepayments,
        interest: personalLoan.feedback.totalInterestPaid,
      });
    }
    if (vehicleFinance.feedback) {
      items.push({
        id: 'vehicle',
        label: 'Vehicle Finance',
        monthly: vehicleFinance.feedback.monthlyRepayments,
        total: vehicleFinance.feedback.totalRepayments,
        interest: vehicleFinance.feedback.totalInterestPaid,
      });
    }
    if (mortgage.feedback) {
      items.push({
        id: 'mortgage',
        label: 'Mortgage',
        monthly: mortgage.feedback.monthlyRepayments,
        total: mortgage.feedback.totalRepayments,
        interest: mortgage.feedback.totalInterestPaid,
      });
    }
    return items;
  }, [personalLoan.feedback, vehicleFinance.feedback, mortgage.feedback]);

  const bestMonthly = useMemo(() => {
    if (!comparisonItems.length) return null;
    return comparisonItems.reduce((best, item) =>
      item.monthly < best.monthly ? item : best
    );
  }, [comparisonItems]);

  const lowestTotal = useMemo(() => {
    if (!comparisonItems.length) return null;
    return comparisonItems.reduce((best, item) =>
      item.total < best.total ? item : best
    );
  }, [comparisonItems]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card relative overflow-hidden p-6"
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[color:var(--accent-color)]/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[color:var(--color-primary-light)]/20 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="heading-md text-[color:var(--text-primary)]">Tools</h2>
            <p className="body-sm text-[color:var(--text-secondary)] mt-1">
              Compare repayment scenarios before you commit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {loanTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedLoanType === type.value;

              return (
                <motion.button
                  key={type.value}
                  onClick={() => setSelectedLoanType(type.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative overflow-hidden p-4 rounded-xl border transition-all text-left"
                  style={{
                    borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                    background: isSelected ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'var(--color-primary-lighter)',
                      }}
                    >
                      <Icon
                        className="w-4 h-4"
                        style={{ color: isSelected ? '#FFFFFF' : 'var(--accent-color)' }}
                      />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isSelected ? '#FFFFFF' : 'var(--text-primary)' }}
                      >
                        {type.label}
                      </p>
                      <p
                        className="text-xs mt-1"
                        style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)' }}
                      >
                        {type.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedLoanType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCalculator()}
        </motion.div>
      </AnimatePresence>

      <div className="glass-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-[color:var(--text-primary)]">Comparison Summary</h3>
            <p className="text-sm text-[color:var(--text-secondary)] mt-1">
              Review the lowest monthly cost and total repayment impact.
            </p>
          </div>
          {bestMonthly && lowestTotal && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-[color:var(--color-primary-lighter)] text-[color:var(--color-primary-dark)] font-semibold">
                Best monthly: {bestMonthly.label}
              </span>
              <span className="px-3 py-1 rounded-full bg-[color:var(--color-bg-tertiary)] text-[color:var(--text-secondary)] font-semibold">
                Lowest total: {lowestTotal.label}
              </span>
            </div>
          )}
        </div>

        {comparisonItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {comparisonItems.map((item) => {
              const isBest = bestMonthly?.id === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: isBest ? 'var(--accent-color)' : 'var(--border-color)',
                    backgroundColor: isBest ? 'var(--color-primary-lighter)' : 'var(--bg-secondary)',
                  }}
                >
                  <p className="text-xs text-[color:var(--text-secondary)] mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                    {formatCurrency(item.monthly)} / month
                  </p>
                  <p className="text-xs text-[color:var(--text-tertiary)] mt-2">
                    Total repayments: {formatCurrency(item.total)}
                  </p>
                  <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
                    Interest: {formatCurrency(item.interest)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 text-sm text-[color:var(--text-secondary)]">
            Run at least one calculation to compare options.
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanAffordabilityCalculator;
