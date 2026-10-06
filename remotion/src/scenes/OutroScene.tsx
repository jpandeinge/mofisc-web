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
  ArrowRight,
  Shield,
  Clock,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { colors } from '../colors';

const FeaturePill: React.FC<{
  Icon: LucideIcon;
  text: string;
  delay: number;
}> = ({ Icon, text, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(pillProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(pillProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(10px)',
        padding: '16px 28px',
        borderRadius: 40,
        border: '1px solid rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon size={18} color="white" strokeWidth={2} />
      </div>
      <span
        style={{
          fontSize: 17,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
};

const FloatingOrb: React.FC<{
  size: number;
  x: number;
  y: number;
  delay: number;
  color: string;
}> = ({ size, x, y, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const orbProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 20, stiffness: 60 },
  });

  const scale = interpolate(orbProgress, [0, 1], [0, 1]);
  const floatY = Math.sin((frame - delay) / 25) * 10;
  const floatX = Math.cos((frame - delay) / 30) * 5;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${color}60 0%, ${color}20 50%, transparent 70%)`,
        transform: `scale(${scale}) translate(${floatX}px, ${floatY}px)`,
        filter: 'blur(1px)',
      }}
    />
  );
};

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene entrance
  const sceneOpacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Logo animation
  const logoProgress = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const logoScale = interpolate(logoProgress, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(logoProgress, [0, 1], [0, 1]);

  // CTA animation
  const ctaDelay = 0.5 * fps;
  const ctaProgress = spring({
    frame: frame - ctaDelay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const ctaScale = interpolate(ctaProgress, [0, 1], [0.8, 1]);
  const ctaOpacity = interpolate(ctaProgress, [0, 1], [0, 1]);

  // Pulsing effect for CTA
  const pulseScale = 1 + Math.sin(frame / 10) * 0.015;

  // Arrow animation
  const arrowX = interpolate(
    frame % 30,
    [0, 15, 30],
    [0, 6, 0],
  );

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${colors.primary.dark} 0%, ${colors.primary.main} 50%, ${colors.primary.dark} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: sceneOpacity,
      }}
    >
      {/* Floating orbs */}
      <FloatingOrb size={300} x={-5} y={10} delay={0.2 * fps} color={colors.primary.light} />
      <FloatingOrb size={200} x={80} y={60} delay={0.4 * fps} color={colors.primary.main} />
      <FloatingOrb size={150} x={70} y={15} delay={0.3 * fps} color="white" />
      <FloatingOrb size={180} x={10} y={70} delay={0.5 * fps} color={colors.primary.light} />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 28,
          zIndex: 1,
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
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Layers size={40} color="white" strokeWidth={1.5} />
          </div>
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-1px',
            }}
          >
            Mofisc
          </span>
        </div>

        {/* Tagline */}
        <h2
          style={{
            fontSize: 44,
            fontWeight: 600,
            color: 'white',
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
            opacity: logoOpacity,
            textShadow: '0 2px 20px rgba(0,0,0,0.2)',
          }}
        >
          Take control of your finances
        </h2>

        {/* CTA Button */}
        <div
          style={{
            transform: `scale(${ctaScale * pulseScale})`,
            opacity: ctaOpacity,
            marginTop: 8,
          }}
        >
          <div
            style={{
              background: 'white',
              color: colors.primary.dark,
              fontSize: 20,
              fontWeight: 700,
              padding: '18px 44px',
              borderRadius: 16,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Sparkles size={20} color={colors.primary.main} strokeWidth={2} />
            Start Free Trial
            <ArrowRight
              size={20}
              color={colors.primary.dark}
              strokeWidth={2.5}
              style={{ transform: `translateX(${arrowX}px)` }}
            />
          </div>
        </div>

        {/* Features pills */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            marginTop: 20,
          }}
        >
          <FeaturePill Icon={Clock} text="7-day free trial" delay={0.8 * fps} />
          <FeaturePill Icon={CreditCard} text="No credit card required" delay={0.9 * fps} />
          <FeaturePill Icon={Shield} text="Bank-grade security" delay={1 * fps} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
