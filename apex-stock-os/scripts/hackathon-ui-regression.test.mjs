import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");

test("PayPal is not shown as a floating notification and plan choices live in account", async () => {
  const shell = await read("components/ApexShell.tsx");
  const account = await read("components/WorkspaceAccountPanel.tsx");
  const plans = await read("components/SubscriptionPlans.tsx");
  assert.doesNotMatch(shell, /paypalPanelOpen|hackathonPaymentNotice|PayPal Sandbox · demo del hackathon/);
  assert.match(account, /SubscriptionPlans/);
  assert.match(plans, /Prueba gratuita/);
  assert.match(plans, /15 días/);
});

test("desktop sidebar only expands by explicit click and uses minimal section dots", async () => {
  const workspace = await read("components/BusinessWorkspace.tsx");
  assert.match(workspace, /const \\[sidebarCollapsed, setSidebarCollapsed\\] = useState\\(true\\)/);
  assert.doesNotMatch(workspace, /sidebarHovered|onMouseEnter=\\{\\(\\) => setSidebarCollapsed/);
  assert.match(workspace, /onClick=\\{\\(\\) => setSidebarCollapsed\\(value => !value\\)\\}/);
  assert.match(workspace, /aria-label=\\{sidebarCollapsed \\? "Expandir menú lateral" : "Contraer menú lateral"\\}/);
  assert.match(workspace, /after:content-\\[\'•\'\\]/);
  assert.match(workspace, /gridTemplateColumns: sidebarCollapsed \\? "76px minmax\\(0, 1fr\\)" : "250px minmax\\(0, 1fr\\)"/);
  assert.match(workspace, /transition-\\[grid-template-columns\\]/);
});

test("workspace sections maintain clean shareable URLs and premium greeting hierarchy", async () => {
  const workspace = await read("components/BusinessWorkspace.tsx");
  assert.match(workspace, /overview: "\\/dashboard"/);
  assert.match(workspace, /inventory: "\\/inventory"/);
  assert.match(workspace, /pos: "\\/sales"/);
  assert.match(workspace, /charts: "\\/analytics"/);
  assert.match(workspace, /settings: "\\/settings"/);
  assert.match(workspace, /window\\.history\\.pushState/);
  assert.match(workspace, /SF Pro Display/);
  assert.match(workspace, /rounded-full border border-\\[#8F0000\\]\\/20/);
});
test("shared focus and selection feedback follows the selected workspace accent", async () => {
  const css = await read("components/workspace-accent.css");
  assert.match(css, /\.gs-app-shell \.apex-input:focus/);
  assert.match(css, /outline-color: var\(--apex-accent\)/);
  assert.match(css, /background: color-mix\(in srgb,var\(--apex-accent\) 28%,transparent\)/);
});
