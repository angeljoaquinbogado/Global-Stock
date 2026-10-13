import { expect, test } from "@playwright/test";

/** Global Stock PC has its own Next.js design and navigation.
 * Expo Go runs the separate native React Native application, not a web export.
 * The two apps may share business APIs, but should not replace one another.
 */
for (const viewport of [
  { name: "notebook", width: 1366, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile browser", width: 390, height: 844 }
]) {
  test("original Next.js entry loads independently on " + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("auth-split-stage")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true }).first()).toBeVisible();
    // Expo Web assets must not be shipped as part of this standalone Next app.
    expect(await page.locator("#expo-root").count()).toBe(0);
  });
}

test("desktop dashboard remains available at /classic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/classic", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  await expect(page.getByTestId("auth-split-stage")).toBeVisible({ timeout: 30000 });
});

for (const path of ["/native-app", "/native-app/", "/native-app/index.html"]) {
  test("obsolete Expo Web path " + path + " redirects to desktop app", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("auth-split-stage")).toBeVisible({ timeout: 30000 });
    expect(await page.locator("#root").count()).toBe(0);
  });
}
