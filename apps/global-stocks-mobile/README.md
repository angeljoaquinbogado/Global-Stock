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
- ✅ Clearly marked offline UI demonstration if Supabase has not been configured.
- ⛔ No payment capture, no real sale posting, no stock deduction, no automatic
  sync of drafts. The web/backend must implement an idempotent atomic commit
  and conflict resolution before these workflows can go live.
- ⛔ SQLite inventory snapshots and drafts are **not encrypted**; use only
  trusted test devices during this phase. Add at-rest encryption, retention
  rules and proper multi-device sync before real merchant data.

## Open Global Stock with Expo Go (Windows / VS Code)

Use this **exact block**, even if your terminal is currently inside `apex-stock-os`:

```powershell
Set-Location (git rev-parse --show-toplevel)
git pull origin main
.\INICIAR-GLOBAL-STOCK.cmd
```

The launcher goes into `apps/global-stocks-mobile` automatically, installs
packages the first time and starts Expo in **Expo Go mode**. Do not run
`npx create-expo-app`; the native app already exists in this repo.

1. Open **Expo Go → Scan QR Code** on the phone. Opening Expo Go alone only
   shows the Expo Go home screen.
2. Scan the **fresh QR code shown by the launcher**. Keep the terminal open.
3. Connect phone and PC to the same Wi-Fi. If the QR loads indefinitely,
   stop the server with Ctrl+C, then from the mobile folder use:
   `npx expo start --go --clear --tunnel`.

Without a configured `.env`, the app shows a clearly marked **Global Stock
DEMO** dashboard with sample inventory and the native scanner. That is
normal. Demo data is not real stock and demo actions cannot charge money.

To connect the real Supabase account, create `apps/global-stocks-mobile/.env`
from `.env.example` and set these **public client configuration** values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-SUPABASE-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Do not commit `.env`, and **never** use `service_role`. Restart Expo after
editing `.env`. Then the real Global Stock sign-in screen will appear.

This project is pinned to **Expo SDK 57 / React Native 0.86.3**, using the
compatible official Expo `sdk-57` TypeScript template and native-module list.
Run `npx expo install --check` after installation. Do not force incompatible
native versions with `--legacy-peer-deps` to silence an error.

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
