import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(mobile, "../..");
const read = (path) => readFileSync(resolve(repo, path), "utf8");
const must = (condition, explanation) => { if (!condition) throw new Error("BETA GATE FAILED: " + explanation); };

const app = read("apps/global-stocks-mobile/App.tsx");
const legal = read("apps/global-stocks-mobile/src/components/NativeLegalGate.tsx");
const privacy = read("apex-stock-os/app/legal/privacy/page.tsx");
const ai = read("apps/global-stocks-mobile/src/components/NativeAssistant.tsx");
const offline = read("apps/global-stocks-mobile/src/lib/offline.ts");
const commerce = read("apps/global-stocks-mobile/src/components/NativeCommerceConnect.tsx");
const fiscal = read("apps/global-stocks-mobile/src/components/NativeFiscalArca.tsx");
const integrationSql = read("apex-stock-os/supabase/migrations/20261011_mobile_argentina_integrations_fiscal_access.sql");
const workspace = read("apps/global-stocks-mobile/src/components/NativeWorkspace.tsx");
const route = read("apex-stock-os/app/api/intelligence/route.ts");
const cfg = JSON.parse(read("apps/global-stocks-mobile/app.json"));

must(app.includes("NativeLegalGate") && app.includes("legalUserId !== user.id"), "The legal consent gate must precede business access.");
must(legal.includes("adult_18_attested:true") && legal.includes("operates_in_ar_attested:true") && legal.includes("terms_version") && legal.includes("privacy_version"), "Adult and Argentina eligibility with legal versions must be recorded.");
must(legal.includes("LEGAL_TERMS_VERSION = \"2026-10-11-ar-beta\"") && legal.includes("/legal/privacy") && legal.includes("/legal/terms"), "Consent must provide access to both legal documents.");
must(legal.includes('LEGAL_PRIVACY_VERSION = "2026-10-11-v3"') &&
  privacy.includes("Versión 2026-10-11-v3") &&
  privacy.includes("CUIT"),
  "Fiscal-data privacy notice must trigger a new versioned mobile acceptance.");
must(ai.includes("global_stock_ai_data_consents") && ai.includes("approved: true"), "AI context requires explicit opt-in.");
must(ai.includes("client.auth.refreshSession()") && ai.includes("verified.user.id !== userId"), "AI must validate user identity and recover expired access tokens.");
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
  workspace.includes("showLogoutConfirm ?") &&
  workspace.includes("Cerrar sesión y borrar copia local") &&
  !workspace.includes("<Modal ") &&
  !assistant.includes("<Modal ") &&
  assistant.includes("if (!visible) return null;"),
  "iOS logout must confirm in-tree, unmount overlays and reset auth UI without native sheets."
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
