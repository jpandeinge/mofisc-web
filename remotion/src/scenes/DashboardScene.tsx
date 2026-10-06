import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  Car,
  Briefcase,
  CreditCard,
  BarChart3,
  Activity,
  PiggyBank,
  Coffee,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '../colors';

const StatCard: React.FC<{
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  delay: number;
  color?: string;
  Icon: LucideIcon;
}> = ({ label, value, trend, trendUp, delay, color, Icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 24,
        padding: 28,
        flex: 1,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 8px 32px ${colors.primary.main}08`,
        border: `1px solid ${colors.primary.light}40`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient accent */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          background: `radial-gradient(circle at top right, ${color || colors.primary.main}12 0%, transparent 70%)`,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: `${color || colors.primary.main}12`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon size={28} color={color || colors.primary.main} strokeWidth={2} />
        </div>
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              borderRadius: 20,
              background: trendUp ? `${colors.status.success}12` : `${colors.status.error}12`,
            }}
          >
            {trendUp ? (
              <ArrowUpRight size={16} color={colors.status.success} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={16} color={colors.status.error} strokeWidth={2.5} />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: trendUp ? colors.status.success : colors.status.error,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {trend}
            </span>
          </div>
        )}
      </div>

      <p
        style={{
          fontSize: 14,
          color: colors.text.tertiary,
          margin: 0,
          marginBottom: 8,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: color || colors.text.primary,
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {value}
      </p>
    </div>
  );
};

const TransactionRow: React.FC<{
  merchant: string;
  category: string;
  amount: string;
  isExpense: boolean;
  delay: number;
  Icon: LucideIcon;
}> = ({ merchant, category, amount, isExpense, delay, Icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rowProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const translateX = interpolate(rowProgress, [0, 1], [-50, 0]);
  const opacity = interpolate(rowProgress, [0, 1], [0, 1]);

  const iconColor = isExpense ? colors.status.error : colors.status.success;
  const iconBg = isExpense ? `${colors.status.error}10` : `${colors.status.success}10`;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '18px 20px',
        background: colors.background.secondary,
        borderRadius: 16,
        transform: `translateX(${translateX}px)`,
        opacity,
        border: `1px solid ${colors.primary.lighter}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: iconBg,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon size={24} color={iconColor} strokeWidth={2} />
        </div>
        <div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: colors.text.primary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {merchant}
          </p>
          <p
            style={{
              fontSize: 14,
              color: colors.text.tertiary,
              margin: 0,
              marginTop: 2,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {category}
          </p>
        </div>
      </div>
      <p
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: isExpense ? colors.status.error : colors.status.success,
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {isExpense ? '-' : '+'}N${amount}
      </p>
    </div>
  );
};

const MiniChart: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chartProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const opacity = interpolate(chartProgress, [0, 1], [0, 1]);

  // Sample data points
  const data = [35, 55, 45, 70, 50, 80, 65];

  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 20,
        padding: 24,
        opacity,
        boxShadow: `0 8px 32px ${colors.primary.main}08`,
        border: `1px solid ${colors.primary.light}40`,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <BarChart3 size={20} color={colors.primary.main} strokeWidth={2} />
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: colors.text.primary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Weekly Spending
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
        {data.map((value, i) => {
          const barHeight = interpolate(chartProgress, [0.2 + i * 0.08, 0.5 + i * 0.08], [0, value * 1.8], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: barHeight,
                background: i === data.length - 1
                  ? `linear-gradient(180deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`
                  : colors.primary.light,
                borderRadius: 8,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
          <span
            key={i}
            style={{
              fontSize: 12,
              color: colors.text.tertiary,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              flex: 1,
              textAlign: 'center',
            }}
          >
            {day}
          </span>
        ))}
      </div>
    </div>
  );
};

export const DashboardScene: React.FC = () => {
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
              background: `${colors.primary.main}15`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Activity size={20} color={colors.primary.main} strokeWidth={2} />
          </div>
          <span
            style={{
              fontSize: 14,
              color: colors.primary.main,
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Dashboard
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
          See everything at a glance
        </h2>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Balance"
          value="N$24,580"
          trend="12.5%"
          trendUp
          delay={0.15 * fps}
          color={colors.primary.dark}
          Icon={Wallet}
        />
        <StatCard
          label="Income"
          value="N$18,500"
          trend="8.2%"
          trendUp
          delay={0.25 * fps}
          color={colors.status.success}
          Icon={TrendingUp}
        />
        <StatCard
          label="Expenses"
          value="N$6,420"
          trend="5.3%"
          trendUp={false}
          delay={0.35 * fps}
          color={colors.status.error}
          Icon={TrendingDown}
        />
        <StatCard
          label="Savings"
          value="N$12,160"
          trend="22%"
          trendUp
          delay={0.45 * fps}
          color={colors.primary.main}
          Icon={PiggyBank}
        />
      </div>

      {/* Bottom section */}
      <div style={{ display: 'flex', gap: 28 }}>
        {/* Recent transactions */}
        <div style={{ flex: 1.2 }}>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: colors.text.primary,
              margin: 0,
              marginBottom: 16,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: interpolate(frame, [0.5 * fps, 0.65 * fps], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <CreditCard size={20} color={colors.text.secondary} strokeWidth={2} />
            Recent Transactions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TransactionRow
              merchant="Salary Deposit"
              category="Income"
              amount="18,500"
              isExpense={false}
              delay={0.55 * fps}
              Icon={Briefcase}
            />
            <TransactionRow
              merchant="Pick n Pay"
              category="Groceries"
              amount="850"
              isExpense={true}
              delay={0.65 * fps}
              Icon={ShoppingBag}
            />
            <TransactionRow
              merchant="Uber"
              category="Transport"
              amount="245"
              isExpense={true}
              delay={0.75 * fps}
              Icon={Car}
            />
            <TransactionRow
              merchant="Vida e Caffè"
              category="Dining"
              amount="125"
              isExpense={true}
              delay={0.85 * fps}
              Icon={Coffee}
            />
          </div>
        </div>

        {/* Mini chart */}
        <div style={{ flex: 0.8 }}>
          <MiniChart delay={0.6 * fps} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
