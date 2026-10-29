import { expect, test } from "@playwright/test";
import { canAccessModule } from "../apex-stock-os/lib/access-control";

test("new fiscal and account entries preserve role permissions", () => {
  expect(canAccessModule("arca", "owner")).toBe(true);
  expect(canAccessModule("arca", "accountant")).toBe(true);
  expect(canAccessModule("arca", "cashier")).toBe(false);
  expect(canAccessModule("account", "cashier")).toBe(true);
  expect(canAccessModule("account", "viewer")).toBe(true);
  expect(canAccessModule("settings", "viewer")).toBe(false);
});

test("desktop shows all six groups in order, correct entries, working routes, and no floating arrows", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Desktop navigation visual test.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => window.localStorage.setItem("__global_stock_demo_active_v1", "1"));
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const nav = page.locator("#business-sidebar-nav");
  await expect(nav).toBeVisible({ timeout: 30000 });
  const groupHeadings = nav.locator("section > p");
  await expect(groupHeadings).toHaveText(["Principal", "Análisis", "Organización", "Gestión", "Ajustes", "Legal"]);
  const sections = nav.locator("section");
  const groupContent = [
    ["Inicio", "Caja Registradora", "Almacén", "Tienda online"],
    ["Gráficos", "Actividad"],
    ["Proveedores", "Reposición", "Agenda"],
    ["Comprobantes", "ARCA Facturación", "Negocios / Locales"],
    ["Configuración", "Cuenta / Cuentas"],
    ["Términos y condiciones", "Política de privacidad", "Política de cookies", "Seguridad"]
  ];
  for (let i = 0; i < groupContent.length; i++) {
    await expect(sections.nth(i).locator("button, a")).toHaveText(groupContent[i]);
  }

  await expect(page.locator(".gs-sidebar-scroll-control")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Subir en el menú lateral" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Bajar en el menú lateral" })).toHaveCount(0);
  await expect(nav).toHaveCSS("overflow-y", "auto");
  await expect(nav.getByRole("link", { name: "Política de privacidad" })).toHaveAttribute("href", "/legal/privacy");
  await expect(nav.getByRole("link", { name: "Política de cookies" })).toHaveAttribute("href", "/legal/cookies");

  await nav.getByRole("button", { name: "Cuenta / Cuentas" }).click();
  await expect(page.getByRole("heading", { name: "Cuenta / Cuentas", exact: true })).toBeVisible();
  await nav.getByRole("button", { name: "ARCA Facturación" }).click();
  await expect(page.getByRole("heading", { name: /ARCA|factur/i }).first()).toBeVisible({ timeout: 20000 });
});

test("mobile menu keeps the same six groups and opens legal links without floating controls", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Mobile group layout checked in Chromium.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => window.localStorage.setItem("__global_stock_demo_active_v1", "1"));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Menú", exact: true }).first().click();
  await expect(page.getByText("Ajustes", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Legal", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Términos y condiciones" })).toHaveAttribute("href", "/legal/terms");
  await expect(page.getByRole("link", { name: "Seguridad" })).toHaveAttribute("href", "/legal/security");
  await expect(page.locator(".gs-sidebar-scroll-control")).toHaveCount(0);
});
