import { expect, test } from "@playwright/test";

test("Cloudflare site key alone does not trigger CAPTCHA when enforcement is off", async ({ page }) => {
  const response = await page.request.get("/api/auth/turnstile-config");
  expect(response.ok()).toBe(true);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const status = await response.json() as { enabled?: boolean };
  // CI runs without NEXT_PUBLIC_AUTH_CAPTCHA_ENABLED=true: a configured site
  // key is NOT equivalent to Supabase requiring a CAPTCHA token.
  expect(status.enabled).toBe(false);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  await expect(page.getByTestId("auth-turnstile")).toHaveCount(0);
  await expect(page.locator("form button[type='submit']")).toBeEnabled();
});
