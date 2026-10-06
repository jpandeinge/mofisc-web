// src/components/Planning/MortgageCalculator.tsx

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, RefreshCw, Home, Building, Wallet, DollarSign, Calendar, Percent } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useLoanContext } from '../../context/LoanContext';
import { useCalculatorTracking } from '../../hooks/useCalculatorTracking';

interface MortgageCalculatorProps {
  income: number;
  expenses: number;
}

const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({ income: _income, expenses: _expenses }) => {
  const { mortgage, updateMortgage, setMortgageFeedback } = useLoanContext();
  const { trackCalculatorUse } = useCalculatorTracking();
  const [loanAmountNumeric, setLoanAmountNumeric] = useState<number>(0);
  const [depositNumeric, setDepositNumeric] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setLoanAmountNumeric(parseFloat(mortgage.loanAmount.replace(/[^\d.-]/g, '')) || 0);
    setDepositNumeric(parseFloat(mortgage.deposit.replace(/[^\d.-]/g, '')) || 0);
  }, [mortgage.loanAmount, mortgage.deposit]);

  const formatInputCurrency = (value: string) => {
    const numberValue = value.replace(/\D/g, '');
    return new Intl.NumberFormat('en-NA', {
      style: 'decimal',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(Number(numberValue));
  };

  const handleCurrencyInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatInputCurrency(e.target.value);
    updateMortgage(field, formattedValue);
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    const principal = loanAmountNumeric - depositNumeric;
    const rate = parseFloat(mortgage.interestRate) / 100 / 12;
    const periods = parseFloat(mortgage.repaymentPeriod) * 12;

    if (isNaN(principal) || isNaN(rate) || isNaN(periods)) {
      setIsCalculating(false);
      return;
    }

    const monthlyPayment = (principal * rate * Math.pow(1 + rate, periods)) /
      (Math.pow(1 + rate, periods) - 1);
    const totalPayment = monthlyPayment * periods;
    const totalInterest = totalPayment - principal;

    const outputs = {
      loanAmount: principal,
      monthlyRepayments: monthlyPayment,
      minimumMonthlyIncome: monthlyPayment * 3,
      numberOfPayments: periods,
      totalInterestPaid: totalInterest,
      totalRepayments: totalPayment,
      totalRepaymentsMade: totalPayment,
    };

    setMortgageFeedback(outputs);

    trackCalculatorUse(
      'mortgage',
      {
        loanAmount: loanAmountNumeric,
        deposit: depositNumeric,
        interestRate: parseFloat(mortgage.interestRate),
        repaymentPeriod: parseFloat(mortgage.repaymentPeriod)
      },
      outputs,
      { calculationTime: new Date().toISOString() }
    );

    setTimeout(() => setIsCalculating(false), 500);
  };

  const handleReset = () => {
    updateMortgage('loanAmount', '');
    updateMortgage('deposit', '');
    updateMortgage('interestRate', '');
    updateMortgage('repaymentPeriod', '');
    setMortgageFeedback(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        className="glass-card relative overflow-hidden p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[color:var(--accent-color)]/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[color:var(--color-primary-light)]/20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-4">
          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-2 block">
              Required Loan Amount <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--text-tertiary)]">N$</span>
              <input
                type="text"
                value={mortgage.loanAmount}
                onChange={handleCurrencyInputChange('loanAmount')}
                className="w-full pl-10 pr-4 py-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] rounded-xl text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/40 transition-all"
                placeholder="1,000,000"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[color:var(--text-secondary)] mb-2 block">Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--text-tertiary)]">N$</span>
              <input
                type="text"
                value={mortgage.deposit}
                onChange={handleCurrencyInputChange('deposit')}
                className="w-full pl-10 pr-4 py-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] rounded-xl text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/40 transition-all"
                placeholder="200,000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[color:var(--text-secondary)] mb-2 block">
                Interest Rate <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={mortgage.interestRate}
                  onChange={(e) => updateMortgage('interestRate', e.target.value)}
                  className="w-full pl-4 pr-8 py-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] rounded-xl text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/40 transition-all"
                  placeholder="11"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[color:var(--text-tertiary)]">%</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-[color:var(--text-secondary)] mb-2 block">
                Repayment Period <span className="text-rose-500">*</span>
              </label>
              <select
                value={mortgage.repaymentPeriod}
                onChange={(e) => updateMortgage('repaymentPeriod', e.target.value)}
                className="w-full px-4 py-3 bg-[color:var(--bg-secondary)] border border-[color:var(--border-color)] rounded-xl text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent-color)]/40 transition-all appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%235C5470' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.2em 1.2em',
                  paddingRight: '2.5rem'
                }}
              >
                <option value="">Select period</option>
                {[5, 10, 15, 20, 25, 30].map((years) => (
                  <option key={years} value={years.toString()}>
                    {years} years
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCalculate}
              disabled={isCalculating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Calculator className="w-4 h-4" />
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[color:var(--bg-secondary)] rounded-xl text-sm font-medium text-[color:var(--text-secondary)] border border-[color:var(--border-color)] hover:text-[color:var(--text-primary)] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </motion.button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {mortgage.feedback ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card relative overflow-hidden p-6"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[color:var(--accent-color)]/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[color:var(--color-primary-light)]/20 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-color)] bg-white/70">
                <div>
                  <p className="text-xs text-[color:var(--text-secondary)] mb-1">Loan Amount</p>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                    {formatCurrency(mortgage.feedback.loanAmount)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[color:var(--color-primary-light)]/60">
                  <Home className="w-4 h-4 text-[color:var(--accent-color)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-color)] bg-white/70">
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-1">Monthly Repayment</p>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {formatCurrency(mortgage.feedback.monthlyRepayments)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[color:var(--color-primary-light)]/60">
                    <Wallet className="w-4 h-4 text-[color:var(--accent-color)]" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-color)] bg-white/70">
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-1">Minimum Income</p>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {formatCurrency(mortgage.feedback.minimumMonthlyIncome)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[color:var(--color-primary-light)]/60">
                    <DollarSign className="w-4 h-4 text-[color:var(--accent-color)]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-color)] bg-white/70">
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-1">Number of Payments</p>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {mortgage.feedback.numberOfPayments}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-[color:var(--color-primary-light)]/60">
                    <Calendar className="w-4 h-4 text-[color:var(--accent-color)]" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-color)] bg-white/70">
                  <div>
                    <p className="text-xs text-[color:var(--text-secondary)] mb-1">Total Interest</p>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {formatCurrency(mortgage.feedback.totalInterestPaid)}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Percent className="w-4 h-4 text-rose-500" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-[color:var(--border-color)] bg-white/70">
                <div>
                  <p className="text-xs text-[color:var(--text-secondary)] mb-1">Total Repayments</p>
                  <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                    {formatCurrency(mortgage.feedback.totalRepayments)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-[color:var(--color-primary-light)]/60">
                  <Building className="w-4 h-4 text-[color:var(--accent-color)]" />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center h-full glass-card p-6"
          >
            <p className="text-sm text-[color:var(--text-secondary)]">
              Enter mortgage details to see repayment estimates.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MortgageCalculator;
