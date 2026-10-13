import { expect, test } from "@playwright/test";

// Runs against the checked-out Next.js build in GitHub CI, without creating
// accounts or sending credentials to Supabase.
test("desktop auth fills the viewport and reverses the diagonal transition", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Animation geometry is checked in Chromium.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const stage = page.getByTestId("auth-split-stage");
  const info = page.getByTestId("auth-diagonal-panel");
  const form = page.getByTestId("auth-form-panel");
  await expect(stage).toBeVisible({ timeout: 30_000 });
  await expect(info).toBeVisible();
  await expect(form).toBeVisible();
  const bounds = await stage.boundingBox();
  expect(bounds?.width).toBeGreaterThan(1390);
  await expect(info.locator("button")).toHaveCount(0);

  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Crear cuenta", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", {
    name: "Declaro ser mayor de 18 años y aceptar los términos y la privacidad",
  })).toBeVisible();

  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test("mobile auth keeps all controls available without horizontal overflow", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Mobile layout is checked in Chromium.");
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("auth-split-stage")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("auth-diagonal-panel")).toBeHidden();
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Crear cuenta", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);
});
