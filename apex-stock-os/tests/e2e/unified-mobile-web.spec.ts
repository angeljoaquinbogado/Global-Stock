import { expect, test } from "@playwright/test";

/** The official browser app must boot the EXACT Expo Go export, not an
 * unrelated Next.js copy. The old dashboard remains available at /classic.
 */
for (const viewport of [
  { name: "iPhone", width: 390, height: 844 },
  { name: "Desktop", width: 1440, height: 900 }
]) {
  test("official home opens Expo UI on "+viewport.name, async ({page}) => {
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    const response=await page.goto("/",{waitUntil:"domcontentloaded"});
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/native-app\/index\.html/);
    await expect(page.getByText("Bienvenido a",{exact:false}).first()).toBeVisible({timeout:30000});
    await expect(page.getByText("Comenzar",{exact:false}).first()).toBeVisible();
  });
}
test("original browser dashboard is preserved for rollback",async ({page})=>{
  await page.goto("/classic",{waitUntil:"domcontentloaded"});
  await expect(page.getByRole("button",{name:"Iniciar sesión",exact:true}).first()).toBeVisible({timeout:30000});
});
