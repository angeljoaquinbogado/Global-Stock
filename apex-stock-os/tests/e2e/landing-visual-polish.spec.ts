import { expect, test } from "@playwright/test";

// Regression tests based on nine user-provided visual bug screenshots.
// All controls must remain functional after viewport-specific CSS changes.
async function openLanding(page: import("@playwright/test").Page, width: number, height: number) {
  await page.setViewportSize({ width, height });
  const response = await page.goto("/download", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBe(true);
  await expect(page.locator(".gs-cinematic-phone-shell")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".gs-cinematic-copy-surface")).toBeVisible();
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
      const phone = document.querySelector(".gs-cinematic-phone-shell")!.getBoundingClientRect();
      const copy = document.querySelector(".gs-cinematic-copy-surface")!.getBoundingClientRect();
      return {
        overlapWidth: Math.max(0, Math.min(phone.right, copy.right) - Math.max(phone.left, copy.left)),
        overlapHeight: Math.max(0, Math.min(phone.bottom, copy.bottom) - Math.max(phone.top, copy.top)),
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth
      };
    });
    // Phones stack vertically. Tablets use side-by-side layout like desktop.
    // In either case the actual rectangles must never intersect.
    expect(geometry.overlapWidth * geometry.overlapHeight, "text must not cover animated phone").toBe(0);
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

test("mobile sales tabs use two columns and receipt has no decorative overlays", async ({ page }) => {
  await openLanding(page, 360, 740);
  const sales = page.locator('[data-testid="deferred-sales-flow"]');
  await sales.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  await expect(sales.getByRole("button", { name: "Caja", exact: true })).toBeVisible({ timeout: 25_000 });
  const columns = await sales.locator(".gs-download-sales-tabs").evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(2);
  const cardHidden = await sales.locator(".gs-sales-float-top").evaluate((node) => getComputedStyle(node).display === "none");
  expect(cardHidden).toBe(true);
  await sales.getByRole("button", { name: "Caja", exact: true }).click();
  await expect(sales.getByRole("button", { name: "Caja", exact: true })).toHaveAttribute("data-active", "true");
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

test("desktop scroll hint does not cover the CTA", async ({ page }) => {
  await openLanding(page, 1280, 768);
  const hint = await page.locator(".gs-cinematic-scroll-note").boundingBox();
  const cta = await page.locator(".gs-cinematic-copy .gs-download-primary-action").first().boundingBox();
  expect(hint).not.toBeNull();
  expect(cta).not.toBeNull();
  const intersectionWidth = Math.max(0, Math.min(hint!.x + hint!.width, cta!.x + cta!.width) - Math.max(hint!.x, cta!.x));
  const intersectionHeight = Math.max(0, Math.min(hint!.y + hint!.height, cta!.y + cta!.height) - Math.max(hint!.y, cta!.y));
  expect(intersectionWidth * intersectionHeight).toBe(0);
});


test("mobile intro advances by itself without scrolling through four screens", async ({ page }) => {
  test.setTimeout(45_000);
  await openLanding(page, 390, 844);
  const hero = page.locator("#download-hero");
  await expect(hero).toHaveAttribute("data-mobile-intro", "autoplay");
  const height = await hero.evaluate((node) => node.getBoundingClientRect().height);
  expect(height).toBeLessThan(844);
  const initialScene = await hero.getAttribute("data-active-scene");
  // Playback is visibility-aware and should change screens with no scroll input.
  await expect.poll(() => hero.getAttribute("data-active-scene"), { timeout: 9_000 }).not.toBe(initialScene);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  const dots = hero.locator("[data-scene-dot-button]");
  await dots.last().click();
  await expect(hero).toHaveAttribute("data-active-scene", "3");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
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

test("desktop cinematic remains driven by scroll, not autoplay", async ({ page }) => {
  await openLanding(page, 1280, 768);
  const hero = page.locator("#download-hero");
  await expect(hero).toHaveAttribute("data-mobile-intro", "scroll");
  const height = await hero.evaluate((node) => node.getBoundingClientRect().height);
  expect(height).toBeGreaterThan(768 * 2);
});


test("mobile cinematic uses four angled poses and renders the phone at native width", async ({ page }) => {
  test.setTimeout(35_000);
  await openLanding(page, 390, 844);
  const hero = page.locator("#download-hero");
  await expect(hero).toHaveAttribute("data-mobile-intro", "autoplay");
  const device = hero.locator(".gs-phone-preview-stage-cinematic .gs-phone-preview-device");
  const phone = hero.locator(".gs-cinematic-phone-shell");
  const motion = hero.locator(".gs-cinematic-phone-motion");
  await expect(device).toBeVisible();
  await expect.poll(async () => {
    return device.evaluate((node) => getComputedStyle(node).transform);
  }).toBe("none");
  const width = await phone.evaluate((node) => node.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(180);
  const reducedMotion = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (!reducedMotion) {
    await expect.poll(async () => motion.evaluate((node) => getComputedStyle(node).transform), { timeout: 5000 })
      .not.toBe("none");
  }
  const initialScene = await hero.getAttribute("data-active-scene");
  if (!reducedMotion) {
    await expect.poll(() => hero.getAttribute("data-active-scene"), { timeout: 9000 }).not.toBe(initialScene);
  }
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


test("mobile hero uses polished silver chassis while desktop keeps graphite", async ({ page }) => {
  await openLanding(page, 390, 844);
  const hero = page.locator("#download-hero");
  await expect(hero).toHaveAttribute("data-mobile-intro", "autoplay");
  const frame = hero.locator(".gs-phone-preview-stage-cinematic .gs-phone-preview-device > div");
  await expect(frame).toBeVisible();
  const mobileFrame = await frame.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--iphone-frame").trim()
  );
  expect(mobileFrame.toLowerCase()).toBe("#d8d8d3");
  const chassis = hero.locator(".gs-cinematic-phone-motion");
  const detail = await chassis.evaluate((element) => {
    const style = getComputedStyle(element, "::before");
    return { content: style.content, background: style.backgroundImage, transform: style.transform };
  });
  expect(detail.content).not.toBe("none");
  expect(detail.background).toContain("linear-gradient");
  expect(detail.transform).not.toBe("none");

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(hero).toHaveAttribute("data-mobile-intro", "scroll");
  const desktopFrame = await frame.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--iphone-frame").trim()
  );
  expect(desktopFrame.toLowerCase()).toBe("#343637");
});


test("cinematic mobile screen is readable while desktop keeps its original live preview", async ({ page }) => {
  test.setTimeout(50_000);
  await openLanding(page, 390, 844);
  const hero = page.locator("#download-hero");
  const crisp = hero.locator(".gs-cine-mobile-ui");
  const original = hero.locator(".gs-cine-original-ui");
  await expect(crisp).toBeVisible();
  await expect(original).toBeHidden();
  await expect(crisp.getByText("Centro de control")).toBeVisible();
  await expect(crisp.locator(".gs-cine-hires-kpi-value")).toHaveCount(4);
  const sizes = await crisp.evaluate((node) => {
    const root = node.querySelector(".gs-cine-hires")!;
    const title = node.querySelector(".gs-cine-hires-title")!;
    const value = node.querySelector(".gs-cine-hires-kpi-value")!;
    return {
      title: parseFloat(getComputedStyle(title).fontSize),
      value: parseFloat(getComputedStyle(value).fontSize),
      fits: root.scrollWidth <= root.clientWidth + 1
    };
  });
  expect(sizes.title).toBeGreaterThanOrEqual(13);
  expect(sizes.value).toBeGreaterThanOrEqual(11);
  expect(sizes.fits).toBe(true);
  await hero.locator("[data-scene-dot-button]").nth(2).click();
  await expect(crisp.getByText("Inventario", { exact: true }).first()).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(crisp).toBeHidden();
  await expect(original).toBeVisible();
});


test("all three secondary mobile intro screens have readable typography", async ({ page }) => {
  test.setTimeout(55_000);
  // Prevent autoplay from changing the selected screen while assessing legibility.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openLanding(page, 390, 844);
  const hero = page.locator("#download-hero");
  const screen = hero.locator(".gs-cine-mobile-ui .gs-cine-hires");
  const states = [
    { index: 1, name: "pos", title: "Punto de venta", specific: ".gs-cine-hires-sale-summary strong" },
    { index: 2, name: "inventory", title: "Inventario", specific: ".gs-cine-hires-product strong" },
    { index: 3, name: "ai", title: "Global Intelligence", specific: ".gs-cine-hires-chat-answer strong" }
  ];
  for (const state of states) {
    await hero.locator("[data-scene-dot-button]").nth(state.index).click();
    await expect(hero).toHaveAttribute("data-active-scene", String(state.index));
    await expect(screen).toHaveAttribute("data-cine-screen", state.name);
    await expect(screen.locator(".gs-cine-hires-title")).toHaveText(state.title);
    const reading = await screen.evaluate((node, selector) => {
      const title = node.querySelector(".gs-cine-hires-title") as HTMLElement;
      const subtitle = node.querySelector(".gs-cine-hires-subtitle") as HTMLElement;
      const example = node.querySelector(selector as string) as HTMLElement;
      const main = node.querySelector(".gs-cine-hires-main") as HTMLElement;
      const contents = main.getBoundingClientRect();
      const detail = example.getBoundingClientRect();
      return {
        title: parseFloat(getComputedStyle(title).fontSize),
        subtitle: parseFloat(getComputedStyle(subtitle).fontSize),
        detail: parseFloat(getComputedStyle(example).fontSize),
        inside: detail.bottom <= contents.bottom + 2
      };
    }, state.specific);
    expect(reading.title).toBeGreaterThanOrEqual(14);
    expect(reading.subtitle).toBeGreaterThanOrEqual(10);
    expect(reading.detail).toBeGreaterThanOrEqual(10);
    expect(reading.inside).toBe(true);
  }
});
