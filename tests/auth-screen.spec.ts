import { expect, test } from "@playwright/test";

// Visual behavior matches the supplied second reference video:
// mode changes are triggered by a small inline link, NOT an upper tab bar.
for (const viewport of [
  { name: "large desktop", width: 1440, height: 900 },
  { name: "notebook 1366x640", width: 1366, height: 640 },
  { name: "iPhone", width: 390, height: 844 },
  { name: "small Android", width: 360, height: 740 }
]) {
  test("fixed reference auth switches without bars on " + viewport.name, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Reference animation geometry is checked in Chromium.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const stage = page.getByTestId("auth-split-stage");
    const panel = page.getByTestId("auth-form-panel");
    await expect(stage).toBeVisible({ timeout: 30_000 });
    await expect(panel).toBeVisible();

    // The old coloured tab strip and its animated red selection have gone.
    await expect(page.locator('[layoutid="gs-auth-active-tab"], .gs-auth-active-tab')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toHaveCount(1);
    await expect(panel).toHaveClass(/gs-auth-panel-fixed/);
    expect(await panel.evaluate(el => getComputedStyle(el).overflowY)).toBe("hidden");

    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Crear cuenta", exact: true })).toBeVisible();
    await expect(page.locator("form input[autocomplete=name]")).toBeVisible();
    await expect(page.getByRole("checkbox", {
      name: "Declaro ser mayor de 18 años y aceptar los términos y la privacidad"
    })).toBeVisible();
    await expect(panel).toHaveClass(/gs-auth-panel-fixed/);
    expect(await panel.evaluate(el => getComputedStyle(el).overflowY)).toBe("hidden");

    const registrationSubmit = page.locator("form button[type=submit]");
    await expect(registrationSubmit).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.getByText("Nombre del negocio", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Continuar con Apple" })).toHaveCount(0);

    const dimensionCheck = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="auth-form-panel"]')!;
      const main = document.querySelector('.gs-auth-viewport')!;
      return {
        horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight,
        panelOverflow: panel.scrollHeight - panel.clientHeight,
        panelScrollY: panel.scrollTop,
        mainOverflow: main.scrollHeight - main.clientHeight,
      };
    });
    expect(dimensionCheck.horizontal).toBeLessThanOrEqual(2);
    expect(dimensionCheck.vertical).toBeLessThanOrEqual(2);
    expect(dimensionCheck.panelScrollY).toBe(0);
    expect(dimensionCheck.panelOverflow).toBeLessThanOrEqual(2);

    await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar con Apple" })).toHaveCount(0);
    expect(await panel.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(2);
    // Login remains fixed after removing the unavailable Apple provider.
    expect(await panel.evaluate(el => getComputedStyle(el).overflowY)).toBe("hidden");
    await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toBeVisible();
  });
}

test("signup asks only for user details and required beta attestation", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Registration inputs checked in Chromium.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  const form = page.locator("form").first();
  await expect(form.locator('input[autocomplete="name"]')).toBeVisible();
  await expect(form.locator('input[type="email"]')).toBeVisible();
  await expect(form.locator('input[type="password"]')).toBeVisible();
  await expect(form.locator('input[type="checkbox"]')).toHaveCount(1);
  await expect(form.locator("textarea")).toHaveCount(0);
  await expect(page.getByText("Actividad del negocio", { exact: true })).toHaveCount(0);
  await expect(page.getByText("País de operación", { exact: true })).toHaveCount(0);
});

test("Google remains available in light and dark theme without Apple", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Identity UI checked in Chromium.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const google = page.getByRole("button", { name: "Continuar con Google" });
  await expect(google).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar con Apple" })).toHaveCount(0);
  await page.getByRole("button", { name: "Cambiar tema" }).click();
  await expect(google).toBeVisible();
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
});


for (const viewport of [
  { width: 1366, height: 640, name: "notebook" },
  { width: 390, height: 844, name: "phone" }
]) {
  test("password eye toggles masking without altering the secret on " + viewport.name, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Input visibility and keyboard behavior checked in Chromium.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const password = page.getByTestId("auth-password-input");
    const toggle = page.getByTestId("auth-password-visibility");
    await expect(password).toBeVisible({ timeout: 30_000 });
    await password.fill("Prueba123!2026");
    await expect(password).toHaveAttribute("type", "password");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Prueba123!2026");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("Prueba123!2026");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
    await expect(password).toHaveAttribute("type", "password");
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("Prueba123!2026");
    const bounds = await toggle.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(39);
    expect(bounds?.height).toBeGreaterThanOrEqual(39);
    const panel = page.getByTestId("auth-form-panel");
    expect(await panel.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(2);
  });
}


test("language and theme stay clear of the diagonal edge on desktop", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Diagonal geometry is verified in Chromium.");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const controls = page.getByTestId("auth-header-preferences");
  await expect(controls).toBeVisible();
  const stage = await page.getByTestId("auth-split-stage").boundingBox();
  const prefs = await controls.boundingBox();
  expect(stage).not.toBeNull();
  expect(prefs).not.toBeNull();
  // The curtain begins at 36% of the card's width at its upper edge.
  expect(prefs!.x + prefs!.width).toBeLessThan(
    stage!.x + stage!.width * 0.36 - 10
  );
  const logo = await page.locator(".gs-auth-reference-logo").boundingBox();
  expect(logo).not.toBeNull();
  expect(prefs!.x).toBeGreaterThan(logo!.x + logo!.width + 8);
  await expect(page.getByRole("button", { name: "Cambiar tema" })).toBeVisible();
});


for (const viewport of [
  { name: "desktop", width: 1366, height: 768 },
  { name: "mobile", width: 390, height: 844 }
]) {
  test("language dropdown is readable and changes language on " + viewport.name, async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Custom language menu checked in Chromium.");
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const trigger = page.getByTestId("auth-language-trigger");
    await expect(trigger).toBeVisible({ timeout: 30_000 });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    const menu = page.getByTestId("auth-language-menu");
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("option")).toHaveCount(5);

    const menuBox = await menu.boundingBox();
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(menuBox).not.toBeNull();
    expect(menuBox!.width).toBeGreaterThanOrEqual(195);
    expect(menuBox!.x).toBeGreaterThanOrEqual(0);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewportWidth);
    await expect(page.getByTestId("auth-language-option-es")).toHaveAttribute("aria-selected", "true");

    await page.getByTestId("auth-language-option-de").click();
    await expect(page.getByRole("heading", { name: "Anmelden", exact: true })).toBeVisible();
    await expect(trigger).toHaveText(/DE/);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
    await expect(menu).toBeHidden();
    await expect(trigger).toHaveText(/ES/);

    await trigger.click();
    await page.getByTestId("auth-password-input").click();
    await expect(menu).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight)).toBeLessThanOrEqual(2);
  });
}
