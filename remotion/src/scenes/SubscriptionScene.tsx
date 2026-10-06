import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import {
  Bell,
  Calendar,
  Coins,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Dumbbell,
  Palette,
} from 'lucide-react';
import {
  SiNetflix,
  SiSpotify,
  SiApple,
} from 'react-icons/si';
import { colors } from '../colors';

const SubscriptionCard: React.FC<{
  name: string;
  price: string;
  nextBilling: string;
  Icon: React.ComponentType<{
    size?: string | number;
    color?: string;
    style?: React.CSSProperties;
  }>;
  color: string;
  delay: number;
  status?: 'active' | 'warning';
}> = ({ name, price, nextBilling, Icon, color, delay, status = 'active' }) => {
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
        width: 280,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 8px 32px ${colors.primary.main}10`,
        border: `1px solid ${status === 'warning' ? colors.status.warning : colors.primary.light}50`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        }}
      />

      {/* Status indicator */}
      {status === 'warning' && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
          }}
        >
          <AlertCircle size={18} color={colors.status.warning} strokeWidth={2.5} />
        </div>
      )}

      {/* Top section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: `${color}15`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Icon size={32} color={color} />
        </div>
        <div>
          <p
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: colors.text.primary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {name}
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: color,
              margin: 0,
              marginTop: 4,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            N${price}
            <span style={{ fontSize: 14, fontWeight: 500, color: colors.text.tertiary }}>/mo</span>
          </p>
        </div>
      </div>

      {/* Next billing */}
      <div
        style={{
          background: colors.primary.lighter,
          borderRadius: 12,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Calendar size={16} color={colors.text.secondary} strokeWidth={2} />
        <span
          style={{
            fontSize: 14,
            color: colors.text.secondary,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 500,
          }}
        >
          Renews: {nextBilling}
        </span>
      </div>
    </div>
  );
};

const TotalSpendCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.9, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 20,
        padding: 28,
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 8px 32px ${colors.primary.main}10`,
        border: `1px solid ${colors.primary.light}50`,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `${colors.primary.main}15`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <RefreshCw size={28} color={colors.primary.main} strokeWidth={2} />
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
          Monthly Subscriptions
        </p>
        <p
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: colors.text.primary,
            margin: 0,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          N$767
        </p>
      </div>
      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
        <p style={{ fontSize: 13, color: colors.text.tertiary, margin: 0, fontFamily: 'system-ui' }}>
          4 active
        </p>
        <p style={{ fontSize: 13, color: colors.status.warning, margin: 0, fontFamily: 'system-ui', fontWeight: 600 }}>
          1 renewing soon
        </p>
      </div>
    </div>
  );
};

const ReminderCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.9, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  const pulseScale = 1 + Math.sin(frame / 8) * 0.03;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colors.status.warning}12 0%, ${colors.status.warning}05 100%)`,
        borderRadius: 20,
        padding: 24,
        flex: 1,
        transform: `scale(${scale})`,
        opacity,
        border: `1px solid ${colors.status.warning}30`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: colors.status.warning,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transform: `scale(${pulseScale})`,
          }}
        >
          <Bell size={24} color="white" strokeWidth={2} />
        </div>
        <div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: colors.text.primary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Renewal Reminder
          </p>
          <p
            style={{
              fontSize: 14,
              color: colors.text.secondary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Netflix renews in 3 days
          </p>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            background: colors.background.secondary,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 14, color: colors.text.secondary, fontFamily: 'system-ui', fontWeight: 500 }}>Dismiss</span>
        </div>
        <div
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 10,
            background: colors.status.warning,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 14, color: 'white', fontWeight: 600, fontFamily: 'system-ui' }}>Review</span>
        </div>
      </div>
    </div>
  );
};

const SavingsCard: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardProgress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 80 },
  });

  const scale = interpolate(cardProgress, [0, 1], [0.5, 1]);
  const opacity = interpolate(cardProgress, [0, 1], [0, 1]);

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${colors.status.success}12 0%, ${colors.status.success}05 100%)`,
        borderRadius: 20,
        padding: 24,
        flex: 1,
        border: `1px solid ${colors.status.success}30`,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: colors.status.success,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: `0 8px 24px ${colors.status.success}40`,
          }}
        >
          <Coins size={28} color="white" strokeWidth={1.8} />
        </div>
        <div>
          <p
            style={{
              fontSize: 14,
              color: colors.text.secondary,
              margin: 0,
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Potential savings
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
            N$230/mo
          </p>
          <p
            style={{
              fontSize: 13,
              color: colors.status.success,
              margin: 0,
              marginTop: 4,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCircle size={14} strokeWidth={2.5} />
            2 unused found
          </p>
        </div>
      </div>
    </div>
  );
};

export const SubscriptionScene: React.FC = () => {
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
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          {/* Section label */}
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
                background: `${colors.status.warning}15`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={20} color={colors.status.warning} strokeWidth={2} />
            </div>
            <span
              style={{
                fontSize: 14,
                color: colors.status.warning,
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Subscriptions
            </span>
          </div>

          {/* Main title */}
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
            Never miss a renewal
          </h2>

          <p
            style={{
              fontSize: 20,
              color: colors.text.secondary,
              margin: 0,
              marginTop: 8,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              opacity: titleProgress,
            }}
          >
            Auto-detect and track all your recurring payments
          </p>
        </div>

        {/* Total spend card */}
        <TotalSpendCard delay={0.2 * fps} />
      </div>

      {/* Subscription cards */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <SubscriptionCard
          name="Netflix"
          price="199"
          nextBilling="Mar 15"
          Icon={SiNetflix}
          color="#E50914"
          delay={0.25 * fps}
          status="warning"
        />
        <SubscriptionCard
          name="Spotify"
          price="89"
          nextBilling="Mar 18"
          Icon={SiSpotify}
          color="#1DB954"
          delay={0.4 * fps}
        />
        <SubscriptionCard
          name="Adobe CC"
          price="399"
          nextBilling="Mar 22"
          Icon={Palette}
          color="#FF0000"
          delay={0.55 * fps}
        />
        <SubscriptionCard
          name="iCloud+"
          price="29"
          nextBilling="Mar 28"
          Icon={SiApple}
          color="#555555"
          delay={0.7 * fps}
        />
      </div>

      {/* Bottom section */}
      <div style={{ display: 'flex', gap: 24 }}>
        <ReminderCard delay={0.85 * fps} />
        <SavingsCard delay={1 * fps} />
      </div>
    </AbsoluteFill>
  );
};
