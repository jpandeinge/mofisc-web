// src/components/Overview/FinancialMetricsGrid.tsx

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  PiggyBank,
  DollarSign,
  BarChart2,
  HelpCircle
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface FinancialMetricsGridProps {
  metrics: {
    healthScore: number;
    dtiScore: number;
    savingsScore: number;
    cashFlowScore: number;
  };
  isLoading?: boolean;
}

const tooltipContent = {
  financialHealth: {
    text: "Comprehensive financial health score based on savings rate, debt-to-income ratio, cash flow, and emergency funds",
    ranges: [
      { range: "80-100", desc: "Excellent financial health - Strong position" },
      { range: "60-79", desc: "Good financial standing - On track" },
      { range: "0-59", desc: "Needs attention - Consider financial improvements" }
    ]
  },
  dtiRatio: {
    text: "Debt health score based on monthly debt payments vs income. Higher score = lower debt burden",
    ranges: [
      { range: "85-100", desc: "Excellent - DTI under 35%, very low debt burden" },
      { range: "65-84", desc: "Good - DTI 36-43%, manageable debt levels" },
      { range: "40-64", desc: "Fair - DTI 44-50%, consider debt reduction" },
      { range: "0-39", desc: "Poor - DTI over 50%, focus on debt reduction" }
    ]
  },
  savingsRate: {
    text: "Percentage of income saved after expenses. Higher is better for financial security",
    ranges: [
      { range: "20%+", desc: "Excellent - Building wealth effectively" },
      { range: "10-19%", desc: "Good - Solid saving progress" },
      { range: "5-9%", desc: "Fair - Room for improvement" },
      { range: "0-4%", desc: "Poor - Consider increasing savings" }
    ]
  },
  cashFlow: {
    text: "How well your income covers expenses with buffer room. Higher score = better financial cushion",
    ranges: [
      { range: "90-100", desc: "Excellent - Expenses under 70% of income" },
      { range: "70-89", desc: "Good - Expenses 70-80% of income" },
      { range: "50-69", desc: "Fair - Expenses 80-90% of income" },
      { range: "20-49", desc: "Poor - Expenses 90-100% of income" },
      { range: "0-19", desc: "Critical - Expenses exceed income" }
    ]
  }
};

interface ScoreRange {
  min: number;
  max: number;
  color: string;
}

const getScoreRanges = (type: string): ScoreRange[] => {
  switch(type) {
    case 'dtiRatio':
      return [
        { min: 85, max: 100, color: '#22C55E' }, // Excellent - Green
        { min: 65, max: 84, color: '#F59E0B' },  // Good - Amber
        { min: 40, max: 64, color: '#FB923C' },  // Fair - Orange
        { min: 0, max: 39, color: '#EF4444' }    // Poor - Red
      ];
    case 'cashFlow':
      return [
        { min: 90, max: 100, color: '#22C55E' }, // Excellent - Green
        { min: 70, max: 89, color: '#3B82F6' },  // Good - Blue
        { min: 50, max: 69, color: '#F59E0B' },  // Fair - Amber
        { min: 20, max: 49, color: '#FB923C' },  // Poor - Orange
        { min: 0, max: 19, color: '#EF4444' }    // Critical - Red
      ];
    case 'savingsRate':
      return [
        { min: 20, max: 100, color: '#22C55E' }, // Excellent - Green
        { min: 10, max: 19, color: '#3B82F6' },  // Good - Blue
        { min: 5, max: 9, color: '#F59E0B' },    // Fair - Amber
        { min: 0, max: 4, color: '#EF4444' }     // Poor - Red
      ];
    default: // financialHealth
      return [
        { min: 80, max: 100, color: '#22C55E' }, // Excellent - Green
        { min: 60, max: 79, color: '#3B82F6' },  // Good - Blue
        { min: 0, max: 59, color: '#F59E0B' }    // Needs Work - Amber
      ];
  }
};

const getColorForScore = (type: string, value: number): string => {
  const ranges = getScoreRanges(type);
  const range = ranges.find(r => value >= r.min && value <= r.max);
  return range ? range.color : '#6B7280'; // Default gray if no range matches
};

const MetricTooltip: React.FC<{
  type: keyof typeof tooltipContent;
}> = ({ type }) => {
  const content = tooltipContent[type];

  return (
    <div className="p-2 max-w-xs">
      <p className="text-[11px] mb-2">{content.text}</p>
      <div className="space-y-1">
        {content.ranges.map((range, idx) => (
          <div key={idx} className="flex items-center text-[10px] gap-1">
            <span className="font-medium">{range.range}:</span>
            <span className="text-[#5F6368]">{range.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactElement<any>;
  description: string;
  type: string;
  tooltipContent: React.ReactNode;
  color: string;
  isLoading?: boolean;
}> = ({ title, value, icon, description, tooltipContent, color, isLoading = false }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="relative bg-[#F1F3F4] rounded-lg p-3 overflow-hidden border border-[#FFFFFF]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg bg-opacity-10"
            style={{ backgroundColor: `${color}20` }}
          >
            {React.cloneElement(icon, {
              className: "w-3.5 h-3.5",
              style: { color }
            })}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-2xs font-medium text-[#174EA6] truncate">
                {title}
              </h3>
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button className="text-[#5F6368] hover:text-[#174EA6] transition-colors">
                      <HelpCircle size={12} />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="max-w-xs bg-[#FFFFFF] text-[#174EA6] text-[10px] px-2 py-1 rounded shadow-lg border border-[#5F6368]"
                      sideOffset={5}
                    >
                      {tooltipContent}
                      <Tooltip.Arrow className="fill-[#FFFFFF]" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            </div>
            <p className="text-[10px] text-[#5F6368] truncate">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="relative w-10 h-10">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="20"
                cy="20"
                r="16"
                strokeWidth="2.5"
                fill="none"
                className="stroke-[#FFFFFF]"
              />
              {isLoading ? (
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  strokeWidth="2.5"
                  fill="none"
                  stroke="#5F6368"
                  strokeLinecap="round"
                  className="animate-pulse"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 16}`,
                    strokeDashoffset: `${2 * Math.PI * 16 * 0.7}`,
                  }}
                />
              ) : (
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  strokeWidth="2.5"
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 16}`,
                    strokeDashoffset: `${2 * Math.PI * 16 * (1 - value / 100)}`,
                    transition: 'stroke-dashoffset 0.5s ease-in-out'
                  }}
                />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {isLoading ? (
                <div className="w-4 h-3 bg-white/10 rounded animate-pulse" />
              ) : (
                <motion.span
                  key={value}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs font-bold leading-none"
                  style={{ color }}
                >
                  {value}
                </motion.span>
              )}
            </div>
          </div>

          <div className="flex-1 ml-3">
            <div className="h-1 rounded-full bg-[#FFFFFF] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isLoading ? '30%' : `${value}%` }}
                transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] as const }}
                className={`h-full rounded-full ${isLoading ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: isLoading ? '#5F6368' : color }}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -right-4 -bottom-4 w-12 h-12 rounded-full opacity-10 blur-xl"
        style={{ background: color }}
      />
    </motion.div>
  );
};

const FinancialMetricsGrid: React.FC<FinancialMetricsGridProps> = ({ metrics, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      <MetricCard
        title="Financial Health"
        value={Math.round(metrics.healthScore)}
        icon={<TrendingUp />}
        description="Overall financial wellbeing"
        type="financialHealth"
        tooltipContent={<MetricTooltip type="financialHealth" />}
        color={getColorForScore('financialHealth', metrics.healthScore)}
        isLoading={isLoading}
      />
      <MetricCard
        title="DTI Ratio"
        value={Math.round(metrics.dtiScore)}
        icon={<DollarSign />}
        description="Debt-to-income health"
        type="dtiRatio"
        tooltipContent={<MetricTooltip type="dtiRatio" />}
        color={getColorForScore('dtiRatio', metrics.dtiScore)}
        isLoading={isLoading}
      />
      <MetricCard
        title="Savings Rate"
        value={Math.round(metrics.savingsScore)}
        icon={<PiggyBank />}
        description="Savings effectiveness"
        type="savingsRate"
        tooltipContent={<MetricTooltip type="savingsRate" />}
        color={getColorForScore('savingsRate', metrics.savingsScore)}
        isLoading={isLoading}
      />
      <MetricCard
        title="Cash Flow"
        value={Math.round(metrics.cashFlowScore)}
        icon={<BarChart2 />}
        description="Income vs. expenses"
        type="cashFlow"
        tooltipContent={<MetricTooltip type="cashFlow" />}
        color={getColorForScore('cashFlow', metrics.cashFlowScore)}
        isLoading={isLoading}
      />
    </div>
  );
};

export default FinancialMetricsGrid;