import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const mobile = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(mobile, "../..");
const read = (path) => readFileSync(resolve(repo, path), "utf8");
const must = (condition, explanation) => { if (!condition) throw new Error("BETA GATE FAILED: " + explanation); };

const app = read("apps/global-stocks-mobile/App.tsx");
const legal = read("apps/global-stocks-mobile/src/components/NativeLegalGate.tsx");
const ai = read("apps/global-stocks-mobile/src/components/NativeAssistant.tsx");
const offline = read("apps/global-stocks-mobile/src/lib/offline.ts");
const route = read("apex-stock-os/app/api/intelligence/route.ts");
const cfg = JSON.parse(read("apps/global-stocks-mobile/app.json"));

must(app.includes("NativeLegalGate") && app.includes("legalUserId !== user.id"), "The legal consent gate must precede business access.");
must(legal.includes("adult_18_attested:true") && legal.includes("terms_version") && legal.includes("privacy_version"), "Age and document versions must be recorded.");
must(legal.includes("/legal/privacy") && legal.includes("/legal/terms"), "Consent must provide access to both legal documents.");
must(ai.includes("global_stock_ai_data_consents") && ai.includes("approved: true"), "AI context requires explicit opt-in.");
must(ai.includes("client.auth.refreshSession()") && ai.includes("verified.user.id !== userId"), "AI must validate user identity and recover expired access tokens.");
must(route.includes("authorizeBusinessRequest(request, businessId)") && route.includes("AI_CONSENT_REQUIRED"), "The server must enforce tenant membership and AI consent.");
must(offline.includes("AUTOMATIC_SALE_SYNC_ENABLED = false"), "Automatic offline checkout must remain disabled.");
must(!offline.includes("service_role"), "Mobile storage must not include a service-role secret.");
must(cfg.expo.name === "Global Stock" && cfg.expo.slug === "global-stocks", "Expo app identity mismatch.");
must(cfg.expo.android?.permissions?.includes("CAMERA"), "Only the documented barcode camera permission is expected.");
must(existsSync(resolve(repo, "docs/ARGENTINA_BETA_LAUNCH_2026.md")), "The Argentina beta release checklist must exist.");
process.stdout.write("Argentina beta source guards passed. These are not substitutes for live security/legal/device checks.\n");
