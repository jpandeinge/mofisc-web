import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  Target,
  Shield,
  Car,
  Plane,
  Trophy,
  Flame,
  Star,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '../colors';

const GoalCard: React.FC<{
  title: string;
  target: string;
  current: string;
  percentage: number;
  Icon: LucideIcon;
  color: string;
  delay: number;
  daysLeft?: string;
}> = ({ title, target, current, percentage, Icon, color, delay, daysLeft }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  // Progress bar animation
  const progressWidth = interpolate(
    cardProgress,
    [0.3, 1],
    [0, percentage],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Circle progress for visual
  const circleProgress = interpolate(cardProgress, [0.3, 1], [0, percentage], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circleProgress / 100) * circumference;

  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 24,
        padding: 28,
        flex: 1,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 8px 32px ${colors.primary.main}10`,
        border: `1px solid ${colors.primary.light}40`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
        {/* Circular progress with icon */}
        <div style={{ position: 'relative', width: 100, height: 100 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={colors.primary.lighter}
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
            />
          </svg>
          {/* Icon in center */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 56,
              height: 56,
              borderRadius: 14,
              background: `${color}15`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Icon size={28} color={color} strokeWidth={1.8} />
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: colors.text.primary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {title}
          </p>
          <p
            style={{
              fontSize: 14,
              color: colors.text.tertiary,
              margin: 0,
              marginTop: 6,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Target: N${target}
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: color,
              margin: 0,
              marginTop: 10,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            N${current}
          </p>
          {daysLeft && (
            <p
              style={{
                fontSize: 12,
                color: colors.text.tertiary,
                margin: 0,
                marginTop: 6,
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              {daysLeft}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: colors.text.secondary,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
            }}
          >
            Progress
          </span>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: color,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {Math.round(progressWidth)}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 10,
            background: colors.primary.lighter,
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${color} 0%, ${color}CC 100%)`,
              borderRadius: 5,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const AchievementBadge: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const scale = interpolate(badgeProgress, [0, 1], [0, 1]);
  const rotation = interpolate(badgeProgress, [0, 0.5, 1], [-20, 10, 0]);

  // Shine effect
  const shinePosition = interpolate(frame - delay, [0, 30], [-100, 350], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        background: `linear-gradient(135deg, #FFD700 0%, #FFA500 100%)`,
        borderRadius: 24,
        padding: 28,
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 12px 48px rgba(255, 165, 0, 0.35)',
        position: 'relative',
        overflow: 'hidden',
        flex: 1,
      }}
    >
      {/* Shine effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: shinePosition,
          width: 80,
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          transform: 'skewX(-20deg)',
        }}
      />

      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.25)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Trophy size={40} color="white" strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: 14,
            color: 'rgba(0,0,0,0.5)',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Achievement Unlocked!
        </p>
        <p
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#333',
            margin: 0,
            marginTop: 6,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          30-Day Savings Streak
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <Flame size={18} color="#333" strokeWidth={2} />
          <span style={{ fontSize: 15, color: '#333', fontWeight: 600, fontFamily: 'system-ui' }}>
            +500 XP earned
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <Star key={i} size={20} color="white" fill="white" strokeWidth={0} />
        ))}
      </div>
    </div>
  );
};

const SavingsSummary: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const summaryProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(summaryProgress, [0, 1], [0.9, 1]);
  const opacity = interpolate(summaryProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 24,
        padding: 28,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 8px 32px ${colors.primary.main}10`,
        border: `1px solid ${colors.primary.light}40`,
        flex: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${colors.status.success}15`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TrendingUp size={24} color={colors.status.success} strokeWidth={2} />
        </div>
        <div>
          <p
            style={{
              fontSize: 14,
              color: colors.text.tertiary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Total Saved
          </p>
          <p
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: colors.status.success,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            N$121,250
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div
          style={{
            flex: 1,
            background: colors.primary.lighter,
            borderRadius: 12,
            padding: '14px 16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12, color: colors.text.tertiary, margin: 0, fontFamily: 'system-ui' }}>Goals</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: colors.text.primary, margin: 0, fontFamily: 'system-ui' }}>4</p>
        </div>
        <div
          style={{
            flex: 1,
            background: colors.primary.lighter,
            borderRadius: 12,
            padding: '14px 16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12, color: colors.text.tertiary, margin: 0, fontFamily: 'system-ui' }}>Completed</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: colors.status.success, margin: 0, fontFamily: 'system-ui' }}>2</p>
        </div>
        <div
          style={{
            flex: 1,
            background: colors.primary.lighter,
            borderRadius: 12,
            padding: '14px 16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 12, color: colors.text.tertiary, margin: 0, fontFamily: 'system-ui' }}>Streak</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#FFD700', margin: 0, fontFamily: 'system-ui' }}>30d</p>
        </div>
      </div>
    </div>
  );
};

export const GoalsScene: React.FC = () => {
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
      <div style={{ marginBottom: 24 }}>
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
              background: `${colors.status.success}15`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Target size={20} color={colors.status.success} strokeWidth={2} />
          </div>
          <span
            style={{
              fontSize: 14,
              color: colors.status.success,
              fontWeight: 600,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Goals & Savings
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
          Reach your financial goals
        </h2>
      </div>

      {/* Goal cards - 2 rows of 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <GoalCard
            title="Emergency Fund"
            target="50,000"
            current="32,500"
            percentage={65}
            Icon={Shield}
            color={colors.status.success}
            delay={0.15 * fps}
            daysLeft="~4 months to go"
          />
          <GoalCard
            title="New Car"
            target="150,000"
            current="67,500"
            percentage={45}
            Icon={Car}
            color={colors.primary.main}
            delay={0.25 * fps}
            daysLeft="~8 months to go"
          />
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <GoalCard
            title="Dream Vacation"
            target="25,000"
            current="21,250"
            percentage={85}
            Icon={Plane}
            color="#4ECDC4"
            delay={0.35 * fps}
            daysLeft="Almost there!"
          />
          <GoalCard
            title="Home Deposit"
            target="200,000"
            current="48,000"
            percentage={24}
            Icon={CheckCircle2}
            color="#BB8FCE"
            delay={0.45 * fps}
            daysLeft="~18 months to go"
          />
        </div>
      </div>

      {/* Bottom section */}
      <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
        <SavingsSummary delay={0.6 * fps} />
        <AchievementBadge delay={0.75 * fps} />
      </div>
    </AbsoluteFill>
  );
};
