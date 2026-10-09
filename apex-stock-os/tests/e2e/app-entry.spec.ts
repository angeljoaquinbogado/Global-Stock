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

      const create = page.getByRole("button", { name: "Crear cuenta", exact: true }).first();
      await expect(create).toBeVisible({ timeout: 25000 });
      await create.click();
      await expect(page.getByText("Creá tu cuenta.", { exact: true })).toBeVisible();

      const signIn = page.getByRole("button", { name: "Iniciar sesión", exact: true }).first();
      await signIn.click();
      await expect(page.getByText("Volvé al control.", { exact: true })).toBeVisible();

      // It must be possible to switch without submitting user information.
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  );
}
