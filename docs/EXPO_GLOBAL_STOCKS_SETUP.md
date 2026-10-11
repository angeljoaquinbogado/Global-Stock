# Global Stocks — Expo / EAS setup

This is the Expo configuration supplied for the **Global Stock** mobile-app workstream.

> **Status:** Setup reference recorded on 2026-10-10. Not evidence that the Expo plugin, Expo SDK, Expo Go, or EAS connection is installed, that the app has been initialized, or that the project ID has been verified with Expo. Keep the existing Next.js / PWA application independent until an integration is explicitly planned.

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

## Create a separate Expo app

Run the following on your **own development computer or supported cloud developer environment**, from the intended parent directory:

```bash
npx create-expo-app@latest global-stocks
cd global-stocks
npx eas-cli@latest init --id d3f33419-261b-4615-818d-f6802350b085
npx expo start
```

This creates a new Expo React Native starter project, rather than converting the existing Next.js site. Avoid running create-expo-app in an existing populated `global-stocks` folder. The EAS command needs an Expo account with access to the provided project.

## Preview

Install **Expo Go** on the device from the Play Store or App Store. Start Expo from the project directory, then scan the displayed QR code using Expo Go (or the iPhone Camera app, depending on platform and configuration). Device and computer must be able to reach the development server; tunnel mode may help when the network blocks local access.

## Before building / publishing

- Confirm ownership and access to the Expo project in the Expo dashboard.
- Decide which Global Stock capabilities are shared with the existing Next.js/PWA version; avoid silently replacing the web app.
- Never commit Expo credentials, tokens, signing certificates or private environment variables.
- Confirm package versions and Expo/EAS project settings when actually initializing the mobile app.
