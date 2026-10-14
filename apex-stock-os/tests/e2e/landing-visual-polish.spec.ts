import { expect, test } from "@playwright/test";

// Regression tests based on nine user-provided visual bug screenshots.
// All controls must remain functional after viewport-specific CSS changes.
async function openLanding(page: import("@playwright/test").Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  const response = await page.goto("/download", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  const visual = page.getByTestId("download-product-visual");
  await expect(visual).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => visual.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { timeout: 20_000 }).toBe(true);
}

for (const size of [
  { width: 320, height: 650, name: "small Android" },
  { width: 360, height: 740, name: "Android" },
  { width: 390, height: 844, name: "iPhone" },
  { width: 768, height: 900, name: "tablet" }
] as const) {
  test("mobile hero, tabs and metrics have no overlap at " + size.name, async ({ page }) => {
    test.setTimeout(75_000);
    await openLanding(page, size.width, size.height);
    const geometry = await page.evaluate(() => {
      const visual = document.querySelector('[data-testid="download-product-visual"]')!.getBoundingClientRect();
      return {
        visualLeft: visual.left,
        visualRight: visual.right,
        visualWidth: visual.width,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
      };
    });
    expect(geometry.visualLeft).toBeGreaterThanOrEqual(-1);
    expect(geometry.visualRight).toBeLessThanOrEqual(size.width + 1);
    expect(geometry.visualWidth).toBeGreaterThan(260);
    expect(geometry.horizontalOverflow, "viewport should not overflow horizontally").toBeLessThanOrEqual(2);

    const quickTabs = page.locator(".gs-download-platform-tabs").first();
    await expect(quickTabs).toBeVisible();
    const tabsFit = await quickTabs.evaluate((node) => {
      const parent = node.getBoundingClientRect();
      return [...node.querySelectorAll("button")].every((button) => {
        const box = button.getBoundingClientRect();
        return box.left >= parent.left - 3 && box.right <= parent.right + 3;
      });
    });
    expect(tabsFit, "platform buttons must fit container").toBe(true);

    const metrics = page.locator(".gs-download-metric-strip");
    await metrics.evaluate((el) => el.scrollIntoView({ behavior: "instant", block: "center" }));
    const valuesFit = await metrics.evaluate((el) =>
      [...el.querySelectorAll(".gs-download-metric-card")].every((node) => {
        const box = node.getBoundingClientRect();
        return box.left >= -1 && box.right <= innerWidth + 1;
      })
    );
    expect(valuesFit, "metric cards must not be clipped").toBe(true);
  });
}

test("mobile sales invoice has floating cards, full-page document, and working states", async ({ page }) => {
  test.setTimeout(55_000);
  await openLanding(page, 360, 740);
  const sales = page.locator('[data-testid="deferred-sales-flow"]');
  await sales.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const cash = sales.getByRole("button", { name: "Caja", exact: true });
  await expect(cash).toBeVisible({ timeout: 25_000 });
  const columns = await sales.locator(".gs-download-sales-tabs").evaluate((node) =>
    getComputedStyle(node).gridTemplateColumns.split(" ").length
  );
  expect(columns).toBe(2);
  const mobileScene = sales.locator(".gs-sales-mobile-scene");
  await expect(mobileScene).toBeVisible();
  await expect(sales.locator(".gs-sales-receipt-float")).toBeHidden();
  await expect(mobileScene.locator(".gs-sales-mobile-chip")).toHaveCount(2);
  await expect(mobileScene.locator(".gs-sales-mobile-document")).toBeVisible();
  const layout = await mobileScene.evaluate((node) => {
    const stage = node.getBoundingClientRect();
    const paper = node.querySelector(".gs-sales-mobile-document")!.getBoundingClientRect();
    const floating = node.querySelector(".gs-sales-mobile-chip--front")!.getBoundingClientRect();
    return {
      paperOnRight: paper.left > stage.left + stage.width * .2,
      cardsOverlapPaper: floating.right > paper.left && floating.bottom > paper.top,
      paperContained: paper.right <= stage.right + 2
    };
  });
  expect(layout.paperOnRight).toBe(true);
  expect(layout.cardsOverlapPaper).toBe(true);
  expect(layout.paperContained).toBe(true);
  await cash.click();
  await expect(cash).toHaveAttribute("data-active", "true");
  await expect(mobileScene).toHaveAttribute("data-sales-mobile-scene", "caja");
  await sales.getByRole("button", { name: "Stock", exact: true }).click();
  await expect(mobileScene).toHaveAttribute("data-sales-mobile-scene", "stock");
});

test("desktop sales invoice retains the existing receipt and floating cards", async ({ page }) => {
  await openLanding(page, 1280, 800);
  const sales = page.locator('[data-testid="deferred-sales-flow"]');
  await sales.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  await expect(sales.locator(".gs-sales-receipt-float")).toBeVisible({ timeout: 25_000 });
  await expect(sales.locator(".gs-sales-float-top")).toBeVisible();
  await expect(sales.locator(".gs-sales-mobile-scene")).toBeHidden();
});

test("mobile ecosystem keeps eight interactive modules around center logo", async ({ page, browserName }) => {
  test.setTimeout(80_000);
  await openLanding(page, 390, 844);
  const ecosystem = page.locator("#download-network");
  await ecosystem.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const orbit = ecosystem.locator(".gs-ecosystem-mobile-orbit");
  await expect(orbit).toBeVisible({ timeout: 30_000 });
  const buttons = orbit.getByRole("button");
  await expect(buttons).toHaveCount(8);
  const center = await orbit.locator(".gs-ecosystem-mobile-center").boundingBox();
  const stage = await orbit.boundingBox();
  expect(center).not.toBeNull();
  expect(stage).not.toBeNull();
  expect(Math.abs(center!.x + center!.width / 2 - (stage!.x + stage!.width / 2))).toBeLessThan(5);
  const stock = buttons.filter({ hasText: "Inventario" });
  await stock.click({ force: browserName === "webkit" });
  await expect(ecosystem).toHaveAttribute("data-active-module", "inventario");
  const flowingLines = orbit.locator(".gs-ecosystem-line-flow");
  await expect(flowingLines).toHaveCount(8);
  // The active gradient is an actual SVG path with a CSS dash-flow animation.
  await expect(orbit.locator(".gs-ecosystem-line-flow.is-active")).toHaveCount(1);
  const pathAnimation = await orbit.locator(".gs-ecosystem-line-flow.is-active").evaluate(
    (node) => getComputedStyle(node).animationName
  );
  expect(pathAnimation).toContain("gs-ecosystem-stream");
});

test("single-image hero has no drifting scroll hints or four-scene controls", async ({ page }) => {
  await openLanding(page, 1280, 768);
  const hero = page.getByTestId("download-product-hero");
  await expect(hero).toBeVisible();
  await expect(hero.locator("[data-scene-dot-button]")).toHaveCount(0);
  await expect(hero.locator(".gs-cinematic-scroll-note")).toHaveCount(0);
  await expect(hero.getByRole("link", { name: "Abrir Global Stock" })).toBeVisible();
  await expect(hero).not.toHaveAttribute("data-mobile-intro", /.+/);
  const h = await hero.evaluate((node) => node.getBoundingClientRect().height);
  expect(h).toBeLessThan(1000);
});

test("mobile metrics unfold and count when scrolled into view", async ({ page }) => {
  test.setTimeout(40_000);
  await openLanding(page, 390, 844);
  const strip = page.locator(".gs-download-metric-strip");
  await strip.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  await expect(strip).toHaveAttribute("data-metrics-visible", "true", { timeout: 10_000 });
  await expect(strip.locator(".gs-download-metric-value > span")).toHaveText(
    ["40h", "160x", "80%"],
    { timeout: 10_000 }
  );
});

test("premium product illustration loads as one stable responsive image", async ({ page }) => {
  await openLanding(page, 390, 844);
  const img = page.getByTestId("download-product-visual");
  await expect(img).toHaveAttribute("src", "/download/global-stock-control-total.webp");
  await expect(page.locator("#download-hero source[type=\"image/avif\"]")).toHaveAttribute("srcset", "/download/global-stock-control-total.avif");
  await expect(img).toHaveJSProperty("naturalWidth", 1672);
  const hero = page.getByTestId("download-product-hero");
  const first = await hero.boundingBox();
  await page.waitForTimeout(1300);
  const after = await hero.boundingBox();
  expect(Math.abs((after?.height ?? 0) - (first?.height ?? 0))).toBeLessThan(2);
  await expect(hero.locator(".gs-cinematic-phone-shell")).toHaveCount(0);
});

test("mobile metric values and labels are vertically separated", async ({ page }) => {
  await openLanding(page, 320, 650);
  const strip = page.locator(".gs-download-metric-strip");
  await strip.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const metrics = await strip.locator(".gs-download-metric-card").evaluateAll((cards) =>
    cards.map((card) => {
      const count = card.querySelector(".gs-download-metric-value")!.getBoundingClientRect();
      const label = card.querySelector(".gs-download-metric-label")!.getBoundingClientRect();
      const bounds = card.getBoundingClientRect();
      return { gap: label.top - count.bottom, inside: label.bottom <= bounds.bottom + 1 };
    })
  );
  expect(metrics).toHaveLength(3);
  expect(metrics.every(({ gap, inside }) => gap >= 4 && inside)).toBe(true);
});


test("single-frame campaign stays the same while theme changes", async ({ page }) => {
  await openLanding(page, 1366, 768);
  const visual = page.getByTestId("download-product-visual");
  await expect(visual).toBeVisible();
  const src = await visual.getAttribute("src");
  await page.getByRole("button", { name: "Usar tema oscuro" }).first().click();
  await expect(visual).toHaveAttribute("src", src!);
  await expect(visual).toBeVisible();
  await expect(page.getByTestId("download-product-hero").locator("[data-scene-dot-button]")).toHaveCount(0);
});
