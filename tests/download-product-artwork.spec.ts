import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "notebook 1366", width: 1366, height: 768 },
  { name: "short notebook", width: 1280, height: 576 },
  { name: "desktop", width: 1920, height: 1080 },
  { name: "portrait mobile", width: 390, height: 844 }
]) {
  test("download hero fills white gutters beneath header without cropping on " + viewport.name, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto("/download", { waitUntil: "domcontentloaded" });
    expect(response?.ok()).toBe(true);

    const frame = page.locator(".gs-product-hero__frame");
    const photo = page.getByTestId("download-product-visual");
    const ambient = page.locator(".gs-product-hero__ambient");
    await expect(frame).toBeVisible({ timeout: 25_000 });
    await expect(photo).toBeVisible();
    await expect(ambient).toBeAttached();
    const values = await photo.evaluate(image => {
      const img = image as HTMLImageElement;
      const bounds = img.getBoundingClientRect();
      const frame = img.closest(".gs-product-hero__frame")!.getBoundingClientRect();
      const header = document.querySelector(".gs-public-header")!.getBoundingClientRect();
      const ambient = document.querySelector(".gs-product-hero__ambient")!;
      const fit = getComputedStyle(img).objectFit;
      const picture = img.closest("picture")!.getBoundingClientRect();
      const sourceRatio = img.naturalWidth / img.naturalHeight;
      const drawnWidth = Math.min(bounds.width, bounds.height * sourceRatio);
      const drawnHeight = Math.min(bounds.height, bounds.width / sourceRatio);
      return {
        frameTop: frame.top,
        frameBottom: frame.bottom,
        frameWidth: frame.width,
        frameHeight: frame.height,
        headerBottom: header.bottom,
        photoWidth: bounds.width,
        photoHeight: bounds.height,
        pictureWidth: picture.width,
        drawnWidth,
        drawnHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fit,
        ambientBackground: getComputedStyle(ambient).backgroundImage,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });

    expect(values.frameTop).toBeGreaterThanOrEqual(values.headerBottom - 2);
    expect(values.frameTop).toBeLessThanOrEqual(values.headerBottom + 3);
    expect(Math.abs(values.frameWidth - viewport.width)).toBeLessThanOrEqual(2);
    expect(values.frameBottom).toBeLessThanOrEqual(viewport.height + 3);
    expect(values.frameBottom).toBeGreaterThanOrEqual(viewport.height - 3);
    expect(values.ambientBackground).toContain("global-stock-control-total-4k.webp");
    expect(values.fit).toBe("contain");
    expect(values.horizontalOverflow).toBeLessThanOrEqual(2);

    if (viewport.width >= 768) {
      // Uncropped product photography is centered and nearly full-screen.
      expect(values.naturalWidth).toBe(3840);
      expect(values.naturalHeight).toBe(2160);
      expect(values.drawnHeight).toBeGreaterThanOrEqual(values.frameHeight - 3);
      expect(values.drawnWidth).toBeGreaterThanOrEqual(viewport.width * .64);
    } else {
      expect(values.naturalWidth).toBe(1672);
      expect(values.naturalHeight).toBe(941);
      expect(values.drawnWidth).toBeLessThanOrEqual(viewport.width);
    }
    await expect(page.getByRole("link", { name: "Abrir Global Stock" }).last()).toBeVisible();
  });
}
