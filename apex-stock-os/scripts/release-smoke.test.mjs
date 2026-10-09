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
  assert.match(hub, /gs-ecosystem-mobile-grid/);
  assert.match(css, /\.gs-ecosystem-stage/);
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
