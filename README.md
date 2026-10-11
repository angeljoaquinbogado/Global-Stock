# Global Stock

A business management platform for inventory, sales, cash management and
multi-location operations. This repository contains **three independent
application workspaces**:

| Workspace | Technology | Purpose |
| --- | --- | --- |
| [`apex-stock-os/`](apex-stock-os/) | Next.js, TypeScript | Existing web and installable PWA; still active |
| [`apps/global-stocks-mobile/`](apps/global-stocks-mobile/) | React Native, Expo | New Android/iPhone app; currently in testing |
| Flutter at the repository root (`lib/`, `android/`, `ios/`, etc.) | Flutter/Dart | Preserved legacy prototype, **not** the Expo entrypoint |

## Open Global Stock on a phone using Expo Go

**Windows / CMD:** Run the following from the repository root
(e.g. `C:\\Users\\joaqu\\Downloads\\global_stock`):

```cmd
git pull origin main
INICIAR-GLOBAL-STOCK.cmd
```

PowerShell users can run the same commands after navigating to the repository root.

The launcher opens the exact mobile folder, installs packages if needed,
and starts Expo specifically for Expo Go with a fresh QR code.

1. Keep the terminal open; the QR belongs to **Global Stock**.
2. On the phone open **Expo Go → Scan QR Code** (or the Camera app on iOS).
3. Scan the QR visible in the **new VS Code terminal window**. Opening Expo
   Go by itself only shows its own welcome/project list.
4. Phone and PC must be able to reach each other via the same Wi-Fi.
   If LAN is blocked, from `apps/global-stocks-mobile/` run
   `npx expo start --go --clear --tunnel` instead.

**What appears without credentials:** A clearly labeled Global Stock DEMO
with its dark/red dashboard, demo inventory and functioning camera scanner.
It does not connect to real business data or process payments.

**Real login/inventory:** Global Stock Mobile automatically loads the public
Supabase client configuration from the existing web app's
`/api/mobile-config` endpoint. This endpoint only exposes the same public
client settings already present in the browser and refuses legacy JWTs
without the `anon` role. **No local `.env` is needed** if the latest web
deployment is ready and internet is available. Existing `.env` settings
remain an optional fallback for independent development.

Sign in with the same Supabase account as the web, or create a new account.
If your user has no business, create one in Expo Go. The app can save new
products atomically to the shared products table and the web workspace;
refresh the PC page to read them. This initial integration does not provide
live push updates or offline point-of-sale settlements.

Never put service-role keys in a mobile app or git.

Detailed mobile instructions: [mobile README](apps/global-stocks-mobile/README.md).

## Safety

- Don't delete the Flutter prototype solely because you're working on Expo;
  it still contains Dart screens and may be useful for reference.
- Existing web and database behavior are not altered by starting Expo.
- Offline cash operations and stock deduction are **not** enabled in the
  mobile preview. Saving a local draft is not a sale.
- Real `.env` files, keys, local databases and build outputs must never be
  committed. A repository-level ignore rule and CI guard help enforce this.

## Browser QA with Playwright

The root `package.json` is only a **test runner**. It does not replace
the Flutter prototype, Next.js dependencies in `apex-stock-os/`, or Expo
dependencies in `apps/global-stocks-mobile/`.

From the repository root (Windows CMD or terminal):

```sh
npm ci
npm ci --prefix apex-stock-os
npx playwright install chromium firefox webkit
npm run test:e2e
```

Playwright starts the local Next.js development server on
`http://127.0.0.1:3000`, visits `/download`, and verifies the interactive
ecosystem and theme across Chromium, Firefox and WebKit. The five viewport
sizes are **1920×1080, 1366×768, 1280×576, 390×844 and 360×740**.
Run `npm run test:e2e:report` to view the HTML report.

To target an existing web deployment instead of starting the local server,
set `PLAYWRIGHT_BASE_URL` to the origin (for example
`https://globalstocks.vercel.app`). These tests do not require business
credentials and must not be expanded to make real purchases or publish
sensitive test data.

GitHub Actions runs these same browser tests on web and test changes.
Generated files under `playwright-report/` and `test-results/` are ignored
in Git; failure artifacts are uploaded privately to the workflow run.

**Note:** The browser suite tests the public Next.js website. It cannot
certify native iPhone/Expo behavior, which still requires device testing.
