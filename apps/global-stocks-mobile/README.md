# Global Stock — Android / iOS (React Native + Expo)

Native mobile prototype kept **independent** of the existing Next.js/PWA site
(`apex-stock-os/`) and the older Flutter root app. Changes here do not deploy to
the production website.

## Nuevos módulos de beta Argentina (11/10/2026)

Desde **Menú → Tienda online** podés seleccionar Mercado Libre, Shopify,
Tiendanube, WooCommerce, Wix, PrestaShop, VTEX, **Tienda propia** u
**Otra plataforma**, e indicar un sitio HTTPS público. La acción disponible
registra una **solicitud pendiente** con Supabase RLS; **NO** equivale a
conexión, autenticación ni sincronización. Solamente una autorización real del
titular a través de OAuth/API/conector verificado puede habilitar el acceso.
La app muestra conexiones reales ya autorizadas por separado.

Desde **Menú → ARCA · Facturación** podés registrar razón social, CUIT,
condición fiscal, domicilio y punto de venta para el negocio activo.
Se trata de **preparación**: no genera ni autoriza comprobantes/CAE,
no pide claves fiscales y deja deshabilitada la emisión en nuevas cuentas.
Solo Argentina durante la beta.

El plan, obligaciones argentinas y bloqueos de lanzamiento están documentados
en [ARGENTINA_BETA_LAUNCH_2026.md](../../docs/ARGENTINA_BETA_LAUNCH_2026.md).

## Argentina beta safety note

The published mobile beta still exposes **budgets/drafts only**, not cash settlement:
`NativeCashCheckout.tsx` contains experimental checkout code and **must not**
be mounted in the live interface before merchant isolation, idempotent settlement,
fiscal obligations, reversals and offline reconciliation have passed testing.
The source guard enforces this launch constraint.

The app now asks before logging out and wipes plaintext SQLite inventory,
business and unsynced drafts belonging to that account. This is a **data-loss
warning** for any local budgets that have not been copied to the web.
It does not delete records held in Supabase and does not encrypt offline files.
Only test or non-confidential data belongs in the initial pilot.

The first-access gate records separate declarations for age 18+ and a
business operating in Argentina. These are attestations, **not verified ID,
physical location, or a substitute for legal review**.

## Status

**Mobile foundation / internal preview, not production-ready point of sale.**

- ✅ Automatic public client configuration from the web app; native authentication with the existing Supabase account (encrypted session storage).
- ✅ Business membership / ownership selection, creating the first real business and its principal location (respects Supabase RLS).
- ✅ Live product inventory, scoped by business, with SQLite last-known cache.
- ✅ Atomic product creation in Supabase, updating both product records and the Next.js workspace. Manual refresh is still needed to see cross-device changes; there is no push/realtime subscription yet.
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

After the web deploys the `/api/mobile-config` endpoint, the app automatically
connects to the **existing Global Stock Supabase project** and shows the
real login. No local `.env` or EAS CLI setup is necessary for Expo Go.

If the web endpoint is unavailable yet, it shows the clearly marked
**Global Stock DEMO** with sample inventory and a retry button. Wait for
the web deploy to finish, then press **Conectar con mi Global Stock real**.

Alternatively, for a local developer override, create
`apps/global-stocks-mobile/.env` from `.env.example` and set these
**public client configuration** values:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-SUPABASE-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Do not commit `.env`, and **never** use `service_role`. Restart Expo after
editing `.env`.

**Real workflow (first-time use):** log in with the same credentials as the
Global Stock website, create the business if none exists, and add a test
product from Inventory. The product is committed to Supabase and the web
workspace in one database transaction; refresh the PC web page to see it.
You can also add a product in the web UI and tap **Actualizar** on mobile.
If the web page is in its explicit DEMO mode, switch to your real account:
demo browser state is deliberately isolated and does not sync.

No sensitive keys are returned from `/api/mobile-config`; only the public
Supabase publishable/anon key and Supabase URL are sent to the native
client. Database access remains restricted by Supabase RLS.

Do not create **actual** offline sales or accept payments via drafts; the
offline sale queue is explicitly disabled on mobile.

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

### Splash en Expo Go e iOS

El proyecto configura un fondo oscuro `#09090C` y el logo de Global Stock para
el **splash nativo del build EAS propio**. Expo Go es una app contenedora y su
pantalla de carga nativa puede usar su propia apariencia (incluso blanca) antes
de ejecutar nuestro JavaScript. Esto no es un defecto del tema React Native.
La pantalla de carga **dentro** de Global Stock fuerza un fondo oscuro y una
placa de alto contraste detrás de los textos para garantizar legibilidad.

Si aparece `[runtime not ready]`, actualizá a la última rama `main`, cerrá
Metro y reinicialo con `INICIAR-GLOBAL-STOCK.cmd` (que utiliza `--clear`).
No se solucionan excepciones de JavaScript reinstalando Expo Go a ciegas.

