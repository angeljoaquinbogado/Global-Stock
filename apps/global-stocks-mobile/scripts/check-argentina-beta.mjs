import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(mobile, "../..");
// Windows Git checkouts may use CRLF; guards must inspect normalized text.
const read = (path) => readFileSync(resolve(repo, path), "utf8").replace(/\r\n?/g, "\n");
const must = (condition, explanation) => { if (!condition) throw new Error("BETA GATE FAILED: " + explanation); };

const app = read("apps/global-stocks-mobile/App.tsx");
const mobileEntry = read("apps/global-stocks-mobile/index.ts");
const unifiedShell = read("apps/global-stocks-mobile/src/components/UnifiedApp.tsx");
const webShell = read("apex-stock-os/components/ApexShell.tsx");
const webScanner = read("apex-stock-os/components/BarcodeScanner.tsx");
const webLegal = read("apex-stock-os/components/UnifiedLegalGate.tsx");
const legal = read("apps/global-stocks-mobile/src/components/NativeLegalGate.tsx");
const privacy = read("apex-stock-os/app/legal/privacy/page.tsx");
const ai = read("apps/global-stocks-mobile/src/components/NativeAssistant.tsx");
const offline = read("apps/global-stocks-mobile/src/lib/offline.ts");
const commerce = read("apps/global-stocks-mobile/src/components/NativeCommerceConnect.tsx");
const fiscal = read("apps/global-stocks-mobile/src/components/NativeFiscalArca.tsx");
const integrationSql = read("apex-stock-os/supabase/migrations/20261011_mobile_argentina_integrations_fiscal_access.sql");
const workspace = read("apps/global-stocks-mobile/src/components/NativeWorkspace.tsx");
const landing = read("apps/global-stocks-mobile/src/components/NativeAuthLanding.tsx");
const productForm = read("apps/global-stocks-mobile/src/components/ProductForm.tsx");
const nativeRestock = read("apps/global-stocks-mobile/src/components/NativeRestockPanel.tsx");
const atomicRestockSql = read("apex-stock-os/supabase/migrations/20261013_add_product_stock_atomic.sql");
const mobileData = read("apps/global-stocks-mobile/src/lib/data.ts");
const cash = read("apps/global-stocks-mobile/src/components/NativeCashRegister.tsx");
const checkout = read("apps/global-stocks-mobile/src/components/NativeCashCheckout.tsx");
const promoGrant = read("apex-stock-os/supabase/migrations/20261013_cash_promotions_read_grant.sql");
const relatedGrants = read("apex-stock-os/supabase/migrations/20261013_pos_customer_recipe_read_roles.sql");
const mobileSettings = read("apps/global-stocks-mobile/src/components/NativeSettings.tsx");
const sectorsWeb = read("apex-stock-os/components/DownloadSectorShowcase.tsx");
const route = read("apex-stock-os/app/api/intelligence/route.ts");
const cfg = JSON.parse(read("apps/global-stocks-mobile/app.json"));

// The native Expo app remains the primary mobile experience. The optional
// shared-web bridge must never replace its native menus, widgets or offline UI.
must(mobileEntry.includes('import App from "./App"') &&
  !mobileEntry.includes('import App from "./src/components/UnifiedApp"') &&
  app.includes("NativeWorkspace") &&
  app.includes("NativeAuthLanding") &&
  workspace.includes('module: "charts"') &&
  workspace.includes('module: "cash"') &&
  !workspace.includes('module: "rates"') &&
  workspace.includes('active==="scan"') &&
  workspace.includes('accessibilityLabel="Escanear"') &&
  workspace.includes('module: "settings"') &&
  workspace.includes('module: "pos"'),
  "Expo must use the complete native UI, not replace it with a web wrapper.");
must(unifiedShell.includes('https://globalstocks.vercel.app') &&
  unifiedShell.includes('message.type === "open_scanner"') &&
  webScanner.includes("globalstock:native-barcode") &&
  webShell.includes("UnifiedLegalGate") &&
  webLegal.includes("2026-10-12-v5"),
  "Shared web infrastructure remains available without replacing native screens.");
must(app.includes("NativeLegalGate") && app.includes("legalUserId !== user.id"), "The legal consent gate must precede business access.");
must(
  landing.includes('<SafeAreaView edges={["top","bottom"]}') &&
  landing.includes("styles.topRow") &&
  landing.includes("styles.logoStage") &&
  landing.includes("{t.welcome}") &&
  landing.includes("{t.begin}") &&
  landing.includes("{t.existing}") &&
  landing.includes("styles.languagePicker") &&
  !landing.includes("<Svg") &&
  !landing.includes("StyleSheet.absoluteFillObject") &&
  !landing.includes('overflow:"hidden"'),
  "The restored welcome must show its navigation, brand, login options and no full-screen SVG layer."
);
must(legal.includes("adult_18_attested:true") && legal.includes("operates_in_ar_attested:true") && legal.includes("terms_version") && legal.includes("privacy_version"), "Adult and Argentina eligibility with legal versions must be recorded.");
must(legal.includes("LEGAL_TERMS_VERSION = \"2026-10-11-ar-beta\"") && legal.includes("/legal/privacy") && legal.includes("/legal/terms"), "Consent must provide access to both legal documents.");
must(legal.includes('LEGAL_PRIVACY_VERSION = "2026-10-12-v5"') &&
  privacy.includes("Versión 2026-10-12-v5") &&
  privacy.includes("CUIT"),
  "Fiscal-data privacy notice must trigger a new versioned mobile acceptance.");
must(ai.includes("global_stock_ai_data_consents") && ai.includes("approved: true"), "AI context requires explicit opt-in.");
must(ai.includes("client.auth.refreshSession()") && ai.includes("verified.user.id !== userId"), "AI must validate user identity and recover expired access tokens.");
must(
  ai.includes("function deviceClockAnswer(input: string)") &&
  ai.includes("const localClock = deviceClockAnswer(text);") &&
  ai.includes("Según el reloj de tu dispositivo") &&
  ai.includes('await client.auth.getUser()'),
  "Mobile clock utility must be accurate and must never replace actual authenticated AI conversations."
);
must(
  workspace.includes("function lookupBarcode(raw: string)") &&
  workspace.includes('accessibilityLabel="Código de barras o SKU manual"') &&
  workspace.includes("initialBarcode={pendingBarcode}") &&
  workspace.includes("canManageInventory && !productForm") &&
  productForm.includes("initialBarcode =") &&
  productForm.includes("currency =") &&
  mobileData.includes('global_stock_create_mobile_product'),
  "Manual barcode lookup must support read-only searches and permission-gated cloud product creation."
);
must(
  workspace.includes('accessibilityLabel={"Sumar stock a " + product.name}') &&
  workspace.includes('accessibilityLabel={"Agregar " + product.name + " al presupuesto"}') &&
  workspace.includes("NativeRestockPanel") &&
  workspace.includes('domain: "inventory"') &&
  nativeRestock.includes('client.rpc("global_stock_add_product_stock"') &&
  nativeRestock.includes("client_operation_id: pending.current.key") &&
  nativeRestock.includes("onSaved(confirmed)") &&
  atomicRestockSql.includes("global_stock_stock_movements") &&
  atomicRestockSql.includes("FOR UPDATE") &&
  atomicRestockSql.includes("REVOKE ALL ON FUNCTION public.global_stock_add_product_stock") &&
  atomicRestockSql.includes("GRANT EXECUTE ON FUNCTION public.global_stock_add_product_stock"),
  "Native stock additions must update confirmed cloud stock once, not add products to a sales cart."
);
must(
  app.includes("MOBILE_BUSINESS_CATEGORIES") &&
  app.includes("newBusinessType") &&
  app.includes("newBusinessName, newBusinessType") &&
  mobileData.includes("business_type: type") &&
  mobileData.includes("Seleccioná un tipo de negocio válido."),
  "Mobile business onboarding must not assume every business is retail."
);
// The mobile Expo and browser marketing lists must use the same human
// readable sector IDs; formatting/line endings are deliberately irrelevant.
const readSectorIds = (source) => [...source.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*(?:label|icon):/g)]
  .map(match => match[1]);
const nativeSectorIds = readSectorIds(app);
const webSectorIds = readSectorIds(sectorsWeb);
must(nativeSectorIds.length === 21 &&
  JSON.stringify(nativeSectorIds) === JSON.stringify(webSectorIds),
  "Expo and web must keep all 21 natural business sectors aligned.");
must(!workspace.includes('module: "rates"') &&
  !workspace.includes('NativeCurrencies p={p}') &&
  mobileSettings.includes('["rates","Cotizaciones"]') &&
  workspace.includes('module: "cash"') &&
  workspace.includes('active==="cash" ? <NativeCashRegister') &&
  cash.includes('onScan={') === false &&
  cash.includes('onScan: () => void') &&
  cash.includes('global_stock_preview_cash_sale') &&
  cash.includes('setQuote({ ...data, key: quoteKey })') &&
  cash.includes('quote?.key === quoteKey') &&
  checkout.includes('global_stock_record_pos_sale') &&
  checkout.includes('Dinero recibido') &&
  checkout.includes('Vuelto automático') &&
  checkout.includes('client.rpc("global_stock_record_pos_sale"') &&
  checkout.includes('Confirmar cobro') &&
  checkout.includes('received_amount: method === "cash" ? tendered : total') &&
  !checkout.includes('Alert.alert(') &&
  !checkout.includes("confirmedPayment"),
  "Caja must allow one-step confirmed collection and stock deduction without stacked alerts.");
must(promoGrant.includes("GRANT SELECT ON TABLE public.global_stock_promotions TO authenticated") &&
  promoGrant.includes("REVOKE SELECT ON TABLE public.global_stock_promotions FROM anon") &&
  relatedGrants.includes("global_stock_can_write(business_id, 'customers')") &&
  relatedGrants.includes("global_stock_can_write(business_id, 'inventory')"),
  "Checkout related table grants must retain RLS and per-business permissions.");
must(legal.includes("/legal/cookies") &&
  privacy.includes("/legal/cookies") &&
  mobileData.includes('"industry"') &&
  mobileData.includes('"ecommerce"'),
  "Legal disclosures and business type IDs must stay aligned across platforms.");
must(route.includes("authorizeBusinessRequest(request, businessId)") && route.includes("AI_CONSENT_REQUIRED"), "The server must enforce tenant membership and AI consent.");
must(offline.includes("AUTOMATIC_SALE_SYNC_ENABLED = false"), "Automatic offline checkout must remain disabled.");
must(!offline.includes("service_role"), "Mobile storage must not include a service-role secret.");
must(offline.includes("purgeLocalAccountData") && app.includes("purgeLocalAccountData"), "Device logout must clear plaintext merchant data.");
const assistant = read("apps/global-stocks-mobile/src/components/NativeAssistant.tsx");
must(
  app.includes("signOutLock.current") &&
  app.includes("setLoggingOut(true)") &&
  app.includes("setLoginViewVersion((n) => n + 1)") &&
  app.includes('supabase.auth.signOut({ scope: "local" })') &&
  app.includes("onSignOut={() => void performLogout()}") &&
  workspace.includes("function requestSignOut()") &&
  workspace.includes("setShowAi(false)") &&
  workspace.includes("setMenuOpen(false)") &&
  workspace.includes("setShowLogoutConfirm(true)") &&
  workspace.includes("onSignOut={requestSignOut}") &&
  workspace.includes('if (showLogoutConfirm) return <SafeAreaView') &&
  workspace.includes("Cerrar sesión y borrar copia local") &&
  workspace.includes('if (menuOpen) return <SafeAreaView') &&
  workspace.includes('if (businessPicker) return <SafeAreaView') &&
  workspace.includes("if (showAi) return <NativeAssistant") &&
  workspace.includes('accessibilityLabel="Cerrar menú"') &&
  assistant.includes('accessibilityLabel="Cerrar IA"') &&
  assistant.includes('<SafeAreaView edges={["top", "bottom"]}') &&
  !workspace.includes("StyleSheet.absoluteFillObject,{zIndex:30}") &&
  !workspace.includes("<Modal ") &&
  !assistant.includes("<Modal ") &&
  assistant.includes("if (!visible) return null;"),
  "All mobile navigation screens must occupy safe area and close reliably without native or absolute overlays."
);
must(workspace.includes("NativePrintCenter") && !workspace.includes("NativeCashCheckout"), "Native cash checkout must remain excluded from Argentina free beta UI.");
must(cfg.expo.name === "Global Stock" && cfg.expo.slug === "global-stocks", "Expo app identity mismatch.");
must(cfg.expo.android?.permissions?.includes("CAMERA"), "Only the documented barcode camera permission is expected.");
must(existsSync(resolve(repo, "docs/ARGENTINA_BETA_LAUNCH_2026.md")), "The Argentina beta release checklist must exist.");
must(commerce.includes('value:"other"') && commerce.includes('value:"custom"') &&
  commerce.includes("publicStoreOrigin") && commerce.includes('status:"requested"'),
  "Store onboarding must offer custom/other providers and never auto-verify connections.");
must(commerce.includes("global_stock_integration_accounts") &&
  commerce.includes('status==="connected"'),
  "Verified integrations must be distinguished from link requests.");
must(integrationSql.includes("enable row level security") &&
  integrationSql.includes("member_role(business_id)") &&
  integrationSql.includes("status = 'requested'") &&
  !integrationSql.includes("encrypted_access_token"),
  "Tenant RLS and pending-only integration requests must be enforced.");
must(fiscal.includes('enabled:profile?.enabled===true') &&
  fiscal.includes('environment:profile?.environment==="production"?"production":"testing"') &&
  !fiscal.includes('ARCA_FISCAL_PROVIDER_API_KEY'),
  "Fiscal onboarding cannot create a new enabled production profile or handle provider keys.");
must(workspace.includes('module: "fiscal"') && workspace.includes('module: "online"'),
  "Fiscal and commerce menu entries must be present.");
process.stdout.write("Argentina beta source guards passed. These are not substitutes for live security/legal/device checks.\n");
