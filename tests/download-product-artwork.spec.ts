import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "notebook 1366", width: 1366, height: 768, maximum: 970 },
  { name: "short notebook", width: 1280, height: 576, maximum: 690 },
  { name: "desktop", width: 1920, height: 1080, maximum: 1120 },
  { name: "mobile", width: 390, height: 844, maximum: 390 }
]) {
  test("product artwork keeps all devices visible without enlarging on " + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto("/download", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    const frame = page.locator(".gs-product-hero__frame");
    const artwork = page.getByTestId("download-product-visual");
    await expect(frame).toBeVisible({ timeout: 25000 });
    await expect(artwork).toBeVisible();
    const values = await artwork.evaluate(image => {
      const img = image as HTMLImageElement;
      const frame = img.closest(".gs-product-hero__frame")!.getBoundingClientRect();
      const photo = img.getBoundingClientRect();
      return {
        frameWidth: frame.width,
        frameHeight: frame.height,
        photoWidth: photo.width,
        photoHeight: photo.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fit: getComputedStyle(img).objectFit,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    expect(values.naturalWidth).toBe(1672);
    expect(values.naturalHeight).toBe(941);
    expect(values.frameWidth).toBeLessThanOrEqual(viewport.maximum + 2);
    expect(values.photoWidth).toBeLessThanOrEqual(values.naturalWidth);
    expect(values.fit).toBe("contain");
    expect(Math.abs(values.frameWidth / values.frameHeight - 1672 / 941)).toBeLessThan(.02);
    expect(values.horizontalOverflow).toBeLessThanOrEqual(2);

    await expect(page.getByRole("link", { name: "Abrir Global Stock" }).last()).toBeVisible();
    await expect(page.getByTestId("download-product-hero")).toBeVisible();
  });
}
