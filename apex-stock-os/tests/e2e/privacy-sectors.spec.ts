import { expect, test } from "@playwright/test";

const referenceSectors = [
  "Almacén / Kiosco", "Indumentaria", "Carnicería", "Verdulería",
  "Panadería", "Farmacia", "Librería", "Ferretería", "Electrónica",
  "Dietética", "Estética", "Óptica", "Veterinaria", "Joyería",
  "Peluquería", "Restaurante", "Mayorista / Depósito", "Taller / Fábrica",
  "Tienda online", "Servicios", "Otro negocio"
];

test("natural sector names match mobile onboarding reference and details switch", async ({ page }) => {
  await page.goto("/download", { waitUntil: "domcontentloaded" });
  const sectors = page.locator("#download-sectors");
  await sectors.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  const buttons = sectors.locator("button[aria-pressed]");
  await expect(buttons).toHaveCount(referenceSectors.length, { timeout: 30000 });
  for (const name of referenceSectors) {
    await expect(buttons.getByText(name, { exact: true })).toHaveCount(1);
  }
  await sectors.getByRole("button", { name: "Ferretería" }).click();
  await expect(sectors.getByRole("button", { name: "Ferretería" })).toHaveAttribute("aria-pressed", "true");
  await expect(sectors.getByRole("heading", { name: "Herramientas y materiales" })).toBeVisible();
});

test("privacy and cookie disclosures are accessible from footer", async ({ page }) => {
  const r = await page.goto("/legal/cookies", { waitUntil: "domcontentloaded" });
  expect(r?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Cookies y almacenamiento", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Analíticas y seguimiento" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacidad" }).last()).toBeVisible();
  await page.goto("/download", { waitUntil: "domcontentloaded" });
  await expect(page.locator("footer").getByRole("link", { name: "Cookies y almacenamiento" })).toHaveAttribute("href", "/legal/cookies");
  await page.goto("/legal/privacy", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Versión 2026-10-27-v6", { exact: false })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Correos de novedades" })).toBeVisible();
  await page.goto("/legal/terms", { waitUntil: "domcontentloaded" });
  await expect(page.getByText(/al menos 18 años/)).toBeVisible();
});

test("public content remains readable with reduced motion at mobile width", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/download", { waitUntil: "domcontentloaded" });
  const sectors = page.locator("#download-sectors");
  await sectors.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await expect(sectors.getByRole("button", { name: "Carnicería" })).toBeVisible();
  await sectors.getByRole("button", { name: "Carnicería" }).click();
  await expect(sectors.getByRole("heading", { name: "Carnes y embutidos" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("the public hero avoids the old generic promise", async ({ page }) => {
  await page.goto("/download", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Gestión de stock, ventas y caja para tu negocio.");
  await expect(page.getByRole("heading", { name: "Controlá tu negocio. Desde un solo lugar." })).toHaveCount(0);
});
