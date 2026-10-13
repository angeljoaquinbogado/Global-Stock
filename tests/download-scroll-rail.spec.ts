import { expect, test } from "@playwright/test";

test("download rail has one red indicator with exactly three fixed stops", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Fixed rail geometry checked in Chromium.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/download", { waitUntil: "domcontentloaded" });

  const rail = page.getByTestId("download-scroll-rail");
  const marker = page.getByTestId("download-scroll-indicator");
  await expect(rail).toBeVisible({ timeout: 30_000 });
  await expect(rail.locator("button")).toHaveCount(3);
  await expect(rail.locator("span")).toHaveCount(1); // no extra dot indicators
  await expect(marker).toHaveAttribute("data-stage", "0");
  await expect(marker).toHaveCSS("height", "22px");

  const top = await marker.evaluate(element => parseFloat((element as HTMLElement).style.top));
  expect(top).toBe(7);

  await page.getByTestId("download-scroll-stage-1").click();
  await expect(marker).toHaveAttribute("data-stage", "1", { timeout: 15_000 });
  const mid = await marker.evaluate(element => parseFloat((element as HTMLElement).style.top));
  expect(mid - top).toBe(36);

  await page.getByTestId("download-scroll-stage-2").click();
  await expect(marker).toHaveAttribute("data-stage", "2", { timeout: 15_000 });
  const bottom = await marker.evaluate(element => parseFloat((element as HTMLElement).style.top));
  expect(bottom - mid).toBe(36);
  await expect(page.getByRole("button", { name: "Bajar", exact: true })).toBeDisabled();

  await page.getByTestId("download-scroll-stage-0").click();
  await expect(marker).toHaveAttribute("data-stage", "0", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Subir", exact: true })).toBeDisabled();

  const geometry = await rail.evaluate(element => {
    const box = element.getBoundingClientRect();
    const actualY = box.top + box.height / 2;
    return { middle: actualY, viewportMiddle: window.innerHeight / 2 };
  });
  expect(Math.abs(geometry.middle - geometry.viewportMiddle)).toBeLessThan(3);
});

test("download three-stop rail retains stable positions in light theme", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Theme color checked in Chromium.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/download", { waitUntil: "domcontentloaded" });
  const rail = page.getByTestId("download-scroll-rail");
  await expect(rail).toBeVisible({ timeout: 30_000 });

  const positions = await rail.locator("button").all();
  expect(positions).toHaveLength(3);
  const backgrounds = await Promise.all(
    positions.map(item => item.evaluate(element => getComputedStyle(element).backgroundColor))
  );
  // The inactive slots are transparent hit areas, not grey dot elements.
  expect(backgrounds.every(color => color === "rgba(0, 0, 0, 0)")).toBe(true);

  await expect(rail.getByRole("button", { name: "Ir arriba" })).toBeVisible();
  await expect(rail.getByRole("button", { name: "Ir medio" })).toBeVisible();
  await expect(rail.getByRole("button", { name: "Ir abajo" })).toBeVisible();
});
