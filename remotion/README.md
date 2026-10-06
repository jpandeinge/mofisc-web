# Galahad Remotion Demo Videos

This directory contains Remotion compositions for creating demo videos showcasing the Mofisc/Galahad app.

## Setup

```bash
cd remotion
npm install
```

## Development

Start the Remotion Studio to preview and develop compositions:

```bash
npm start
```

This opens the Remotion Studio at `http://localhost:3000` where you can preview all compositions.

## Available Compositions

### 1. LandingPageDemo (15 seconds)
A comprehensive demo video showing:
- **Intro** - Brand introduction with tagline
- **Dashboard** - Overview of financial metrics and transactions
- **Subscriptions** - Subscription tracking and savings potential
- **Insights** - Spending analytics with charts
- **Goals** - Savings goals and achievements
- **Outro** - Call to action

### 2. FeatureShowcase (20 seconds)
Individual feature highlights:
- AI-Powered Insights
- Beautiful Analytics
- Smart Subscriptions
- Savings Goals
- Bank-Grade Security
- Gamified Experience

## Rendering Videos

### Render the main landing demo:
```bash
npm run build
```
Output: `out/landing-demo.mp4`

### Render the feature showcase:
```bash
npm run build:showcase
```
Output: `out/feature-showcase.mp4`

### Custom render options:
```bash
# Render with specific quality
npx remotion render src/index.ts LandingPageDemo out/demo-hq.mp4 --crf 18

# Render as WebM
npx remotion render src/index.ts LandingPageDemo out/demo.webm --codec vp8

# Render specific frames
npx remotion render src/index.ts LandingPageDemo out/demo.mp4 --frames 0-90
```

## Color Scheme

The videos use the Galahad app's color system:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Dark | `#174EA6` | Text, active states |
| Primary Main | `#4285F4` | Accent, buttons |
| Primary Light | `#D2E3FC` | Backgrounds, borders |
| Success | `#10B981` | Income, positive |
| Error | `#EF4444` | Expenses, negative |
| Warning | `#F59E0B` | Alerts, subscriptions |

## File Structure

```
remotion/
├── src/
│   ├── index.ts           # Entry point
│   ├── Root.tsx           # Composition definitions
│   ├── colors.ts          # App color system
│   ├── compositions/
│   │   ├── LandingPageDemo.tsx
│   │   └── FeatureShowcase.tsx
│   └── scenes/
│       ├── IntroScene.tsx
│       ├── DashboardScene.tsx
│       ├── SubscriptionScene.tsx
│       ├── InsightsScene.tsx
│       ├── GoalsScene.tsx
│       └── OutroScene.tsx
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## Integration with Landing Page

The rendered videos can be used with a "Watch Demo" button on the landing page:

```tsx
// Example usage in React
<video
  src="/videos/landing-demo.mp4"
  controls
  poster="/images/demo-poster.jpg"
/>
```

Or embed in a modal/lightbox for better UX.
