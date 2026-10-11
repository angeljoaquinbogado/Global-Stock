import { test, expect } from "@playwright/test";

// The five viewports from the original tests are preserved: each checks
// every ecosystem module, anchor destinations and horizontal overflow.
const screens = [
  { name: "PC Full HD", width: 1920, height: 1080 },
  { name: "Notebook", width: 1366, height: 768 },
  { name: "PC pantalla baja", width: 1280, height: 576 },
  { name: "iPhone", width: 390, height: 844 },
  { name: "Android pequeño", width: 360, height: 740 }
] as const;

const modules = [
  ["Facturación", "facturacion"],
  ["Contabilidad", "contabilidad"],
  ["CRM", "crm"],
  ["Proyectos", "proyectos"],
  ["Equipo", "equipo"],
  ["Inventario", "inventario"],
  ["Ventas", "ventas"],
  ["IA", "ia"]
] as const;

for (const screen of screens) {
  test(`Ecosistema: ${screen.name}`, async ({ page }, testInfo) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (error) => jsErrors.push(error.message));

    await page.setViewportSize({ width: screen.width, height: screen.height });
    const response = await page.goto("/download", { waitUntil: "domcontentloaded" });
    expect(response?.ok(), "La página de descarga debe responder correctamente").toBeTruthy();
    await expect(page).toHaveTitle(/Global Stock/i);

    // The ecosystem is hydrated lazily when scrolled into the viewport.
    const ecosystem = page.locator("#download-network");
    await ecosystem.scrollIntoViewIfNeeded();
    await expect(ecosystem).toHaveAttribute("data-active-module", /.+/, { timeout: 30_000 });

    const layoutClass = screen.width >= 1024
      ? "gs-ecosystem-node--orbit" : "gs-ecosystem-node--compact";
    const buttons = ecosystem.locator(`button.${layoutClass}`);
    await expect(buttons).toHaveCount(8);

    for (const [label, id] of modules) {
      const button = buttons.filter({ hasText: label });
      await expect(button).toHaveCount(1);
      await button.click();
      await expect(ecosystem).toHaveAttribute("data-active-module", id);
      await expect(button).toHaveAttribute("aria-pressed", "true");

      const link = ecosystem.locator("#gs-ecosystem-detail a[href^='#']");
      await expect(link).toBeVisible();
      const target = await link.getAttribute("href");
      expect(target?.startsWith("#")).toBe(true);
      expect(await page.locator(target!).count(), `Destino de ${label}: ${target}`).toBe(1);
    }

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(horizontalOverflow, "No debe existir desplazamiento horizontal").toBeLessThanOrEqual(2);

    await ecosystem.screenshot({
      path: testInfo.outputPath("ecosistema.png"),
      animations: "disabled"
    });
    expect(jsErrors, "La página no debe lanzar excepciones de JavaScript").toEqual([]);
  });
}

test("Tema claro/oscuro: cambio y persistencia", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/download");

  const theme = page.locator(".gs-download-theme");
  await expect(theme).toHaveAttribute("data-download-theme", "light");

  await page.getByRole("button", { name: "Usar tema oscuro" }).first().click();
  await expect(theme).toHaveAttribute("data-download-theme", "dark");

  await page.reload();
  await expect(theme).toHaveAttribute("data-download-theme", "dark");

  await page.getByRole("button", { name: "Usar tema claro" }).first().click();
  await expect(theme).toHaveAttribute("data-download-theme", "light");
});
