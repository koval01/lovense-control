# Lovense Control App

A Next.js app for controlling Lovense toys via the Lovense Connect API. Supports multiple toys, float-mode (drag bubbles) and traditional sliders, feature grouping, and loop patterns. **Partner mode** uses a separate bridge server so two users can control each other’s toys remotely; see [docs/BRIDGE_SERVER_SPEC.md](./docs/BRIDGE_SERVER_SPEC.md) and [ARCHITECTURE.md](./ARCHITECTURE.md#partner-mode-bridge).

## Quick Start

```bash
npm install
npm run dev
```

Open the app, scan the QR code with the Lovense Connect app on your phone, and connect your toys.

**Partner mode:** Set `NEXT_PUBLIC_BRIDGE_SERVER_URL` to your bridge server (e.g. `https://bridge.example.com`). Run the Cloudflare bridge worker (`npm run bridge:cf:dev` / `npm run bridge:cf:deploy`) and configure `JWT_SECRET`, `CORS_ORIGINS`, etc.

## How It's Structured

The app is organized into:

- **Domain** (`lib/`): Types and pure helpers for toys, features, and command serialization
- **Hooks** (`hooks/`): `useLovense` (API/session), `useBridgeSession` (partner mode), `useToyFeatures`, `useFeatureGroups`, `useBubbleLayout`
- **Components** (`components/`): `ToyControlContainer`, `MotorGraph`, `FeatureBubble`, `FeatureSliderCard`, etc.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the architecture, data flow, and communication with the Lovense API.
