import { expect, test } from "@playwright/test";

/** PC/notebook has its own responsive dashboard.
 * Expo's exported view remains separately accessible, never forced on desktop.
 * Both use the same Supabase business data and API contracts.
 */
for (const viewport of [
  { name: "iPhone", width: 390, height: 844 },
  { name: "Desktop", width: 1440, height: 900 }
]) {
  test("responsive desktop-designed workspace is the home on "+viewport.name, async ({page}) => {
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const response=await page.goto("/",{waitUntil:"domcontentloaded"});
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId("auth-split-stage")).toBeVisible({timeout:30000});
    await expect(page.getByRole("button",{name:"Iniciar sesión",exact:true}).first()).toBeVisible();
    await expect(page.getByText("Bienvenido a",{exact:false})).toHaveCount(0);
  });
}
test("classic remains available as a desktop dashboard alias",async ({page})=>{
  await page.goto("/classic",{waitUntil:"domcontentloaded"});
  await expect(page.getByRole("button",{name:"Iniciar sesión",exact:true}).first()).toBeVisible({timeout:30000});
});

test("demo credentials open an isolated Expo preview without Supabase login", async ({ page }) => {
  test.setTimeout(60000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/native-app/index.html", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Ya tengo una cuenta" })).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Ya tengo una cuenta" }).click();

  await expect(page.getByRole("button", { name: "Probar demo" })).toBeVisible();
  await page.getByRole("button", { name: "Probar demo" }).click();
  await expect(page.getByText("MODO DEMOSTRACIÓN")).toBeVisible();
  await expect(page.getByText(/productos son ficticios/i)).toBeVisible();

  await page.getByRole("button", { name: "Cerrar demostración" }).click();
  await expect(page.getByText("Bienvenido a", { exact: false }).first()).toBeVisible();

  await page.getByRole("button", { name: "Ya tengo una cuenta" }).click();
  await page.getByPlaceholder("Correo electrónico").fill("demo@globalstock.app");
  await page.getByPlaceholder("Contraseña").fill("GlobalStock2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("MODO DEMOSTRACIÓN")).toBeVisible();
});

test("Expo Web remains available separately, without replacing PC", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto("/native-app/index.html", { waitUntil: "domcontentloaded" });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByText("Bienvenido a",{exact:false}).first()).toBeVisible({timeout:30000});
  await expect(page.getByText("Comenzar",{exact:false}).first()).toBeVisible();
});
