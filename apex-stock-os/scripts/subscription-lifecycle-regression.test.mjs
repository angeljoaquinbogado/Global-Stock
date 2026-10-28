import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

test("signup requires an explicit plan and stores it as account metadata on web and mobile", async () => {
  const web = await read("components/AuthScreen.tsx");
  const mobile = await read("../apps/global-stocks-mobile/src/components/NativeAuthLanding.tsx");
  const mobileApp = await read("../apps/global-stocks-mobile/App.tsx");
  assert.match(web, /selectedPlan/);
  assert.match(web, /global_stock_selected_plan: selectedPlan/);
  assert.match(web, /global_stock_selected_plan: "pending"/);
  assert.match(web, /PASO 2 DE 2/);
  assert.match(web, /US\\\$ 10 \/ mes/);
  assert.match(mobile, /selectedPlan/);
  assert.match(mobile, /15 días de prueba sin cobro automático/);
  assert.match(mobileApp, /global_stock_selected_plan: selectedPlan/);
});

test("subscription migration creates a 15-day trial with owner-only RLS and guarded cancellation", async () => {
  const sql = await read("supabase/migrations/20261027_global_stock_subscriptions.sql");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.global_stock_subscriptions/);
  assert.match(sql, /now\(\) \+ interval '15 days'/);
  assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /SUBSCRIPTION_FIELDS_READ_ONLY/);
  assert.match(sql, /global_stock_create_subscription_for_new_user/);
  assert.match(sql, /ON CONFLICT \(user_id\) DO NOTHING/);
});

test("subscription pricing uses round USD values and cancellation cannot be reinstated", async () => {
  const plans = await read("components/SubscriptionPlans.tsx");
  const webSignup = await read("components/AuthScreen.tsx");
  const mobileSignup = await read("../apps/global-stocks-mobile/src/components/NativeAuthLanding.tsx");
  const migration = await read("supabase/migrations/20261027_global_stock_usd_pricing_irreversible_cancel.sql");
  assert.match(plans, /price: 5/);
  assert.match(plans, /price: 10/);
  assert.match(plans, /currency: "USD"/);
  assert.match(webSignup, /US\$ 5/);
  assert.match(webSignup, /US\$ 10/);
  assert.match(mobileSignup, /US\$ 5 \/ mes/);
  assert.match(mobileSignup, /US\$ 10 \/ mes/);
  assert.match(migration, /price_usd integer/);
  assert.match(migration, /SUBSCRIPTION_CANCELLATION_CANNOT_BE_REVERSED/);
});

test("subscription cancellation is exposed in both account surfaces and calls PayPal only server-side", async () => {
  const web = await read("components/SubscriptionManagement.tsx");
  const mobile = await read("../apps/global-stocks-mobile/src/components/NativeSubscriptionManagement.tsx");
  const route = await read("app/api/billing/cancel/route.ts");
  assert.match(web, /cancel_at_period_end: true/);
  assert.match(web, /\/api\/billing\/cancel/);
  assert.match(mobile, /cancel_at_period_end: true/);
  assert.match(route, /auth\.getUser\(accessToken\)/);
  assert.match(route, /\/v1\/billing\/subscriptions/);
  assert.match(route, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(web, /PAYPAL_CLIENT_SECRET/);
});

test("subscription terms disclose trial end, no automatic charge, cancellation and data retention", async () => {
  const terms = await read("app/legal/terms/page.tsx");
  const privacy = await read("app/legal/privacy/page.tsx");
  const webLegal = await read("components/UnifiedLegalGate.tsx");
  const mobileLegal = await read("../apps/global-stocks-mobile/src/components/NativeLegalGate.tsx");
  assert.match(terms, /no genera un cobro automático/);
  assert.match(terms, /La persona usuaria puede cancelar/);
  assert.match(privacy, /Datos de suscripción y pagos/);
  assert.match(webLegal, /2026-10-27-ar-suscripciones/);
  assert.match(mobileLegal, /2026-10-27-ar-suscripciones/);
});