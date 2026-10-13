import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "../..");
const file = path => readFileSync(resolve(root, path), "utf8");

test("real AI requires authenticated atomic usage gate before provider generation", () => {
  const route = file("apex-stock-os/app/api/intelligence/route.ts");
  const auth = route.indexOf("authorizeApiRequest(request)");
  const tenant = route.indexOf("authorizeBusinessRequest(request, businessId)");
  const quota = route.indexOf('.rpc("global_stock_ai_allow_request")');
  const provider = route.indexOf("await generateIntelligenceAnswer({");
  assert.ok(auth > 0 && tenant > auth);
  assert.ok(quota > tenant && provider > quota);
  assert.match(route, /AI_USAGE_PROTECTION_UNAVAILABLE/);
  assert.match(route, /AI_RATE_LIMIT/);
});

test("database-backed quota isolates authenticated users and does not permit anonymous calls", () => {
  const sql = file("apex-stock-os/supabase/migrations/20261012_ai_atomic_quota.sql");
  assert.match(sql, /auth\.uid\(\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /ON CONFLICT/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.global_stock_ai_allow_request\(\) FROM PUBLIC/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.global_stock_ai_allow_request\(\) FROM anon/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.global_stock_ai_allow_request\(\) TO authenticated/);
  assert.match(sql, /20 WHEN 2 THEN 150 ELSE 500/);
});

test("Gemini requests never launch unbounded generations", () => {
  const ai = file("apex-stock-os/lib/ai-provider.ts");
  assert.match(ai, /async function askGemini\(/);
  assert.match(ai, /getBackupModel\(/);
  assert.match(ai, /geminiQuotaCooldown/);
  assert.match(ai, /cachedGeminiModels/);
  assert.match(ai, /maxOutputTokens: mobile \? 640 : 2048/);
  assert.doesNotMatch(ai, /while\s*\(\s*true\s*\)/);
  assert.doesNotMatch(ai, /for\s*\(\s*;\s*;\s*\)/);
});

test("Expo and web share the same 21 natural business sector IDs", () => {
  const mobile = file("apps/global-stocks-mobile/App.tsx");
  const web = file("apex-stock-os/components/DownloadSectorShowcase.tsx");
  const find = source => [...source.matchAll(/\{\s*id:\s*"([^"]+)"\s*,\s*(?:label|icon):/g)].map(m => m[1]);
  assert.equal(find(mobile).length, 21);
  assert.deepEqual(find(mobile), find(web));
});

test("Argentina beta stays 18+ and public pages explain storage and marketing", () => {
  const legal = file("apps/global-stocks-mobile/src/components/NativeLegalGate.tsx");
  const privacy = file("apex-stock-os/app/legal/privacy/page.tsx");
  const cookies = file("apex-stock-os/app/legal/cookies/page.tsx");
  assert.match(legal, /18 años o más/);
  assert.match(legal, /operates_in_ar_attested:true/);
  assert.match(legal, /2026-10-12-v5/);
  assert.match(privacy, /Correos de novedades/);
  assert.match(cookies, /Analíticas y seguimiento/);
});

test("native and web expose Caja without duplicating Cotizaciones or bypassing sale protection", () => {
  const mobile = file("apps/global-stocks-mobile/src/components/NativeWorkspace.tsx");
  const cash = file("apps/global-stocks-mobile/src/components/NativeCashRegister.tsx");
  const checkout = file("apps/global-stocks-mobile/src/components/NativeCashCheckout.tsx");
  const settings = file("apps/global-stocks-mobile/src/components/NativeSettings.tsx");
  const web = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const roles = file("apex-stock-os/lib/access-control.ts");
  assert.match(mobile, /module: "cash"/);
  assert.match(mobile, /onScan=\{scanToCash\}/);
  assert.doesNotMatch(mobile, /module: "rates"/);
  assert.match(settings, /"rates","Cotizaciones"/);
  assert.match(cash, /global_stock_preview_cash_sale/);
  const quoteMigration = file("apex-stock-os/supabase/migrations/20261013_cash_quote_server.sql");
  assert.match(quoteMigration, /global_stock_can_write\(target_business_id, 'sales'\)/);
  assert.match(quoteMigration, /global_stock_promotions/);
  assert.match(quoteMigration, /GRANT EXECUTE ON FUNCTION public\.global_stock_preview_cash_sale/);
  assert.match(cash, /global_stock_sales/);
  assert.match(checkout, /global_stock_record_pos_sale/);
  assert.match(checkout, /Vuelto automático/);
  assert.match(checkout, /operation\.current\.key/);
  assert.match(web, /cashMode=\{activeModule === "cash"\}/);
  assert.match(roles, /cash: \["owner", "admin", "manager", "cashier", "sales"\]/);
});

test("atomic inventory additions from Expo and PC are tenant-safe and retryable", () => {
  const migration = file("apex-stock-os/supabase/migrations/20261013_add_product_stock_atomic.sql");
  const native = file("apps/global-stocks-mobile/src/components/NativeRestockPanel.tsx");
  const workspace = file("apps/global-stocks-mobile/src/components/NativeWorkspace.tsx");
  const web = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const browserCell = file("apex-stock-os/components/StockQuantityCell.tsx");
  const shared = file("apex-stock-os/lib/cloud-workspace.ts");
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /global_stock_can_write\(target_business_id, 'inventory'\)/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /global_stock_stock_movements/);
  assert.match(migration, /global_stock_record_stock_adjustment\(/);
  assert.match(migration, /REVOKE ALL ON FUNCTION public\.global_stock_add_product_stock/);
  assert.match(migration, /TO authenticated/);
  assert.match(native, /client\.rpc\("global_stock_add_product_stock"/);
  assert.match(native, /client_operation_id: pending\.current\.key/);
  assert.match(workspace, /Sumar stock a /);
  assert.match(workspace, /Al carrito/);
  assert.match(workspace, /domain: "inventory"/);
  assert.match(browserCell, /onBlur=\{commitStock\}/);
  assert.match(browserCell, /onAddStock\(productId, quantity, pending\.current\.key\)/);
  assert.match(shared, /addProductStockToCloud/);
  assert.match(web, /addStock=\{addStock\}/);
  assert.match(web, /StockQuantityCell/);
});
