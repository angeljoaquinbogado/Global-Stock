import { expect, test } from "@playwright/test";
import { isWorkspaceAccent, workspaceAccentVars, WORKSPACE_ACCENT_KEY } from "../apex-stock-os/lib/workspace-accent";

test("only the three supported theme accents can be loaded from saved preferences", () => {
  expect(isWorkspaceAccent("red")).toBe(true);
  expect(isWorkspaceAccent("blue")).toBe(true);
  expect(isWorkspaceAccent("emerald")).toBe(true);
  expect(isWorkspaceAccent("#ffffff")).toBe(false);
  expect(isWorkspaceAccent("invalid")).toBe(false);
  expect(workspaceAccentVars("red")["--apex-accent" as keyof ReturnType<typeof workspaceAccentVars>]).toBe("#8F0000");
});

test("selected accent changes entire workspace and persists between sections and reload", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Workspace styling checked in Chromium.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem("__global_stock_demo_active_v1", "1");
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const dashboard = page.getByTestId("animated-home-dashboard");
  const workspace = page.locator(".gs-app-shell");
  const nav = page.locator("#business-sidebar-nav");
  await expect(dashboard).toBeVisible({ timeout: 30_000 });
  await expect(workspace).toHaveAttribute("data-workspace-accent", "red");
  await expect(dashboard.getByRole("button", { name: "Rojo Global Stock" })).toHaveAttribute("aria-pressed", "true");

  const activeHome = nav.getByRole("button", { name: "Inicio", exact: true });
  await expect(activeHome).toHaveCSS("background-color", "rgb(143, 0, 0)");

  await dashboard.getByRole("button", { name: "Azul" }).click();
  await expect(workspace).toHaveAttribute("data-workspace-accent", "blue");
  await expect(activeHome).toHaveCSS("background-color", "rgb(36, 89, 198)");

  await nav.getByRole("button", { name: "Almacén", exact: true }).click();
  await expect(nav.getByRole("button", { name: "Almacén", exact: true })).toHaveCSS("background-color", "rgb(36, 89, 198)");
  await nav.getByRole("button", { name: "Inicio", exact: true }).click();
  await expect(dashboard).toHaveAttribute("data-accent", "blue");
  await page.reload();
  await expect(page.getByTestId("animated-home-dashboard")).toHaveAttribute("data-accent", "blue");
  await expect(activeHome).toHaveCSS("background-color", "rgb(36, 89, 198)");

  await dashboard.getByRole("button", { name: "Verde esmeralda" }).click();
  await expect(workspace).toHaveAttribute("data-workspace-accent", "emerald");
  await expect(activeHome).toHaveCSS("background-color", "rgb(8, 104, 70)");
  const saved = await page.evaluate(key => localStorage.getItem(key), WORKSPACE_ACCENT_KEY);
  expect(saved).toBe("emerald");
  await expect(dashboard.getByText(/período disponible/i)).toHaveCount(0);
  await expect(dashboard.locator(".gs-exec-period")).toHaveCount(0);
});
