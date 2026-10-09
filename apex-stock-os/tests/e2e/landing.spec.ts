import { test, expect } from "@playwright/test";

const sizes = [
  { name: "full-hd", width: 1920, height: 1080 },
  { name: "notebook", width: 1366, height: 768 },
  { name: "short-desktop", width: 1280, height: 576 },
  { name: "iphone-viewport", width: 390, height: 844 },
  { name: "small-android-viewport", width: 360, height: 740 }
] as const;

const modules = [
  ["Facturación", "facturacion"],
  ["Contabilidad", "contabilidad"],
  ["CRM", "crm"],
  ["Proyectos", "proyectos"],
  ["Equipo", "equipo"],
  ["Inventario", "inventario"],
  ["Ventas", "ventas"],
  ["IA", "ia"]
] as const;

async function visit(page: import("@playwright/test").Page) {
  const response = await page.goto("/download", { waitUntil: "domcontentloaded" });
  expect(response?.ok(), "landing should return HTTP 2xx").toBe(true);
  await expect(page).toHaveTitle(/Global Stock/i);
  await expect(page.locator("main")).toBeVisible();
}

for (const size of sizes) {
  test("ecosystem works at " + size.name, async ({ page, browserName }, testInfo) => {
    test.setTimeout(100_000);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.setViewportSize(size);
    await visit(page);

    const ecosystem = page.locator("#download-network");
    // Scrolling a container with moving decorations can be permanently "unstable" in WebKit.
    await ecosystem.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(ecosystem).toBeVisible();

    const selector = size.width >= 1024
      ? "button.gs-ecosystem-node--orbit"
      : "button.gs-ecosystem-node--compact";
    const buttons = ecosystem.locator(selector);
    await expect(buttons).toHaveCount(8);

    for (const [name, id] of modules) {
      const button = buttons.filter({ hasText: name });
      if (browserName === "webkit") {
        // Safari engine's synthetic click scroll can wait indefinitely on
        // continuously animated orbit nodes. Bring the real button into
        // view without waiting for visual stabilization.
        await button.evaluate((el) => el.scrollIntoView({
          block: "center",
          behavior: "instant"
        }));
      }
      await button.click({ force: browserName === "webkit" });
      await expect(ecosystem).toHaveAttribute("data-active-module", id);
      await expect(button).toHaveAttribute("aria-pressed", "true");

      const link = ecosystem.locator("#gs-ecosystem-detail a");
      const href = await link.getAttribute("href");
      expect(href, "module link should be a real anchor").toMatch(/^#[a-z-]+$/);
      await expect(page.locator(href!)).toHaveCount(1);
    }

    const horizontalOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(horizontalOverflow, "unwanted horizontal overflow").toBeLessThanOrEqual(2);

    // Captures are attached to CI artifacts so a future layout regression
    // can be reviewed without needing to reproduce it on a personal computer.
    const shot = await page.screenshot({ animations: "disabled", timeout: 20_000 });
    await testInfo.attach("ecosystem-" + size.name, {
      body: shot,
      contentType: "image/png"
    });

    expect(pageErrors, "browser JS errors").toEqual([]);
  });
}

test("theme switches and persists after reload", async ({ page }) => {
  await visit(page);
  const wrapper = page.locator(".gs-download-theme");
  await page.getByRole("button", { name: "Usar tema oscuro" }).first().click();
  await expect(wrapper).toHaveAttribute("data-download-theme", "dark");
  // Firefox can defer DOMContentLoaded indefinitely while the heavy scene loads.
  // A new navigation still exercises persistence but waits only for response commit.
  const again = await page.goto("/download", { waitUntil: "commit", timeout: 35_000 });
  expect(again?.ok()).toBe(true);
  await expect(wrapper).toHaveAttribute("data-download-theme", "dark");
  await page.getByRole("button", { name: "Usar tema claro" }).first().click();
  await expect(wrapper).toHaveAttribute("data-download-theme", "light");
});

test("FAQ category and accordion open and close", async ({ page }) => {
  await visit(page);
  const faq = page.locator("#download-faq");
  await faq.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  await faq.getByRole("button", { name: "Conexiones", exact: true }).click({ timeout: 30_000 });
  const question = faq.getByRole("button", { name: "¿Puedo conectar una tienda online?" });
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
});

test("sector buttons switch the corresponding panel", async ({ page }) => {
  await visit(page);
  const area = page.locator("#download-sectors");
  await area.evaluate((node) => node.scrollIntoView({ block: "center", behavior: "instant" }));
  const selection = area.getByRole("button", { name: "Gastronomía" });
  await selection.click();
  await expect(selection).toHaveAttribute("aria-pressed", "true");
  await expect(area.locator("h3")).toBeVisible();
});

test("install tabs show iOS and Android instructions", async ({ page }) => {
  await visit(page);
  const install = page.locator("#download-install");
  const ios = install.getByRole("tab", { name: "iOS" });
  await ios.click();
  await expect(ios).toHaveAttribute("aria-selected", "true");
  await expect(install.getByRole("heading", { name: /Agregá Global Stock a tu iPhone/ })).toBeVisible();

  const android = install.getByRole("tab", { name: "Android" });
  await android.click();
  await expect(android).toHaveAttribute("aria-selected", "true");
  await expect(install.getByRole("heading", { name: /Instalá Global Stock en Android/ })).toBeVisible();
});

test("mobile navigation opens, follows link, and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page);
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("button", { name: "Cerrar menú" }))
    .toHaveAttribute("aria-expanded", "true");
  await page.locator(".gs-public-glass nav")
    .getByRole("link", { name: "Funcionalidades" }).click();
  await expect(page).toHaveURL(/#download-feature-catalog$/);
  await expect(page.getByRole("button", { name: "Abrir menú" })).toBeVisible();
});

test("mouse wheel scroll works outside the cinematic hero", async ({ page, browserName }) => {
  test.skip(browserName === "webkit",
    "Playwright's synthetic wheel does not scroll this page in headless WebKit; physical Safari wheel still needs verification.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await visit(page);
  // Start at a known middle-page position, away from the hero and page end.
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.min(
      Math.round(document.documentElement.scrollHeight * 0.5),
      document.documentElement.scrollHeight - innerHeight - 900
    ));
  });
  await expect.poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(500);
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(1200, 400);
  await page.mouse.wheel(0, 550);
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 12000 })
    .toBeGreaterThan(before + 20);
});

test("WebKit supports ordinary PageDown scrolling outside the hero", async ({ page, browserName }) => {
  test.skip(browserName !== "webkit", "WebKit-specific fallback coverage");
  await page.setViewportSize({ width: 1366, height: 768 });
  await visit(page);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.min(
      Math.round(document.documentElement.scrollHeight * 0.5),
      document.documentElement.scrollHeight - innerHeight - 900
    ));
  });
  await page.locator("body").click({ position: { x: 20, y: 500 }, force: true });
  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(before + 20);
});

test("animated sales showcase loads on approach and remains interactive", async ({ page, browserName }) => {
  test.setTimeout(80_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await visit(page);
  const showcase = page.locator('[data-testid="deferred-sales-flow"]');
  await expect(showcase).toHaveCount(1);

  // On a real downward scroll, an observer preloads the heavy showcase before
  // it comes onscreen; its animations and tab interactions must still work.
  await showcase.evaluate((node) => node.scrollIntoView({
    block: "center",
    behavior: "instant"
  }));
  const stock = showcase.getByRole("button", { name: "Stock", exact: true });
  await expect(stock).toBeVisible({ timeout: 30_000 });
  await stock.click({ force: browserName === "webkit" });
  await expect(stock).toHaveAttribute("data-active", "true");
  const cash = showcase.getByRole("button", { name: "Caja", exact: true });
  await cash.click({ force: browserName === "webkit" });
  await expect(cash).toHaveAttribute("data-active", "true");
});
