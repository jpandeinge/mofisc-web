import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  Brain,
  BarChart3,
  Bell,
  Target,
  Shield,
  Trophy,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '../colors';

// Individual feature card component
const FeatureCard: React.FC<{
  Icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}> = ({ Icon, title, description, color }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const cardProgress = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);
  const translateY = interpolate(cardProgress, [0, 1], [50, 0]);

  // Exit animation
  const exitStart = durationInFrames - 0.4 * fps;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Floating sparkles
  const sparkleOpacity = interpolate(frame, [0.5 * fps, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: colors.background.primary,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exitOpacity,
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
          top: '20%',
          left: '10%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          bottom: '10%',
          right: '15%',
        }}
      />

      <div
        style={{
          transform: `scale(${scale}) translateY(${translateY}px)`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 800,
          textAlign: 'center',
        }}
      >
        {/* Icon container */}
        <div
          style={{
            position: 'relative',
            marginBottom: 40,
          }}
        >
          {/* Outer glow ring */}
          <div
            style={{
              position: 'absolute',
              inset: -20,
              borderRadius: 40,
              background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            }}
          />

          {/* Icon box */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 32,
              background: `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: `2px solid ${color}30`,
              position: 'relative',
            }}
          >
            <Icon size={56} color={color} strokeWidth={1.5} />

            {/* Sparkle decorations */}
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                opacity: sparkleOpacity,
              }}
            >
              <Sparkles size={20} color={color} strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: colors.text.primary,
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            marginBottom: 20,
          }}
        >
          {title}
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: 24,
            color: colors.text.secondary,
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.6,
            maxWidth: 600,
          }}
        >
          {description}
        </p>

        {/* Accent line */}
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
            marginTop: 36,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const FeatureShowcase: React.FC = () => {
  const { fps } = useVideoConfig();

  const features = [
    {
      Icon: Brain,
      title: 'AI-Powered Insights',
      description:
        'Smart algorithms analyze your spending patterns and provide personalized recommendations to help you save more.',
      color: colors.primary.main,
    },
    {
      Icon: BarChart3,
      title: 'Beautiful Analytics',
      description:
        'Interactive charts and visualizations make understanding your finances intuitive and even enjoyable.',
      color: '#4ECDC4',
    },
    {
      Icon: Bell,
      title: 'Smart Subscriptions',
      description:
        'Automatically detect recurring payments, get renewal reminders, and identify subscriptions you might want to cancel.',
      color: colors.status.warning,
    },
    {
      Icon: Target,
      title: 'Savings Goals',
      description:
        'Set financial targets, track your progress with visual milestones, and celebrate when you reach your goals.',
      color: colors.status.success,
    },
    {
      Icon: Shield,
      title: 'Bank-Grade Security',
      description:
        '256-bit encryption protects your data. Read-only access means we can never move your money.',
      color: '#BB8FCE',
    },
    {
      Icon: Trophy,
      title: 'Gamified Experience',
      description:
        'Earn achievements, complete challenges, and build healthy financial habits through fun engagement.',
      color: '#FFD700',
    },
  ];

  const FEATURE_DURATION = Math.floor(3.33 * fps); // ~3.33 seconds per feature

  return (
    <AbsoluteFill>
      {features.map((feature, index) => (
        <Sequence
          key={feature.title}
          from={index * FEATURE_DURATION}
          durationInFrames={FEATURE_DURATION}
          premountFor={fps}
        >
          <FeatureCard {...feature} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
