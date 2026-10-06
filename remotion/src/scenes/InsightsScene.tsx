import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  PieChart,
  BarChart3,
  TrendingUp,
  Utensils,
  Car,
  Film,
  ShoppingCart,
  Zap,
  Brain,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '../colors';

const AnimatedBar: React.FC<{
  label: string;
  percentage: number;
  color: string;
  delay: number;
  amount: string;
  Icon: LucideIcon;
}> = ({ label, percentage, color, delay, amount, Icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const width = interpolate(barProgress, [0, 1], [0, percentage]);
  const opacity = interpolate(barProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ marginBottom: 20, opacity }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${color}12`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon size={20} color={color} strokeWidth={2} />
          </div>
          <span
            style={{
              fontSize: 16,
              color: colors.text.primary,
              fontWeight: 500,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: colors.text.primary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          N${amount}
        </span>
      </div>
      <div
        style={{
          width: '100%',
          height: 12,
          background: colors.primary.lighter,
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
            borderRadius: 6,
          }}
        />
      </div>
    </div>
  );
};

const DonutChart: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chartProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  const opacity = interpolate(chartProgress, [0, 0.3], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const categories = [
    { percentage: 35, color: '#FF6B6B', label: 'Food' },
    { percentage: 20, color: colors.primary.main, label: 'Transport' },
    { percentage: 15, color: '#4ECDC4', label: 'Entertainment' },
    { percentage: 18, color: '#F7DC6F', label: 'Shopping' },
    { percentage: 12, color: '#BB8FCE', label: 'Utilities' },
  ];

  const radius = 100;
  const strokeWidth = 28;
  const cx = 130;
  const cy = 130;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercentage = 0;

  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 24,
        padding: 28,
        boxShadow: `0 8px 32px ${colors.primary.main}08`,
        border: `1px solid ${colors.primary.light}40`,
        opacity,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <PieChart size={22} color={colors.primary.main} strokeWidth={2} />
        <span
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: colors.text.primary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Spending Breakdown
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <svg width="260" height="260" viewBox="0 0 260 260">
          {categories.map((cat, index) => {
            const segmentProgress = interpolate(
              chartProgress,
              [0.2 + index * 0.1, 0.6 + index * 0.1],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            const dashLength = (cat.percentage / 100) * circumference * segmentProgress;
            const dashOffset = -(accumulatedPercentage / 100) * circumference;
            accumulatedPercentage += cat.percentage;

            return (
              <circle
                key={index}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={cat.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
          })}
          {/* Center */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fill={colors.text.tertiary}
            fontSize="14"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Total Spent
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            fill={colors.text.primary}
            fontSize="28"
            fontWeight="700"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            N$6,420
          </text>
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map((cat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: cat.color,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  color: colors.text.secondary,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {cat.label}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: colors.text.primary,
                  fontWeight: 600,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  marginLeft: 'auto',
                }}
              >
                {cat.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InsightCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.9, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  const sparkleRotate = interpolate(frame, [0, 60], [0, 360], {
    extrapolateRight: 'extend',
  });

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
        borderRadius: 20,
        padding: 24,
        transform: `scale(${scale})`,
        opacity,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative sparkle */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          transform: `rotate(${sparkleRotate}deg)`,
          opacity: 0.3,
        }}
      >
        <Sparkles size={24} color="white" strokeWidth={1.5} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <Brain size={26} color="white" strokeWidth={1.8} />
        </div>
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              marginBottom: 6,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            AI Insight
          </p>
          <p
            style={{
              fontSize: 16,
              color: 'white',
              margin: 0,
              lineHeight: 1.5,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
            }}
          >
            Your food spending is 15% higher than last month. Consider meal planning to save N$340.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 14,
              color: 'white',
            }}
          >
            <Lightbulb size={16} strokeWidth={2} />
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'system-ui' }}>
              View suggestions
            </span>
            <ArrowRight size={14} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const InsightsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Scene entrance
  const sceneOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Title animation
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleY = interpolate(titleProgress, [0, 1], [30, 0]);

  // Exit animation
  const exitStart = durationInFrames - 0.4 * fps;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const categories = [
    { label: 'Food & Dining', percentage: 87, color: '#FF6B6B', amount: '2,247', Icon: Utensils },
    { label: 'Transport', percentage: 50, color: colors.primary.main, amount: '1,284', Icon: Car },
    { label: 'Entertainment', percentage: 38, color: '#4ECDC4', amount: '963', Icon: Film },
    { label: 'Shopping', percentage: 45, color: '#F7DC6F', amount: '1,156', Icon: ShoppingCart },
    { label: 'Utilities', percentage: 30, color: '#BB8FCE', amount: '770', Icon: Zap },
  ];

  return (
    <AbsoluteFill
      style={{
        background: colors.background.primary,
        padding: 50,
        opacity: sceneOpacity * exitOpacity,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            opacity: titleProgress,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `${colors.status.info}15`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <BarChart3 size={20} color={colors.status.info} strokeWidth={2} />
          </div>
          <span
            style={{
              fontSize: 14,
              color: colors.status.info,
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Insights
          </span>
        </div>

        <h2
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: colors.text.primary,
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            transform: `translateY(${titleY}px)`,
            opacity: titleProgress,
          }}
        >
          Understand your spending
        </h2>
      </div>

      {/* Content area */}
      <div
        style={{
          display: 'flex',
          gap: 28,
        }}
      >
        {/* Donut chart */}
        <DonutChart delay={0.2 * fps} />

        {/* Right column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Bar chart */}
          <div
            style={{
              background: colors.background.secondary,
              borderRadius: 24,
              padding: 28,
              boxShadow: `0 8px 32px ${colors.primary.main}08`,
              border: `1px solid ${colors.primary.light}40`,
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <TrendingUp size={20} color={colors.primary.main} strokeWidth={2} />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: colors.text.primary,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                Spending by Category
              </span>
            </div>
            {categories.map((cat, index) => (
              <AnimatedBar
                key={cat.label}
                label={cat.label}
                percentage={cat.percentage}
                color={cat.color}
                delay={0.3 * fps + index * 0.08 * fps}
                amount={cat.amount}
                Icon={cat.Icon}
              />
            ))}
          </div>

          {/* AI Insight card */}
          <InsightCard delay={0.8 * fps} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
