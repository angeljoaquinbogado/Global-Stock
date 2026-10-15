import { expect, test } from "@playwright/test";
import {
  LOGIN_ATTEMPT_LIMIT,
  LOGIN_ATTEMPT_STORAGE_KEY,
  LOGIN_ATTEMPT_WINDOW_MS,
  addFailedLoginAttempt,
  classifyAuthFailure,
  emptyLoginAttemptState,
  loginLockSeconds,
  readLoginAttemptState
} from "../apex-stock-os/lib/auth-feedback";

test("auth feedback maps Supabase errors without exposing whether an email exists", () => {
  expect(classifyAuthFailure({ status: 400, code: "invalid_credentials", message: "Invalid login credentials" })).toBe("invalid");
  expect(classifyAuthFailure({ status: 400, code: "email_not_confirmed" })).toBe("unconfirmed");
  expect(classifyAuthFailure({ status: 429, message: "Rate limit exceeded" })).toBe("rate_limited");
  expect(classifyAuthFailure({ status: 422, code: "user_already_exists" })).toBe("duplicate");
  expect(classifyAuthFailure(new TypeError("Failed to fetch"))).toBe("network");
});

test("local failed-login counter stops at five and expires after fifteen minutes", () => {
  const now = 1_750_000_000_000;
  let state = emptyLoginAttemptState();
  for (let i = 1; i <= LOGIN_ATTEMPT_LIMIT; i++) {
    state = addFailedLoginAttempt(state, now + i);
    expect(state.failed).toBe(i);
    if (i < LOGIN_ATTEMPT_LIMIT) expect(state.lockedUntil).toBe(0);
  }
  expect(loginLockSeconds(state, now + LOGIN_ATTEMPT_LIMIT + 1)).toBe(900);
  expect(addFailedLoginAttempt(state, now + 10).failed).toBe(LOGIN_ATTEMPT_LIMIT);
  expect(readLoginAttemptState(JSON.stringify(state), now + LOGIN_ATTEMPT_LIMIT + LOGIN_ATTEMPT_WINDOW_MS + 1))
    .toEqual(emptyLoginAttemptState());
  expect(readLoginAttemptState("not JSON", now)).toEqual(emptyLoginAttemptState());
  expect(readLoginAttemptState('{"failed":-10,"startedAt":5,"lockedUntil":1}', now))
    .toEqual(emptyLoginAttemptState());
});

test("sign-in respects a saved cooldown without exposing the credential fields in logs", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Client cooldown checked in Chromium.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Iniciar sesión", exact: true })).toBeVisible();
  // Simulate a cooldown saved in another tab. No network requests or real
  // account lockouts are needed to validate the interface.
  await page.evaluate((key) => {
    const now = Date.now();
    localStorage.setItem(key, JSON.stringify({
      failed: 5, startedAt: now - 1000, lockedUntil: now + 15 * 60 * 1000
    }));
    window.dispatchEvent(new StorageEvent("storage", { key }));
  }, LOGIN_ATTEMPT_STORAGE_KEY);
  await expect(page.locator('form button[type="submit"]')).toBeDisabled();
  const buttonText = await page.locator('form button[type="submit"]').innerText();
  expect(buttonText).toMatch(/15 min/);
  await page.evaluate(key => {
    localStorage.removeItem(key);
    window.dispatchEvent(new StorageEvent("storage", { key }));
  }, LOGIN_ATTEMPT_STORAGE_KEY);
  await expect(page.locator('form button[type="submit"]')).toBeEnabled();
});

test("login text fields have a clean underline, not a rectangular focus outline", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "CSS browser focus checked in Chromium.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const email = page.locator('form input[type="email"]');
  const password = page.getByTestId("auth-password-input");
  for (const field of [email, password]) {
    await field.focus();
    const css = await field.evaluate(el => {
      const s = getComputedStyle(el);
      return { outline: s.outlineStyle, radius: s.borderRadius };
    });
    expect(css.outline).toBe("none");
    expect(css.radius).toBe("0px");
    // The underlined inputs have an intentional color transition.
    await expect.poll(
      () => field.evaluate(el => getComputedStyle(el).borderBottomColor),
      { timeout: 2500 }
    ).toBe("rgb(143, 0, 0)");
  }
});
