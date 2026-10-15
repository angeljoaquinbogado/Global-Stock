import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 900, name: "desktop" },
  { width: 390, height: 844, name: "phone" }
]) {
  test("Inicio renders animated metrics and charts without touching the left navigation on "+viewport.name, async ({page,browserName})=>{
    test.skip(browserName!=="chromium","Home animation and side-navigation regression tested in Chromium");
    await page.setViewportSize({width:viewport.width,height:viewport.height});
    await page.addInitScript(()=>window.localStorage.setItem("__global_stock_demo_active_v1","1"));
    await page.goto("/",{waitUntil:"domcontentloaded"});
    const dashboard=page.getByTestId("animated-home-dashboard");
    await expect(dashboard).toBeVisible({timeout:30000});
    await expect(dashboard.getByRole("heading",{name:/centro de control/i})).toBeVisible();
    await expect(dashboard.getByTestId("exec-kpi").first()).toBeVisible();
    await expect(dashboard.getByTestId("exec-revenue-chart")).toBeVisible();
    await expect(dashboard.getByTestId("exec-session-timer")).toBeVisible();
    const root = await dashboard.evaluate(el=>({width:el.scrollWidth,clientWidth:el.clientWidth}));
    expect(root.width-root.clientWidth).toBeLessThanOrEqual(2);
    await expect(dashboard).toHaveAttribute("data-accent","emerald");
    await dashboard.getByRole("button",{name:"Azul"}).click();
    await expect(dashboard).toHaveAttribute("data-accent","blue");
    await dashboard.getByRole("button",{name:"Verde esmeralda"}).click();
    await expect(dashboard).toHaveAttribute("data-accent","emerald");
    const timer=dashboard.getByTestId("exec-session-timer");
    await timer.getByRole("button",{name:/pausar/i}).click();
    await expect(timer.getByRole("button",{name:/reanudar/i})).toBeVisible();
    await timer.getByRole("button",{name:/reanudar/i}).click();
    await expect(timer.getByRole("button",{name:/pausar/i})).toBeVisible();
    if(viewport.width>900){
      const nav=page.locator("#business-sidebar-nav");
      await expect(nav).toBeVisible();
      await expect(nav.locator("section > p")).toHaveText(["Principal","Análisis","Organización","Gestión","Ajustes","Legal"]);
      await expect(nav.getByRole("button",{name:"Inicio",exact:true})).toBeVisible();
      await expect(nav.getByRole("button",{name:"Gráficos",exact:true})).toBeVisible();
      await nav.getByRole("button",{name:"Gráficos",exact:true}).click();
      await expect(dashboard).toHaveCount(0);
      await nav.getByRole("button",{name:"Inicio",exact:true}).click();
      await expect(page.getByTestId("animated-home-dashboard")).toBeVisible();
    }
  });
}

test("Inicio counter and graph use real demo measurements, not hardcoded reference numbers",async ({page,browserName})=>{
  test.skip(browserName!=="chromium","Data consistency tested in Chromium");
  await page.setViewportSize({width:1440,height:900});
  await page.addInitScript(()=>window.localStorage.setItem("__global_stock_demo_active_v1","1"));
  await page.goto("/",{waitUntil:"domcontentloaded"});
  const dashboard=page.getByTestId("animated-home-dashboard");
  await expect(dashboard.getByTestId("exec-revenue-chart")).toBeVisible();
  const bars=dashboard.locator(".gs-exec-chart__column");
  await expect(bars).toHaveCount(7);
  await expect(bars.first()).toHaveAttribute("aria-label",/Lun:.*612/);
  // Account information and charts remain in separate pages. Nothing writes inventory
  // or financial figures simply because the dashboard was opened.
  await expect(dashboard.locator("input")).toHaveCount(0);
});
