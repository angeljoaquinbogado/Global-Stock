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
  assert.ok(workspace.includes('const [sidebarCollapsed, setSidebarCollapsed] = useState(true)'));
  assert.ok(!workspace.includes("sidebarHovered"));
  assert.ok(!workspace.includes("onMouseEnter={() => setSidebarCollapsed"));
  assert.ok(workspace.includes("onClick={() => setSidebarCollapsed(value => !value)}"));
  assert.ok(workspace.includes('aria-label={sidebarCollapsed ? "Expandir menú lateral" : "Contraer menú lateral"}'));
  assert.ok(workspace.includes('aria-hidden="true" initial={false} animate={{ opacity: 1 }} className="flex h-5 items-center justify-center text-sm leading-none text-[var(--apex-muted)]"'));
  assert.ok(workspace.includes("stiffness: 300, damping: 30"));
  assert.ok(workspace.includes("text-xs font-medium leading-5"));
  assert.ok(workspace.includes("min-w-[218px] space-y-5 pb-4"));
  assert.ok(workspace.includes("AnimatePresence initial={false}"));
  assert.ok(workspace.includes('overview: "/dashboard"'));
  assert.ok(workspace.includes('inventory: "/inventory"'));
  assert.ok(workspace.includes('pos: "/sales"'));
  assert.ok(workspace.includes('charts: "/analytics"'));
  assert.ok(workspace.includes('settings: "/settings"'));
  assert.ok(workspace.includes("window.history.pushState"));
  assert.ok(workspace.includes("SF Pro Display"));
  assert.ok(workspace.includes("rounded-full border border-[#8F0000]/20"));
  assert.ok(workspace.includes('gridTemplateColumns: sidebarCollapsed ? "76px minmax(0, 1fr)" : "250px minmax(0, 1fr)"'));
  assert.ok(workspace.includes("transition-[grid-template-columns]"));
});

test("shared focus and selection feedback follows the selected workspace accent", async () => {
  const css = await read("components/workspace-accent.css");
  assert.match(css, /\.gs-app-shell \.apex-input:focus/);
  assert.match(css, /outline-color: var\(--apex-accent\)/);
  assert.match(css, /background: color-mix\(in srgb,var\(--apex-accent\) 28%,transparent\)/);
});
