# Global Stock — Android / iOS (React Native + Expo)

Native mobile prototype kept **independent** of the existing Next.js/PWA site
(`apex-stock-os/`) and the older Flutter root app. Changes here do not deploy to
the production website.

## Status

**Mobile foundation / internal preview, not production-ready point of sale.**

- ✅ Native authentication with the existing Supabase account (encrypted session storage).
- ✅ Business membership / ownership selection (respects Supabase RLS).
- ✅ Live product inventory, scoped by business, with SQLite last-known cache.
- ✅ Camera scanning for EAN/UPC/Code128/QR via `expo-camera`.
- ✅ Offline sale **drafts only**, stored on the current device.
- ⛔ No payment capture, no real sale posting, no stock deduction, no automatic
  sync of drafts. The web/backend must implement an idempotent atomic commit
  and conflict resolution before these workflows can go live.
- ⛔ SQLite inventory snapshots and drafts are **not encrypted**; use only
  trusted test devices during this phase. Add at-rest encryption, retention
  rules and proper multi-device sync before real merchant data.

## Run on a development computer

Requires Node.js and an Expo Go build compatible with this project's Expo SDK.

```bash
cd apps/global-stocks-mobile
npm install
npx expo install --fix
cp .env.example .env
# Edit .env with your existing Supabase project URL and publishable/anon key
npm run typecheck
npx expo start
```

The Expo SDK / React Native versions are taken from the official Expo
TypeScript blank template available when this foundation was created. If that
SDK is prerelease on your machine, regenerate a stable compatible starter with
`npx create-expo-app@latest` and let `npx expo install --fix` align native
dependency versions **before any store build**. Never force incompatible native
versions with `--legacy-peer-deps` just to silence an error.

Scan the development QR code with Expo Go. Connect the device and the
development computer to a reachable network, or use `npx expo start --tunnel`
when LAN access fails.

## EAS

`app.json` references EAS project:

`d3f33419-261b-4615-818d-f6802350b085`

To verify that the signed-in Expo account owns/has access:

```bash
npx eas-cli@latest whoami
npx eas-cli@latest project:info
```

**Do not** create a second EAS project ID. Verify the existing ID and connect
under the account that owns it. The native app uses package ID
`app.globalstocks.mobile` as a development default; check ownership and
uniqueness before Play Store/App Store submission.

## Supabase / security

Only `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_ANON_KEY` belong in local Expo environment files.
The **service-role key must never enter React Native, GitHub or the APK/IPA**.

Expo's `EXPO_PUBLIC_*` values are baked into a client app; they are public
configuration, not secrets. The app queries only businesses allowed by the
current user, while Supabase RLS enforces backend authorization.

Sessions live in Expo SecureStore in chunked form. Cached inventory and sale
drafts are partitioned by user ID and business ID in local SQLite.

The cached product quantities may be stale. A saved draft is **not a sale**.
Do not take money or release goods based on a draft until a verified online
transaction has committed.

## Next milestones

1. Check installs and build on both Android and iOS development devices.
2. Test login, invite-only business membership, empty business, and offline
   inventory separately with two *test* merchant accounts.
3. Add inventory sync cursor/versioning and encrypted local storage.
4. Add server-authoritative, idempotent offline draft reconciliation with
   stock conflict handling, cash-session rules and rollback.
5. Test scanners with real EAN/UPC/code128 labels on physical devices.
6. Set release builds, signing, push notifications and app-store metadata.
