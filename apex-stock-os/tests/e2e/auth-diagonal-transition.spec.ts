import { test, expect } from "@playwright/test";

// Recreate the reference's behavior without creating accounts or touching live data.
for (const screen of [
  { label: "desktop", width: 1440, height: 900 },
  { label: "notebook", width: 1024, height: 768 },
  { label: "iPhone", width: 390, height: 844 },
  { label: "small Android", width: 360, height: 740 }
]) {
  test("reversible diagonal sign-in/create-account animation on " + screen.label,
    async ({ page, browserName }) => {
      test.skip(browserName !== "chromium", "Full responsive login animation is exercised in Chromium.");
      test.setTimeout(75000);
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await page.goto("/classic", { waitUntil: "domcontentloaded" });

      const shell = page.getByTestId("auth-split-stage");
      const diagonal = page.getByTestId("auth-diagonal-panel");
      const form = page.getByTestId("auth-form-panel");
      await expect(shell).toBeVisible({ timeout: 30000 });
      await expect(diagonal).toBeVisible();
      await expect(form).toBeVisible();
      await expect(page.getByText("Qué bueno verte de nuevo.", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Crear cuenta", exact: true }).first().click();
      await expect(page.getByText("Creá tu cuenta.", { exact: true })).toBeVisible();
      await expect(page.getByRole("checkbox", {
        name: "Declaro ser mayor de 18 años y aceptar los términos y la privacidad"
      })).toBeVisible();

      // A reverse click must restore the original form, without a reload.
      await page.getByRole("button", { name: "Iniciar sesión", exact: true }).first().click();
      await expect(page.getByText("Qué bueno verte de nuevo.", { exact: true })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(2);
    });
}

test("auth transition respects the reduce-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/classic", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("auth-split-stage")).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).first().click();
  await expect(page.getByText("Creá tu cuenta.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).first().click();
  await expect(page.getByText("Qué bueno verte de nuevo.", { exact: true })).toBeVisible();
});
