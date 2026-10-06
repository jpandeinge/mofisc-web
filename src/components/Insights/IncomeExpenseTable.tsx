// src/components/Insights/IncomeExpenseTable.tsx

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { compareAsc, format, parseISO } from 'date-fns';
import {
	  ChevronDown,
} from 'lucide-react';
import { FaRegFilePdf } from "react-icons/fa";
import { RiFileExcel2Line } from "react-icons/ri";
import { Transaction } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { downloadExcel, downloadPDF } from '../../utils/downloadUtils';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { useStatementContext } from '../../context/StatementContext';
import {
  INCOME_CATEGORIES,
  DEBT_CATEGORIES,
  DEDUCTIONS_CATEGORIES,
  DEBT_OBLIGATIONS,
  HOUSEHOLD_AND_OTHER_EXPENSES,
  EXCLUDED_CATEGORIES
} from '../../config/categoryConstants';

import '../../styles/IncomeExpenseTable.css';

interface IncomeExpenseTableProps {
  transactions: Transaction[];
}

const IncomeExpenseTable: React.FC<IncomeExpenseTableProps> = ({ transactions }) => {
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const { effectivePlan, subscription } = useSubscription();
  const { selectedBank } = useStatementContext();

  const createIncomeExpenseTable = useMemo(() => {
    const df = transactions.map((t: Transaction) => ({
      date: parseISO(t.transaction_date),
      amount: t.transaction_amount,
      category: t.category,
      transactiontype: t.transaction_type.toLowerCase(),
    }));

    const groupData = (categories: string[], transactionType: string) => {
      return df.filter(t => categories.includes(t.category) && t.transactiontype === transactionType);
    };

    const income = groupData(INCOME_CATEGORIES, 'credit');
    const otherIncome = df.filter(t => !INCOME_CATEGORIES.concat(DEBT_CATEGORIES, HOUSEHOLD_AND_OTHER_EXPENSES).includes(t.category) && t.transactiontype === 'credit');
    const expenses = groupData(HOUSEHOLD_AND_OTHER_EXPENSES.concat(DEBT_OBLIGATIONS), 'debit');
    const otherExpenses = df.filter(t => !INCOME_CATEGORIES.concat(DEDUCTIONS_CATEGORIES, HOUSEHOLD_AND_OTHER_EXPENSES, DEBT_OBLIGATIONS).includes(t.category) && t.transactiontype === 'debit');

    const createPivotTable = (data: any[]) => {
      const pivotTable: { [key: string]: { [key: string]: number } } = {};
      data.forEach(t => {
        const month = format(t.date, 'MMM-yy');
        if (!pivotTable[t.category]) pivotTable[t.category] = {};
        pivotTable[t.category][month] = (pivotTable[t.category][month] || 0) + t.amount;
      });
      return pivotTable;
    };

    const allMonths = Array.from(new Set(
      df.map(t => format(t.date, 'MMM-yy'))
    )).sort((a, b) => compareAsc(parseISO(`01-${a}`), parseISO(`01-${b}`)));

    const incomePivot = createPivotTable(income);
    const otherIncomePivot = createPivotTable(otherIncome);
    const expensesPivot = createPivotTable(expenses);
    const otherExpensesPivot = createPivotTable(otherExpenses);

    const calculateTotals = (pivot: any) => {
      return allMonths.reduce((acc, month) => {
        acc[month] = Object.values(pivot).reduce((sum: number, cat: any) => sum + (cat[month] || 0), 0);
        return acc;
      }, {} as { [key: string]: number });
    };

    const totalIncome = calculateTotals({ ...incomePivot, ...otherIncomePivot });
    const totalExpenses = calculateTotals({ ...expensesPivot, ...otherExpensesPivot });
    const excludedTotals = calculateTotals(
      Object.fromEntries(Object.entries(otherExpensesPivot).filter(([key]) => EXCLUDED_CATEGORIES.includes(key)))
    );
    const surplusIncome = allMonths.reduce((acc, month) => {
      acc[month] = totalIncome[month] - (totalExpenses[month] - (excludedTotals[month] || 0));
      return acc;
    }, {} as { [key: string]: number });

    return { incomePivot, otherIncomePivot, expensesPivot, otherExpensesPivot, allMonths, totalIncome, totalExpenses, surplusIncome };
  }, [transactions]);

  const { incomePivot, otherIncomePivot, expensesPivot, otherExpensesPivot, allMonths, totalIncome, totalExpenses, surplusIncome } = createIncomeExpenseTable;

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleDownload = async (type: 'pdf' | 'excel') => {
    const tableData = [
      ['Category', ...allMonths],
      ...Object.entries(incomePivot).map(([category, amounts]) =>
        [category, ...allMonths.map(month => formatCurrency(amounts[month] || 0))]
      ),
      ['Other Income'],
      ...Object.entries(otherIncomePivot).map(([category, amounts]) =>
        [category, ...allMonths.map(month => formatCurrency(amounts[month] || 0))]
      ),
      ['Expenses'],
      ...Object.entries(expensesPivot).map(([category, amounts]) =>
        [category, ...allMonths.map(month => formatCurrency(amounts[month] || 0))]
      ),
      ['Other Expenses'],
      ...Object.entries(otherExpensesPivot).map(([category, amounts]) =>
        [category, ...allMonths.map(month => formatCurrency(amounts[month] || 0))]
      ),
      ['Summary'],
      ['Total Monthly Income', ...allMonths.map(month => formatCurrency(totalIncome[month]))],
      ['Total Monthly Expense', ...allMonths.map(month => formatCurrency(totalExpenses[month]))],
      ['Surplus Income', ...allMonths.map(month => formatCurrency(surplusIncome[month]))],
    ];

    if (type === 'pdf') {
      const plan = (effectivePlan || subscription?.plan || 'free').toLowerCase();
      const basePlanLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
      const planLabel =
        (subscription?.isTrial === true || subscription?.status === 'trialing') && plan !== 'free'
          ? `${basePlanLabel} Trial`
          : basePlanLabel;
      const bankLabel = selectedBank ? selectedBank.toUpperCase() : undefined;
      const userName =
        (user as any)?.profile?.full_name ||
        (user as any)?.user_metadata?.full_name ||
        (user?.email ? user.email.split('@')[0] : undefined);

      const filters: string[] = [];
      if (transactions.length > 0) {
        const dates = transactions
          .map((t) => {
            try {
              return parseISO(t.transaction_date);
            } catch {
              return new Date(NaN);
            }
          })
          .filter((d) => !Number.isNaN(d.getTime()));
        if (dates.length > 0) {
          const min = new Date(Math.min(...dates.map((d) => d.getTime())));
          const max = new Date(Math.max(...dates.map((d) => d.getTime())));
          // timeframe is represented as "Period" in the header for a more professional export
          const periodStart = min;
          const periodEnd = max;

          await downloadPDF(tableData, 'income_expense_table', false, {
            reportTitle: 'Income & Expenses',
            accountLabel: 'Personal Account',
            userName,
            planLabel,
            bankLabel,
            periodStart,
            periodEnd,
            filters,
            generatedAt: new Date(),
          });
          return;
        }
      }

      await downloadPDF(tableData, 'income_expense_table', false, {
        reportTitle: 'Income & Expenses',
        accountLabel: 'Personal Account',
        userName,
        planLabel,
        bankLabel,
        filters,
        generatedAt: new Date(),
      });
    } else {
      downloadExcel(tableData, 'income_expense_table', false);
    }
  };

  const renderSectionRow = (
    rowKey: string,
    category: string,
    amounts: any,
    type: 'income' | 'expense' = 'income'
  ) => (
    <tr
      key={rowKey}
      className="hover:bg-[#FFFFFF]/30 transition-colors"
    >
      <td className="sticky left-0 z-10 bg-[#F1F3F4]/95 backdrop-blur-sm px-3 py-2 text-2xs text-[#174EA6] font-medium border-b border-[#5F6368]/20">
        {category}
      </td>
      {allMonths.map(month => (
        <td
          key={month}
          className={`px-3 py-1 text-right text-2xs border-b border-[#5F6368]/20 whitespace-nowrap ${
            type === 'income' ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatCurrency(amounts[month] || 0)}
        </td>
      ))}
    </tr>
  );

  // Update the render section method to include collapsible sections
  const renderSection = (title: string, data: any, type: 'income' | 'expense' = 'income') => (
    <>
      <tr>
        <th
          colSpan={allMonths.length + 1}
          className="sticky left-0 bg-[#FFFFFF]/95 backdrop-blur-sm border-b border-[#5F6368]/20"
        >
          <button
            onClick={() => toggleSection(title)}
            className="w-full px-3 py-2 text-left text-2xs font-medium text-[#174EA6] flex items-center gap-2 hover:bg-[#5F6368]/20 transition-colors"
          >
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                collapsedSections[title] ? '-rotate-90' : ''
              }`}
            />
            {title}
          </button>
        </th>
      </tr>
      {!collapsedSections[title] &&
        Object.entries(data).map(([category, amounts], idx) =>
          renderSectionRow(`${title}:${String(category)}:${idx}`, category, amounts, type)
        )}
    </>
  );

  // Update the render summary section method
  const renderSummarySection = () => (
    <tr className="sticky bottom-0 bg-[#F1F3F4]/95 backdrop-blur-lg">
      <td colSpan={allMonths.length + 1}>
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <th
                colSpan={allMonths.length + 1}
                className="sticky left-0 bg-[#FFFFFF]/95 backdrop-blur-sm px-3 py-3 text-left text-2xs font-medium text-[#174EA6] border-b border-[#5F6368]/20"
              >
                Summary
              </th>
            </tr>
            <tr>
              <td className="sticky left-0 bg-[#F1F3F4]/95 backdrop-blur-sm px-3 py-2 text-2xs text-[#174EA6] font-medium border-b border-[#5F6368]/20">
                Total Monthly Income
              </td>
              {allMonths.map(month => (
                <td key={month} className="px-3 py-1 text-right text-2xs text-emerald-400 border-b border-[#5F6368]/20">
                  {formatCurrency(totalIncome[month])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 bg-[#F1F3F4]/95 backdrop-blur-sm px-3 py-2 text-2xs text-[#174EA6] font-medium border-b border-[#5F6368]/20">
                Total Monthly Expense
              </td>
              {allMonths.map(month => (
                <td key={month} className="px-3 py-1 text-right text-2xs text-rose-400 border-b border-[#5F6368]/20">
                  {formatCurrency(totalExpenses[month])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 bg-[#F1F3F4]/95 backdrop-blur-sm px-3 py-2 text-2xs text-[#174EA6] font-medium border-b border-[#5F6368]/20">
                Surplus Income
              </td>
              {allMonths.map(month => (
                <td key={month} className={`px-3 py-1 text-right text-2xs border-b border-[#5F6368]/20 ${
                  surplusIncome[month] >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatCurrency(surplusIncome[month])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );

  return (
    <div className="w-full bg-[#F1F3F4]/95 rounded-lg border border-[#5F6368]/20 backdrop-blur-lg overflow-hidden" style={{ height: '380px' }}>
      {/* Ambient background effects */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#4285F4]/20 rounded-full blur-3xl" />

      {/* Header with export buttons */}
      <div className="flex justify-between items-center px-4 py-2 border-b border-[#5F6368]/20 bg-[#F1F3F4]/95 backdrop-blur-lg">
        <h2 className="text-sm font-semibold text-[#174EA6]">Income and Expense Table</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => void handleDownload('excel')}
            className="p-1.5 rounded-lg bg-[#FFFFFF]/50 hover:bg-[#5F6368]/20 transition-colors"
          >
            <RiFileExcel2Line className="w-3.5 h-3.5 text-emerald-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => void handleDownload('pdf')}
            className="p-1.5 rounded-lg bg-[#FFFFFF]/50 hover:bg-[#5F6368]/20 transition-colors"
          >
            <FaRegFilePdf className="w-3.5 h-3.5 text-rose-400" />
          </motion.button>
        </div>
      </div>

      {/* Table Container with fixed height - scrollable */}
      <div className="relative overflow-auto" style={{ height: 'calc(380px - 48px)' }}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-50">
            <tr className="bg-[#FFFFFF]/95 backdrop-blur-lg">
              <th className="sticky left-0 z-50 px-3 py-3 text-left text-2xs font-medium text-[#174EA6] border-b border-[#5F6368]/20 bg-[#FFFFFF]/95 backdrop-blur-lg">
                Category
              </th>
              {allMonths.map(month => (
                <th
                  key={month}
                  className="px-3 py- text-right text-2xs font-medium text-[#174EA6] border-b border-[#5F6368]/20 whitespace-nowrap bg-[#FFFFFF]/95 backdrop-blur-lg"
                >
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-2xs">
            {renderSection('Income', incomePivot, 'income')}
            {renderSection('Other Income', otherIncomePivot, 'income')}
            {renderSection('Expenses', expensesPivot, 'expense')}
            {renderSection('Other Expenses', otherExpensesPivot, 'expense')}
            <tr aria-hidden="true">
              <td colSpan={allMonths.length + 1} className="h-2" />
            </tr>
            {renderSummarySection()}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default IncomeExpenseTable;
