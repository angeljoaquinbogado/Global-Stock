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
  // Checkout and shift management are two tabs of the same Cash Register module.
  assert.match(web, /activeModule === "cash" && \(/);
  assert.match(web, /cashTab === "checkout"/);
  assert.match(web, /cashTab === "management"/);
  assert.match(web, /<CashRegisterCenter/);
  assert.match(web, /cashMode=\{true\}/);
  assert.doesNotMatch(web, /activeModule === "pos" && \(/);
  assert.doesNotMatch(web, /\{ id: "pos", icon:/);
  const cashRegister = file("apex-stock-os/components/CashRegisterCenter.tsx");
  const shifts = file("apex-stock-os/supabase/migrations/20261016_cash_register_shifts.sql");
  assert.match(cashRegister, /global_stock_open_cash_shift/);
  assert.match(cashRegister, /global_stock_close_cash_shift/);
  assert.match(cashRegister, /global_stock_cash_shift_snapshot/);
  assert.match(shifts, /global_stock_can_write\(target_business_id,'cash'\)/);
  assert.match(shifts, /gs_cash_one_open_shift_per_location/);
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

test("web and Expo share authorized business switching, branch isolation and transfers", () => {
  const native = file("apps/global-stocks-mobile/src/components/NativeBusinessManager.tsx");
  const desktop = file("apex-stock-os/components/BusinessLocationsCenter.tsx");
  const workspace = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const cloud = file("apex-stock-os/lib/cloud-workspace.ts");
  for (const source of [native, desktop]) {
    assert.match(source, /global_stock_locations/);
    assert.match(source, /global_stock_inventory_levels/);
    assert.match(source, /global_stock_execute_transfer/);
    assert.match(source, /global_stock_archive_location/);
    assert.match(source, /global_stock_members/);
  }
  assert.match(cloud, /global-stock-active-business-id/);
  assert.match(cloud, /memberships\?\.find/);
  assert.match(workspace, /BusinessLocationsCenter/);
  assert.match(desktop, /client\.auth\.getUser\(\)/);
  assert.match(desktop, /\.eq\("business_id",businessId\)/);
});
test("Windows install and Android signed release profiles use proper packaging", () => {
  const manifest=JSON.parse(file("apex-stock-os/public/manifest.webmanifest"));
  const eas=JSON.parse(file("apps/global-stocks-mobile/eas.json"));
  const expo=JSON.parse(file("apps/global-stocks-mobile/app.json"));
  const nativeEntry=file("apps/global-stocks-mobile/index.ts");
  const workflow=file(".github/workflows/global-stock-android-release.yml");
  assert.equal(manifest.display,"standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length>=2);
  assert.equal(eas.build.preview.android.buildType,"apk");
  assert.equal(eas.build.production.android.buildType,"app-bundle");
  assert.equal(expo.expo.android.package,"app.globalstocks.mobile");
  assert.match(nativeEntry, /import App from "\.\/App"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /EXPO_TOKEN/);
  assert.doesNotMatch(workflow, /eas submit /);
});

test("online connection management parity preserves server-side authorization", () => {
  const web=file("apex-stock-os/components/OnlineConnectionRequests.tsx");
  const expo=file("apps/global-stocks-mobile/src/components/NativeCommerceConnect.tsx");
  const shell=file("apex-stock-os/components/BusinessWorkspace.tsx");
  for (const source of [web,expo]) {
    assert.match(source,/global_stock_integration_requests/);
    assert.match(source,/global_stock_integration_accounts/);
    assert.match(source,/global_stock_manage_integration_request/);
    assert.match(source,/global_stock_disconnect_integration_account/);
  }
  assert.match(shell,/OnlineConnectionRequests/);
  assert.match(web,/client\.auth\.getUser\(\)/);
  assert.match(web,/\.eq\("business_id",businessId\)/);
  assert.match(web,/owner.*admin/);
  assert.match(web,/No hay conexiones ni solicitudes guardadas/);
});

test("disconnect a single online store and preserve other accounts on its provider", () => {
  const sql=file("apex-stock-os/supabase/migrations/20261013_disconnect_single_online_account.sql");
  const mobile=file("apps/global-stocks-mobile/src/components/NativeCommerceConnect.tsx");
  const web=file("apex-stock-os/components/OnlineConnectionRequests.tsx");
  assert.match(sql,/target_account_id uuid/);
  assert.match(sql,/AND id = target_account_id/);
  assert.match(sql,/v_remaining = 0/);
  assert.match(sql,/connection_key = v_account.external_account_id/);
  assert.match(sql,/NOT IN \('owner', 'admin'\)/);
  assert.match(sql,/REVOKE ALL ON FUNCTION public.global_stock_disconnect_integration_account/);
  for(const source of [mobile,web]){
    assert.match(source,/target_account_id:account.id/);
    assert.doesNotMatch(source,/target_provider:account.provider/);
  }
});

test("cash scanner sends product codes without remote sale confirmation", () => {
  const cashier = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const paired = file("apex-stock-os/components/CashDeviceScanner.tsx");
  const mobile = file("apex-stock-os/app/scan-remote/page.tsx");
  const camera = file("apex-stock-os/components/BarcodeCameraCapture.tsx");
  assert.match(cashier, /<CashDeviceScanner/);
  assert.match(cashier, /applyCashCode\(raw/);
  assert.match(paired, /crypto\.randomUUID\(\)/);
  assert.match(paired, /Date\.now\(\)\+10\*60\*1000/);
  assert.match(paired, /\/scan-remote#pair=/);
  assert.match(mobile, /channel\.send\(/);
  assert.match(mobile, /type:"broadcast",event:"barcode"/);
  assert.doesNotMatch(mobile, /completeSale|global_stock_record_pos_sale/);
  assert.match(camera, /decodeFromVideoDevice/);
});

test("analytics, supplier editor and document actions keep their requested design scope", () => {
  const charts = file("apex-stock-os/components/PremiumCharts.tsx");
  const suppliers = file("apex-stock-os/components/SupplierDirectory.tsx");
  const docs = file("apex-stock-os/components/SmartDocumentInbox.tsx");
  assert.match(charts, /dailyAverage/);
  assert.match(charts, /periodMargin/);
  assert.match(charts, /visibleSeries/);
  assert.doesNotMatch(charts, /onAccentChange/);
  assert.match(suppliers, /createPortal\(/);
  assert.match(suppliers, /aria-modal="true"/);
  assert.match(docs, /xl:w-\[245px\]/);
  assert.match(docs, /h-12 w-full/);
});

test("integer warehouse steppers and Agenda controls remain native-theme free", () => {
  const stock = file("apex-stock-os/components/StockQuantityCell.tsx");
  const workspace = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const agenda = file("apex-stock-os/components/NotesHub.tsx");
  const assistant = file("apex-stock-os/components/ApexIntelligence.tsx");

  assert.match(stock, /step="1"\s+aria-label="Stock actual"/);
  assert.doesNotMatch(stock, /step="0\.001"/);
  assert.match(workspace, /inputMode="numeric" pattern="\[0-9\]\*"/);
  assert.match(workspace, /<Minus size=\{14\}\/>/);
  assert.match(workspace, /<Plus size=\{14\}\/>/);

  assert.match(agenda, /setCalendarMonth\(new Date\(year-1,month,1\)\)/);
  assert.match(agenda, /setCalendarMonth\(new Date\(year\+1,month,1\)\)/);
  assert.ok(agenda.indexOf("onClick={() => removeNote(note.id)}") < agenda.indexOf("{note.text}"));
  assert.match(assistant, /rounded-full border border-\[var\(--apex-border\)\] bg-\[var\(--apex-surface-strong\)\]/);
  assert.match(assistant, /bg-\[var\(--apex-accent\)\] text-white/);
});

test("reminder controls, full-size calendar and intelligence launcher remain usable", () => {
  const agenda = file("apex-stock-os/components/NotesHub.tsx");
  const ai = file("apex-stock-os/components/ApexIntelligence.tsx");
  assert.match(agenda, /flex items-center gap-3 rounded-2xl border/);
  assert.match(agenda, /h-9 w-9 shrink-0 place-items-center rounded-full border-2/);
  assert.match(agenda, /aria-pressed=\{note.done\}/);
  assert.match(agenda, /standalone \? "w-full p-4 sm:p-6 lg:p-7"/);
  assert.match(agenda, /standalone\s*\? "flex h-\[clamp\(46px,6vw,64px\)\]/);
  assert.match(agenda, /max-w-\[720px\]/);
  assert.match(agenda, /standalone \? "text-xs sm:py-2" : "text-\[9px\]"/);
  assert.match(agenda, /xl:sticky xl:top-24/);
  assert.match(ai, /const \[launcherExpanded, setLauncherExpanded\]/);
  assert.match(ai, /\(hover: hover\) and \(pointer: fine\)/);
  assert.match(ai, /setTimeout\(\(\) => setLauncherExpanded\(true\), 5000\)/);
  assert.match(ai, /animate=\{\{ width: launcherExpanded \? 226 : 56 \}\}/);
  assert.match(ai, /onClick=\{activateLauncher\}/);
  assert.match(ai, /setAutoRevealCancelled\(true\)/);
  assert.match(ai, /setOpen\(true\)/);
});

test("workspace header popovers animate downward without changing the theme switch", () => {
  const workspace = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const prefs = file("apex-stock-os/components/GlobalPreferences.tsx");
  const install = file("apex-stock-os/components/InstallAppButton.tsx");
  assert.match(workspace, /<InstallAppButton language=\{language\} variant="header"/);
  assert.match(workspace, /<GlobalPreferences\s+variant="header"/);
  assert.match(prefs, /variant === "header"/);
  assert.match(prefs, /role="menuitemradio"/);
  assert.match(prefs, /initial=\{\{opacity:0, y:-10, scaleY:\.93\}\}/);
  assert.match(install, /variant === "header"/);
  assert.match(install, /gs-install-device-options/);
  assert.match(install, /\/platforms\/windows\.png/);
  assert.match(install, /\/platforms\/android\.png/);
  assert.match(install, /\/platforms\/apple\.png/);
  assert.match(install, /await install\(\)/);
  assert.match(install, /showHelp && \(/);
  assert.match(workspace, /onClick=\{onToggleTheme\}/);
});

test("internal documents and ARCA fiscal issuance are separate workspaces", () => {
  const workspace = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const inbox = file("apex-stock-os/components/SmartDocumentInbox.tsx");
  const fiscal = file("apex-stock-os/components/FiscalDocumentsCenter.tsx");
  const internal = file("apex-stock-os/components/BusinessOperations.tsx");
  assert.match(workspace, /activeModule === "arca" && \(\s*<FiscalDocumentsCenter/);
  assert.match(workspace, /activeModule === "documents" && \(\s*<SmartDocumentInbox/);
  assert.doesNotMatch(inbox, /<FiscalDocumentsCenter/);
  assert.doesNotMatch(inbox, /import \{ FiscalDocumentsCenter \}/);
  assert.match(inbox, /<DocumentsHub/);
  assert.match(inbox, /fileInputRef\.current\?\.click\(\)/);
  assert.match(inbox, /registerApprovedExpense\(document\)/);
  assert.match(fiscal, /issueDocument\(document.id\)/);
  assert.match(fiscal, /authorization_code/);
  assert.match(internal, /Documento interno sin validez fiscal/);
});

test("business areas use a compact primary nav and role-aware grouped operations menu", () => {
  const suite = file("apex-stock-os/components/BusinessSuite.tsx");
  const operations = file("apex-stock-os/components/OperationsCenter.tsx");
  assert.match(suite, /canAccessBusinessSuiteTab\(id, memberRole, demoMode\)/);
  assert.match(suite, /aria-label=\{tr\(language, \{ es: "Áreas del negocio"/);
  assert.match(suite, /setTab\(id\)/);
  assert.match(suite, /tab === "finance"/);
  assert.match(suite, /tab === "crm"/);
  assert.match(suite, /tab === "projects"/);
  assert.match(suite, /tab === "people"/);
  assert.doesNotMatch(suite, /Toda la empresa en un solo lugar/);
  assert.match(operations, /const operationGroups:/);
  assert.match(operations, /visibleTabs\.find\(item=>item\.id===id\)/);
  assert.match(operations, /canAccessOperationTab\(id, memberRole, demoMode\)/);
  assert.match(operations, /useState<Tab>\("locations"\)/);
  assert.match(operations, /xl:grid-cols-\[210px_minmax\(0,1fr\)\]/);
  assert.match(operations, /tab === "cash"/);
  assert.match(operations, /tab === "customers"/);
  assert.match(operations, /tab === "expenses"/);
  assert.match(operations, /tab === "locations"/);
  assert.match(operations, /tab === "purchases"/);
  assert.match(operations, /tab === "team"/);
  assert.match(operations, /tab === "advanced"/);
  assert.match(operations, /await reload\(\)/);
});

test("configuration uses unique settings without duplicating global toolbar actions", () => {
  const workspace = file("apex-stock-os/components/BusinessWorkspace.tsx");
  const operations = file("apex-stock-os/components/OperationsCenter.tsx");
  const settings = workspace.slice(workspace.indexOf("function SettingsModule({"));
  assert.match(settings, /<BusinessTypePicker/);
  assert.match(settings, /<FxCenter/);
  assert.match(settings, /<NewsletterPreferences/);
  assert.doesNotMatch(settings, /<InstallAppButton/);
  assert.doesNotMatch(settings, /<GlobalPreferences/);
  assert.doesNotMatch(settings, /<BusinessLocationsCenter/);
  assert.doesNotMatch(settings, /onToggleTheme/);
  assert.doesNotMatch(settings, /onSignOut/);
  assert.match(operations, /<BusinessLocationsCenter businessId=\{businessId\} currency=\{currency\}/);
  assert.match(operations, /locationsAdvancedOpen &&/);
});

test("business picker and newsletter follow the chosen workspace accent", () => {
  const picker = file("apex-stock-os/components/BusinessTypePicker.tsx");
  const newsletter = file("apex-stock-os/components/NewsletterPreferences.tsx");
  for(const source of [picker, newsletter]) {
    assert.match(source, /var\(--apex-accent\)/);
    assert.doesNotMatch(source, /#8F0000|#B51C30|#C5283A|#B31E30|#C31D2F/);
  }
});

test("exchange rates keep full calculation precision but display two decimals", () => {
  const fx = file("apex-stock-os/components/FxCenter.tsx");
  assert.match(fx, /numericAmount \* quote\.rate/);
  assert.match(fx, /minimumFractionDigits: 2/);
  assert.match(fx, /maximumFractionDigits: 2/);
  assert.match(fx, /quote\.rate \* quoteUnits/);
  assert.match(fx, /matrixUnits/);
  assert.doesNotMatch(fx, /maximumFractionDigits: 6|maximumFractionDigits: 8/);
});
