import { expect, test } from "@playwright/test";

// Visual behavior matches the supplied second reference video:
// mode changes are triggered by a small inline link, NOT an upper tab bar.
for (const viewport of [
  { name: "large desktop", width: 1440, height: 900 },
  { name: "notebook 1366x640", width: 1366, height: 640 },
  { name: "iPhone", width: 390, height: 844 },
  { name: "small Android", width: 360, height: 740 }
]) {
  test("fixed reference auth switches without bars on " + viewport.name, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Reference animation geometry is checked in Chromium.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const stage = page.getByTestId("auth-split-stage");
    const panel = page.getByTestId("auth-form-panel");
    await expect(stage).toBeVisible({ timeout: 30_000 });
    await expect(panel).toBeVisible();

    // The old coloured tab strip and its animated red selection have gone.
    await expect(page.locator('[layoutid="gs-auth-active-tab"], .gs-auth-active-tab')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toHaveCount(1);
    await expect(panel).toHaveClass(/gs-auth-panel-fixed/);
    expect(await panel.evaluate(el => getComputedStyle(el).overflowY)).toBe("hidden");

    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Crear cuenta", exact: true })).toBeVisible();
    await expect(page.locator("form input[autocomplete=name]")).toBeVisible();
    await expect(page.getByRole("checkbox", {
      name: "Declaro ser mayor de 18 años y aceptar los términos y la privacidad"
    })).toBeVisible();
    await expect(panel).toHaveClass(/gs-auth-panel-fixed/);
    expect(await panel.evaluate(el => getComputedStyle(el).overflowY)).toBe("hidden");

    const registrationSubmit = page.locator("form button[type=submit]");
    await expect(registrationSubmit).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.getByText("Nombre del negocio", { exact: true })).toHaveCount(0);

    const dimensionCheck = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="auth-form-panel"]')!;
      const main = document.querySelector('.gs-auth-viewport')!;
      return {
        horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        panelOverflow: panel.scrollHeight - panel.clientHeight,
        panelScrollY: panel.scrollTop,
        mainOverflow: main.scrollHeight - main.clientHeight,
      };
    });
    expect(dimensionCheck.horizontal).toBeLessThanOrEqual(2);
    expect(dimensionCheck.vertical).toBeLessThanOrEqual(2);
    expect(dimensionCheck.panelScrollY).toBe(0);
    expect(dimensionCheck.panelOverflow).toBeLessThanOrEqual(2);

    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toBeVisible();
  });
}

test("signup asks only for user details and required beta attestation", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Registration inputs checked in Chromium.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  const form = page.locator("form").first();
  await expect(form.locator('input[autocomplete="name"]')).toBeVisible();
  await expect(form.locator('input[type="email"]')).toBeVisible();
  await expect(form.locator('input[type="password"]')).toBeVisible();
  await expect(form.locator('input[type="checkbox"]')).toHaveCount(1);
  await expect(form.locator("textarea")).toHaveCount(0);
  await expect(page.getByText("Actividad del negocio", { exact: true })).toHaveCount(0);
  await expect(page.getByText("País de operación", { exact: true })).toHaveCount(0);
});
