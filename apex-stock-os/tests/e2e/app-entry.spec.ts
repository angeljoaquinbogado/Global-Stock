import { test, expect } from "@playwright/test";

// The public entry can be exercised without logging in, touching Supabase
// customer data or using any demo account credentials.
for (const screen of [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 390, height: 844 }
] as const) {
  test("public app login/register entry responds on " + screen.name,
    async ({ page, browserName }) => {
      test.skip(browserName !== "chromium",
        "Core auth entry smoke runs in Chromium; other browser engines cover the public landing.");
      test.setTimeout(65_000);
      await page.setViewportSize(screen);
      const response = await page.goto("/", { waitUntil: "domcontentloaded" });
      expect(response?.ok()).toBe(true);

      const stage = page.getByTestId("auth-split-stage");
      const form = page.getByTestId("auth-form-panel");
      const side = page.getByTestId("auth-diagonal-panel");
      await expect(stage).toBeVisible({ timeout: 25000 });
      await expect(page.locator("html")).not.toHaveClass(/\\bdark\\b/);
      await expect(page.locator(".gs-auth-scene")).toHaveCount(0);
      // One accessible selector in the form. No duplicated action on the
      // presentation panel that can obscure login inputs.
      await expect(stage.getByRole("button", { name: "Crear cuenta", exact: true })).toHaveCount(1);
      await expect(stage.getByRole("button", { name: "Iniciar sesión", exact: true })).toHaveCount(1);
      await expect(side.locator("button")).toHaveCount(0);

      async function checkNoClippedForm() {
        const bounds = await page.evaluate(() => {
          const stage = document.querySelector('[data-testid="auth-split-stage"]')!.getBoundingClientRect();
          const aside = document.querySelector('[data-testid="auth-diagonal-panel"]')!.getBoundingClientRect();
          const form = document.querySelector('[data-testid="auth-form-panel"]')!.getBoundingClientRect();
          const overlapWidth = Math.max(0, Math.min(aside.right,form.right)-Math.max(aside.left,form.left));
          const overlapHeight = Math.max(0, Math.min(aside.bottom,form.bottom)-Math.max(aside.top,form.top));
          return {
            overlap: overlapWidth*overlapHeight,
            formContained: form.left >= stage.left-2 && form.right <= stage.right+2,
            viewportOverflow: document.documentElement.scrollWidth-innerWidth
          };
        });
        expect(bounds.overlap, "decorative panel must never cover the form").toBe(0);
        expect(bounds.formContained, "form must fit within the auth stage").toBe(true);
        expect(bounds.viewportOverflow, "no horizontal page overflow").toBeLessThanOrEqual(2);
      }

      await checkNoClippedForm();
      const create = page.getByRole("button", { name: "Crear cuenta", exact: true }).first();
      await expect(create).toBeVisible({ timeout: 25000 });
      await create.click();
      await expect(page.getByText("Creá tu cuenta.", { exact: true })).toBeVisible();
      await page.waitForTimeout(550);
      await checkNoClippedForm();
      // Real business sector cards, not the old generic "retail" options.
      const chooseSector = page.getByRole("button", { name: /Tipo de negocio: Almacén \/ Kiosco/ });
      await chooseSector.click();
      const sectors = page.getByRole("dialog", { name: "Tipo de negocio" });
      await expect(sectors.locator("button")).toHaveCount(21);
      await sectors.getByRole("button", { name: /Ferretería/ }).click();
      await expect(page.getByRole("button", { name: /Tipo de negocio: Ferretería/ })).toBeVisible();

      const adultBox = page.getByRole("checkbox", { name: "Declaro ser mayor de 18 años y aceptar los términos y la privacidad" });
      await expect(adultBox).toBeVisible();
      await expect(adultBox).not.toBeChecked();
      await expect(page.getByRole("button", { name: "Crear cuenta gratis" })).toBeDisabled();
      await adultBox.check();
      await expect(page.getByRole("button", { name: "Crear cuenta gratis" })).toBeEnabled();
      await expect(page.getByRole("link", { name: "Política de privacidad" })).toHaveAttribute("href", "/legal/privacy");
      await expect(page.getByRole("link", { name: "cookies y el almacenamiento" })).toHaveAttribute("href", "/legal/cookies");

      const signIn = page.getByRole("button", { name: "Iniciar sesión", exact: true }).first();
      await signIn.click();
      await expect(page.getByText("Qué bueno verte de nuevo.", { exact: true })).toBeVisible();
      await page.waitForTimeout(550);
      await checkNoClippedForm();

      // It must be possible to switch without submitting user information.
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  );
}
