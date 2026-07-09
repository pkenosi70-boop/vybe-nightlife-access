# Vybe Nightlife Access

Vybe is an Expo and React Native nightlife discovery and access app. Guests can discover events, request access, receive a QR ticket after approval and check in at the door. Hosts can create events, manage requests and scan approved tickets.

## Run locally

Requirements: Node.js 20 or newer and the Expo Go app for phone testing.

```bash
npm install
npm start
```

Scan the terminal QR code with Expo Go, or use:

```bash
npm run start:web
npm run start:android
npm run start:ios
```

## Checks

```bash
npm run typecheck
npm run lint
npm run doctor
npm run build:web
```

`expo-doctor` needs internet access for all of its remote checks.

## Configuration

The app reads these optional environment variables:

```text
EXPO_PUBLIC_BLINK_PROJECT_ID
EXPO_PUBLIC_BLINK_PUBLISHABLE_KEY
```

Copy `.env.example` to `.env` when moving to a different Blink project. The current Blink project fallback remains in `lib/blink.ts` so the existing project can continue running.

For Expo cloud builds, install EAS CLI and run `eas init` once. This creates a real EAS project ID; no placeholder ID is committed.

## Core manual test flow

1. Sign up and sign in.
2. Create a future event with a capacity and optional cover image.
3. Use another account to request access.
4. Approve the request from the host account.
5. Open the guest QR ticket.
6. Scan the ticket once from the host dashboard.
7. Confirm a second scan is rejected.
8. Sign out and sign back in.

See `STABLE_BUILD_NOTES.md` for the repair summary and remaining production checks.
