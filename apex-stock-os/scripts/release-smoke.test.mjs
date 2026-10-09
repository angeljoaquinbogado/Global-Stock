import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (relative) => readFile(path.join(root, relative), "utf8");

test("public landing provides a single SEO metadata declaration", async () => {
  const page = await source("app/download/page.tsx");
  const layout = await source("app/layout.tsx");
  assert.equal((page.match(/export const metadata:/g) || []).length, 1);
  assert.match(page, /canonical:\s*"\/download"/);
  assert.match(layout, /openGraph:/);
  assert.match(layout, /twitter:/);
});

test("ecosystem has all eight modules and a responsive stage", async () => {
  const hub = await source("components/DownloadEcosystemHub.tsx");
  const css = await source("app/globals.css");
  for (const id of [
    "facturacion", "contabilidad", "crm", "proyectos",
    "equipo", "inventario", "ventas", "ia"
  ]) {
    assert.ok(hub.includes('id: "' + id + '"'), "Missing hub module: " + id);
  }
  assert.match(hub, /ResizeObserver/);
  assert.match(hub, /gs-ecosystem-mobile-orbit/);
  assert.match(hub, /gs-ecosystem-mobile-slot/);
  assert.match(css, /\.gs-ecosystem-stage/);
  const polish = await source("app/download/visual-polish.css");
  assert.match(polish, /\.gs-ecosystem-mobile-slot--7/);
  assert.match(polish, /\.gs-cinematic-device-stage/);
});

test("native wheel scrolling and scoped keyboard navigation", async () => {
  const navigator = await source("components/DownloadScrollNavigator.tsx");
  assert.ok(!navigator.includes('addEventListener("wheel"'));
  assert.match(navigator, /!isInsideHero\(hero\)/);
});

test("documents expose pending sync and explicit expense confirmation", async () => {
  const inbox = await source("components/SmartDocumentInbox.tsx");
  const endpoint = await source("app/api/document-intelligence/route.ts");
  assert.match(inbox, /:pending/);
  assert.match(inbox, /Cambios pendientes/);
  assert.match(inbox, /setRetryToken/);
  assert.match(inbox, /global_stock_expenses/);
  assert.match(inbox, /window\.confirm/);
  assert.match(inbox, /loadDemoSample/);
  assert.match(endpoint, /authorizeApiRequest/);
  assert.match(endpoint, /ALLOWED_DOCUMENT_TYPES/);
});

test("install help has modal semantics and focus management", async () => {
  const install = await source("components/InstallAppButton.tsx");
  assert.match(install, /aria-modal="true"/);
  assert.match(install, /role="dialog"/);
  assert.match(install, /last\.focus\(\)/);
  assert.match(install, /triggerRef\.current\?\.focus/);
});

test("download theme restores saved preference before painting", async () => {
  const theme = await source("components/DownloadTheme.tsx");
  assert.match(theme, /document\.currentScript\.parentElement/);
  assert.match(theme, /suppressHydrationWarning/);
});

test("internal documents recover failed cloud writes and expose retry", async () => {
  const operations = await source("components/BusinessOperations.tsx");
  assert.match(operations, /docQueueRef/);
  assert.match(operations, /docSyncState/);
  assert.match(operations, /internalDocuments: snapshot/);
  assert.match(operations, /:pending/);
  assert.match(operations, /setDocRetry/);
});

test("fiscal issuance stays separate from approved document expense posting", async () => {
  const inbox = await source("components/SmartDocumentInbox.tsx");
  const fiscal = await source("components/FiscalDocumentsCenter.tsx");
  assert.match(inbox, /global_stock_expenses/);
  assert.match(inbox, /No modifica caja ni stock automáticamente/);
  assert.match(fiscal, /providerReady/);
  assert.match(fiscal, /FISCAL_PROVIDER_NOT_CONFIGURED/);
});

test("ecosystem keeps its clicked module selected while hover previews links", async () => {
  const hub = await source("components/DownloadEcosystemHub.tsx");
  assert.match(hub, /data-active-module=\{selectedId\}/);
  assert.match(hub, /const \[selectedId, setSelectedId\]/);
  assert.match(hub, /const \[hoveredId, setHoveredId\]/);
  assert.match(hub, /onMouseEnter=\{\(\) => onHover\(item\.id\)\}/);
  assert.match(hub, /onClick=\{\(\) => onSelect\(item\.id\)\}/);
  assert.match(hub, /id="gs-ecosystem-detail"/);
});
