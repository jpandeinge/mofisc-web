import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  Layers,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Shield,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '../colors';

const FloatingIcon: React.FC<{
  Icon: LucideIcon;
  x: number;
  y: number;
  delay: number;
  size?: number;
}> = ({ Icon, x, y, delay, size = 32 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const scale = interpolate(iconProgress, [0, 1], [0, 1]);
  const opacity = interpolate(iconProgress, [0, 1], [0, 0.6]);
  const floatY = Math.sin((frame - delay) / 20) * 8;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${scale}) translateY(${floatY}px)`,
        opacity,
      }}
    >
      <div
        style={{
          width: size + 24,
          height: size + 24,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${colors.primary.light}80 0%, ${colors.primary.lighter}60 100%)`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${colors.primary.light}`,
        }}
      >
        <Icon size={size} color={colors.primary.main} strokeWidth={1.5} />
      </div>
    </div>
  );
};

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Logo animation
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const logoOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Tagline animation
  const taglineDelay = 0.5 * fps;
  const taglineProgress = spring({
    frame: frame - taglineDelay,
    fps,
    config: { damping: 200 },
  });

  const taglineOpacity = interpolate(
    frame,
    [taglineDelay, taglineDelay + 0.5 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const taglineY = interpolate(taglineProgress, [0, 1], [30, 0]);

  // Subtitle animation
  const subtitleDelay = 1 * fps;
  const subtitleOpacity = interpolate(
    frame,
    [subtitleDelay, subtitleDelay + 0.5 * fps],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const subtitleY = interpolate(
    frame,
    [subtitleDelay, subtitleDelay + 0.5 * fps],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Exit animation
  const exitStart = durationInFrames - 0.5 * fps;
  const exitOpacity = interpolate(
    frame,
    [exitStart, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.background.secondary} 0%, ${colors.primary.lighter} 50%, ${colors.background.secondary} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: exitOpacity,
      }}
    >
      {/* Floating icons in background */}
      <FloatingIcon Icon={TrendingUp} x={10} y={20} delay={0.3 * fps} size={28} />
      <FloatingIcon Icon={CreditCard} x={85} y={15} delay={0.5 * fps} size={32} />
      <FloatingIcon Icon={PiggyBank} x={8} y={70} delay={0.7 * fps} size={30} />
      <FloatingIcon Icon={Shield} x={88} y={65} delay={0.9 * fps} size={26} />
      <FloatingIcon Icon={Sparkles} x={15} y={45} delay={1.1 * fps} size={24} />

      {/* Decorative background circles */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary.light}40 0%, transparent 70%)`,
          top: -100,
          right: -100,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.primary.main}20 0%, transparent 70%)`,
          bottom: -50,
          left: -50,
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div
          style={{
            transform: `scale(${logoScale})`,
            opacity: logoOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              boxShadow: `0 20px 40px ${colors.primary.main}40`,
            }}
          >
            <Layers size={44} color="white" strokeWidth={1.5} />
          </div>

          {/* Logo text */}
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: colors.primary.dark,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-2px',
            }}
          >
            Mofisc
          </span>
        </div>

        {/* Main tagline */}
        <h1
          style={{
            fontSize: 56,
            fontWeight: 600,
            color: colors.text.primary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            margin: 0,
            marginTop: 32,
            opacity: taglineOpacity,
            transform: `translateY(${taglineY}px)`,
            textAlign: 'center',
          }}
        >
          Your finances,{' '}
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            beautifully organised
          </span>
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 24,
            color: colors.text.secondary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            margin: 0,
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.5,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          Say goodbye to spreadsheets. Get AI-powered insights, track
          subscriptions, and reach your financial goals.
        </p>
      </div>
    </AbsoluteFill>
  );
};
