import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { colors, gradients } from '../colors';
import { IntroScene } from '../scenes/IntroScene';
import { DashboardScene } from '../scenes/DashboardScene';
import { SubscriptionScene } from '../scenes/SubscriptionScene';
import { InsightsScene } from '../scenes/InsightsScene';
import { GoalsScene } from '../scenes/GoalsScene';
import { OutroScene } from '../scenes/OutroScene';

export const LandingPageDemo: React.FC = () => {
  const { fps } = useVideoConfig();

  // Scene timings in seconds
  const INTRO_DURATION = 2.5 * fps;
  const DASHBOARD_DURATION = 3 * fps;
  const SUBSCRIPTION_DURATION = 2.5 * fps;
  const INSIGHTS_DURATION = 2.5 * fps;
  const GOALS_DURATION = 2 * fps;
  const OUTRO_DURATION = 2.5 * fps;

  // Scene start times
  const DASHBOARD_START = INTRO_DURATION;
  const SUBSCRIPTION_START = DASHBOARD_START + DASHBOARD_DURATION;
  const INSIGHTS_START = SUBSCRIPTION_START + SUBSCRIPTION_DURATION;
  const GOALS_START = INSIGHTS_START + INSIGHTS_DURATION;
  const OUTRO_START = GOALS_START + GOALS_DURATION;

  return (
    <AbsoluteFill
      style={{
        background: gradients.light,
      }}
    >
      {/* Intro - "Your finances, beautifully organised" */}
      <Sequence durationInFrames={INTRO_DURATION} premountFor={fps}>
        <IntroScene />
      </Sequence>

      {/* Dashboard Overview */}
      <Sequence
        from={DASHBOARD_START}
        durationInFrames={DASHBOARD_DURATION}
        premountFor={fps}
      >
        <DashboardScene />
      </Sequence>

      {/* Subscription Management */}
      <Sequence
        from={SUBSCRIPTION_START}
        durationInFrames={SUBSCRIPTION_DURATION}
        premountFor={fps}
      >
        <SubscriptionScene />
      </Sequence>

      {/* Insights & Analytics */}
      <Sequence
        from={INSIGHTS_START}
        durationInFrames={INSIGHTS_DURATION}
        premountFor={fps}
      >
        <InsightsScene />
      </Sequence>

      {/* Goals & Planning */}
      <Sequence
        from={GOALS_START}
        durationInFrames={GOALS_DURATION}
        premountFor={fps}
      >
        <GoalsScene />
      </Sequence>

      {/* Outro - Call to action */}
      <Sequence
        from={OUTRO_START}
        durationInFrames={OUTRO_DURATION}
        premountFor={fps}
      >
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
