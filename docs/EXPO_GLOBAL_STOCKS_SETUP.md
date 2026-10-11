# Global Stocks — Expo / EAS setup

This is the Expo configuration supplied for the **Global Stock** mobile-app workstream.

> **Status:** Native React Native + Expo code is now present at [`apps/global-stocks-mobile/`](../apps/global-stocks-mobile/README.md). The Expo plugin is not installed in Codex through this chat, and ownership of the supplied EAS project ID has not been verified with Expo. The existing Next.js/PWA and Flutter projects are independent.

## Expo project details

| Field | Value |
| --- | --- |
| Expo starter directory | `global-stocks` |
| Expo EAS project ID | `d3f33419-261b-4615-818d-f6802350b085` |
| Related web repository | `angeljoaquinbogado/Global-Stock` |
| Preview app | Expo Go (Android / iOS) |

## Expo skills for Codex

In a **Codex** environment that supports installing plugins:

```bash
codex plugin add expo@openai-curated
```

Alternatively, use `/plugins` from a Codex session and select **expo**.

This is a Codex plugin command, **not** an npm command and **not** proof that it is installed in ChatGPT.

## Run the existing Expo app

The native starter is already checked into this repository. **Do not rerun
`create-expo-app` in the repository**, since that would produce a second app.

```bash
cd apps/global-stocks-mobile
npm install
npx expo install --check
# Copy .env.example to .env, then configure your public Supabase URL/key
npx expo start
```

To verify EAS access, sign in with the Expo account that owns this project
and run `npx eas-cli@latest project:info`. The ID is already recorded in
`app.json`, but cannot be verified from GitHub alone.

## Preview

Install **Expo Go** on the device from the Play Store or App Store. Start Expo from the project directory, then scan the displayed QR code using Expo Go (or the iPhone Camera app, depending on platform and configuration). Device and computer must be able to reach the development server; tunnel mode may help when the network blocks local access.

## Before building / publishing

- Confirm ownership and access to the Expo project in the Expo dashboard.
- Decide which Global Stock capabilities are shared with the existing Next.js/PWA version; avoid silently replacing the web app.
- Never commit Expo credentials, tokens, signing certificates or private environment variables.
- Confirm package versions and Expo/EAS project settings when actually initializing the mobile app.

## Automated mobile connection (October 2026)

- Expo's source is [apps/global-stocks-mobile](../apps/global-stocks-mobile/README.md).
- Mobile resolves the same public Supabase URL and anon/publishable key through `https://globalstocks.vercel.app/api/mobile-config`, after Vercel deploys the route. The route never serves service-role credentials.
- A local Expo `.env` with `EXPO_PUBLIC_SUPABASE_*` is optional, not required after that deployment.
- The user can create their first business and product directly on mobile; products are persisted atomically in Supabase and the web workspace, respecting RLS.
- Data synchronization is currently **pull-on-refresh**, not realtime; sale/payment synchronization is not implemented.
