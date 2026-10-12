import { expect, test } from "@playwright/test";

// The Expo shell loads the same URL and React workspace as the PC.
// This tests the browser side without creating customer accounts or spending AI tokens.
test("the shared application announces readiness to the Expo native shell", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Bridge contract is engine-independent; Chromium smoke is sufficient.");
  await page.addInitScript(() => {
    (window as typeof window & { __messages?: string[] }).__messages = [];
    (window as typeof window & {
      ReactNativeWebView?: { postMessage: (message: string) => void };
    }).ReactNativeWebView = {
      postMessage: message => {
        (window as typeof window & { __messages?: string[] }).__messages?.push(message);
      }
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/?source=expo", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  await expect.poll(async () => page.evaluate(() => {
    const msgs = (window as typeof window & { __messages?: string[] }).__messages ?? [];
    return msgs.some(message => {
      try { return (JSON.parse(message) as { type?: string }).type === "app_ready"; }
      catch { return false; }
    });
  }), { timeout: 30000 }).toBe(true);
});

for (const viewport of [
  { name: "PC", width: 1366, height: 768 },
  { name: "Expo-iPhone", width: 390, height: 844 }
] as const) {
  test("same demo workspace, menu and AI close on " + viewport.name, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Shared entry is tested in Chromium; other engines cover landing.");
    test.setTimeout(85000);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const signIn = page.getByRole("button", { name: "Iniciar sesión", exact: true }).first();
    await expect(signIn).toBeVisible({ timeout: 30000 });
    await signIn.click();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.locator('input[type="email"]').fill("demo@globalstock.app");
    await page.locator('input[type="password"]').fill("GlobalStock2026!");
    await page.getByRole("button", { name: "Entrar a Global Stock" }).click();
    await expect(page.locator(".gs-app-shell")).toBeVisible({ timeout: 25000 });
    await expect(page.locator(".gs-mobile-dock")).toHaveCount(1);
    const assistant = page.locator("button.fixed.right-4").last();
    await assistant.click();
    await expect(page.getByRole("button", { name: "Minimizar inteligencia" })).toBeVisible();
    await page.getByRole("button", { name: "Minimizar inteligencia" }).click();
    await expect(page.getByRole("button", { name: "Minimizar inteligencia" })).toHaveCount(0);
  });
}
