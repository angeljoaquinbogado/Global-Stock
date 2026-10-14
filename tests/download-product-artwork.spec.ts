import { expect, test } from "@playwright/test";

for (const viewport of [
  { name: "notebook 1366", width: 1366, height: 768, minimum: 1150 },
  { name: "short notebook", width: 1280, height: 576, minimum: 810 },
  { name: "desktop", width: 1920, height: 1080, minimum: 1640 },
  { name: "mobile", width: 390, height: 844, minimum: 310 }
]) {
  test("product artwork fills the available viewport without cropping on " + viewport.name, async ({ page }) => {
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
        frameTop: frame.top,
        frameBottom: frame.bottom,
        photoWidth: photo.width,
        photoHeight: photo.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        fit: getComputedStyle(img).objectFit,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    if (viewport.width >= 768) {
      // The 4K variant is generated before Next dev/build; it is a controlled
      // upscale of the approved image, not a claim of native 4K photography.
      expect(values.naturalWidth).toBe(3840);
      expect(values.naturalHeight).toBe(2160);
    } else {
      expect(values.naturalWidth).toBe(1672);
      expect(values.naturalHeight).toBe(941);
    }
    expect(values.frameWidth).toBeGreaterThanOrEqual(viewport.minimum);
    expect(values.frameWidth).toBeLessThanOrEqual(viewport.width);
    expect(values.photoWidth).toBeLessThanOrEqual(values.naturalWidth);
    if (viewport.width >= 768) {
      // Show the ENTIRE photograph, including its top headline and both devices,
      // below the sticky header without clipping its bottom in the first view.
      expect(values.frameTop).toBeGreaterThanOrEqual(54);
      expect(values.frameBottom).toBeLessThanOrEqual(viewport.height + 2);
    }
    expect(values.fit).toBe("contain");
    expect(Math.abs(values.frameWidth / values.frameHeight - 1672 / 941)).toBeLessThan(.02);
    expect(values.horizontalOverflow).toBeLessThanOrEqual(2);

    await expect(page.getByRole("link", { name: "Abrir Global Stock" }).last()).toBeVisible();
    await expect(page.getByTestId("download-product-hero")).toBeVisible();
  });
}
