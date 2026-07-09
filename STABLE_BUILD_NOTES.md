# Vybe stable build notes

This repair pass focuses on a stable, testable beta without redesigning the app.

## Changes in this build

- Centralised Blink authentication in one React context and added session-aware routing.
- Redirected signed-out users to authentication and signed-in users to the main tabs.
- Added email, password and display-name validation.
- Removed the unused Blink mobile UI wrapper that pulled in missing Tamagui peer packages.
- Aligned `expo-camera` with Expo SDK 54.
- Added QR scanner locking, processing feedback and reset behaviour after rejected scans.
- Added host ownership, ticket status, expiry, duplicate-use and capacity checks to check-in.
- Prevented duplicate event access requests and repeated request processing.
- Added event creation validation, event cover selection and Blink Storage upload.
- Added loading, error and double-submission protection to host request actions.
- Replaced starter app names and package identifiers with Vybe identifiers.
- Removed the fake EAS project ID. Run `eas init` when you are ready to create cloud builds.

## Manual tests still required

Use two test accounts and a physical phone to verify:

1. Create an account and sign in.
2. Create a future event with and without a cover image.
3. Request access from a second account.
4. Approve or deny the request from the host account.
5. Open the approved QR ticket.
6. Scan it once and confirm a second scan is rejected.
7. Sign out and sign back in.

Database row-level permissions must also be confirmed in the Blink project dashboard. Client-side ownership checks improve safety but cannot replace server-enforced access rules.

## Automated verification completed

- TypeScript: passed with `tsc --noEmit`.
- ESLint: passed with `expo lint`.
- Expo dependency check: packages reported up to date using Expo SDK 54's local dependency map.
- Web production export: passed and generated `dist`.
- Expo Doctor: 16 of 18 checks passed. The remaining two checks could not reach the Expo API / React Native Directory from the isolated build environment; they did not report a local source-code failure.
