// src/components/Overview/SubscriptionDoughnutChart.tsx

import React from 'react';
import { Subscription } from '../../types/Subscriptions';
import { formatCurrency } from '../../utils/formatters';
import SubscriptionIcon from './SubscriptionIcon';

interface SubscriptionDoughnutChartProps {
  subscriptions: Subscription[];
  monthlySpend: number;
  selectedSubscription: Subscription | null;
  currentMonth: Date;
}

const SubscriptionDoughnutChart: React.FC<SubscriptionDoughnutChartProps> = ({
  subscriptions,
  monthlySpend,
  selectedSubscription,
  currentMonth
}) => {
  // Use percentage-based sizing for true responsiveness
  const viewBoxSize = 300;
  const centerX = viewBoxSize / 2;
  const centerY = viewBoxSize / 2;
  const radius = (viewBoxSize / 2) * 0.6; // Reduced to 60% to fit better with padding
  const strokeWidth = viewBoxSize * 0.06; // 6% of viewBox
  const iconSize = viewBoxSize * 0.05; // 5% of viewBox

  // Use the provided currentMonth instead of current date
  const monthDisplay = currentMonth.toLocaleString('default', { month: 'long' });

  // Filter out paused subscriptions before grouping
  const activeSubscriptions = subscriptions.filter(sub => !sub.isPaused);

  const groupedSubscriptions = activeSubscriptions.reduce((acc, sub) => {
    const existing = acc.find(s => s.name === sub.name);
    if (existing) {
      existing.amount += sub.amount;
      existing.totalSpent += sub.totalSpent;
    } else {
      acc.push({ ...sub });
    }
    return acc;
  }, [] as Subscription[]);

  groupedSubscriptions.sort((a, b) => b.amount - a.amount);
  const totalAmount = groupedSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  // Dynamic gap calculation based on number of subscriptions
  const numSubscriptions = groupedSubscriptions.length;
  const gapAngle = 0.35; // Large gap size in radians for clear separation (about 20 degrees)
  // For single subscription, only use one small gap; for multiple, apply gap between each
  const totalGaps = numSubscriptions === 1 ? 0.1 : numSubscriptions * gapAngle;

  // Total angle available for actual subscription arcs (full circle minus all gaps)
  const totalArcAngle = (2 * Math.PI) - totalGaps;

  return (
    <div className="subscription-doughnut-chart">
      <h3 className="main-title">Monthly Spent Subscriptions</h3>
      {groupedSubscriptions.length > 0 ? (
        <div className="doughnut-svg-container">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          >
            <g transform={`rotate(-90, ${centerX}, ${centerY})`}>
              {groupedSubscriptions.map((sub, index) => {
                const isSelected = selectedSubscription?.id === sub.id;

                // Calculate the angle for this subscription's arc (proportional to its amount)
                // This is a fraction of the totalArcAngle (which already excludes gaps)
                const subscriptionAngle = (sub.amount / totalAmount) * totalArcAngle;

                // Calculate cumulative angle up to this point (including previous arcs and gaps)
                const cumulativeAngle = groupedSubscriptions
                  .slice(0, index)
                  .reduce((sum, s) => {
                    const subAngle = (s.amount / totalAmount) * totalArcAngle;
                    return sum + subAngle + gapAngle;
                  }, 0);

                // Start and end angles
                const startAngle = cumulativeAngle;
                const endAngle = startAngle + subscriptionAngle;

                // Position icon near the end of the arc (75% through the arc)
                const iconAngle = startAngle + (subscriptionAngle * 0.75);
                // Icon sits on the arc path itself (same radius as the arc center line)
                const iconX = centerX + Math.cos(iconAngle) * radius;
                const iconY = centerY + Math.sin(iconAngle) * radius;

                const rotationAngle = (iconAngle * 180 / Math.PI);

                return (
                  <g key={sub.id}>
                    <path
                      d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
                      className="subscription-doughnut-chart path"
                      fill="none"
                      stroke="var(--accent-color)"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      style={{
                        opacity: isSelected ? 1 : selectedSubscription ? 0.3 : 1,
                        transition: 'opacity 0.3s ease'
                      }}
                    />
                    <g transform={`translate(${iconX}, ${iconY}) rotate(${rotationAngle})`}>
                      <foreignObject
                        x={-iconSize/2}
                        y={-iconSize/2}
                        width={iconSize}
                        height={iconSize}
                      >
                        <div className="subscription-icon-container">
                          <SubscriptionIcon subscription={sub} />
                        </div>
                      </foreignObject>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="doughnut-center-text">
            <div className="doughnut-center-label">
              Monthly Spent
            </div>
            <div className="doughnut-center-amount">
              {formatCurrency(monthlySpend)}
            </div>
          </div>
        </div>
      ) : (
        <div className="no-subscriptions-message">
          No subscriptions for the month of {monthDisplay}
        </div>
      )}
    </div>
  );
};

export default SubscriptionDoughnutChart;

// Helper functions
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadians: number) {
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}