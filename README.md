# Lovense Control App

A Next.js app for controlling Lovense toys via the Lovense Connect API. Supports multiple toys, float-mode (drag bubbles) and traditional sliders, feature grouping, and loop patterns.

## Quick Start

```bash
npm install
npm run dev
```

Open the app, scan the QR code with the Lovense Connect app on your phone, and connect your toys.

## How It's Structured

The app is organized into:

- **Domain** (`lib/`): Types and pure helpers for toys, features, and command serialization
- **Hooks** (`hooks/`): `useLovense` (API/session), `useToyFeatures`, `useFeatureGroups`, `useBubbleLayout`
- **Components** (`components/`): `ToyControlContainer`, `MotorGraph`, `FeatureBubble`, `FeatureSliderCard`, etc.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the architecture, data flow, and communication with the Lovense API.
