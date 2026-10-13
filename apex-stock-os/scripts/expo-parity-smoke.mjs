import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const origin=process.env.GLOBAL_STOCK_E2E_URL || "http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true});
try {
  for (const viewport of [{name:"iphone",width:390,height:844},{name:"desktop",width:1440,height:900}]) {
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    // In CI only, emulate the public, unauthenticated Supabase configuration.
    // This is a placeholder, not a credential and cannot access any data.
    await page.route("**/api/mobile-config", route => route.fulfill({
      status:200, contentType:"application/json",
      body:JSON.stringify({
        supabaseUrl:"https://yckimhbtvijmmkxukxgd.supabase.co",
        supabasePublishableKey:["sb","publishable","browser_qa_placeholder"].join("_")
      })
    }));
    const response=await page.goto(origin+"/native-app/index.html",{waitUntil:"domcontentloaded",timeout:30000});
    if(!response?.ok())throw Error(viewport.name+": failed to load Expo export");
    try {
      await page.getByText("Bienvenido a",{exact:false}).first().waitFor({state:"visible",timeout:30000});
    } catch (err) {
      mkdirSync("test-results/expo-parity",{recursive:true});
      await page.screenshot({path:"test-results/expo-parity/"+viewport.name+"-diagnostic.png",fullPage:true}).catch(()=>null);
      console.error("Expo welcome diagnostics", {
        viewport:viewport.name,
        errors,
        title:await page.title().catch(()=>"<unavailable>"),
        content:(await page.locator("body").innerText().catch(()=>"")).slice(0,1700),
        path:await page.evaluate(()=>location.href).catch(()=>"")
      });
      throw err;
    }
    await page.getByText("Comenzar",{exact:false}).first().waitFor({state:"visible",timeout:10000});
    mkdirSync("test-results/expo-parity",{recursive:true});
    await page.screenshot({path:"test-results/expo-parity/"+viewport.name+".png",fullPage:true});
    if(errors.length)throw Error(viewport.name+" browser errors: "+errors.slice(0,5).join("; "));
    console.log(viewport.name+" rendered actual Expo welcome");
    await page.close();
  }
} finally {await browser.close();}
