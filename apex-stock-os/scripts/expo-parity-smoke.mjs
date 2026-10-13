import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const origin=process.env.GLOBAL_STOCK_E2E_URL || "http://127.0.0.1:3000";
const browser=await chromium.launch({headless:true});
try {
  for (const viewport of [{name:"iphone",width:390,height:844},{name:"desktop",width:1440,height:900}]) {
    const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    const response=await page.goto(origin+"/native-app/index.html",{waitUntil:"domcontentloaded",timeout:30000});
    if(!response?.ok())throw Error(viewport.name+": failed to load Expo export");
    await page.getByText("Bienvenido a",{exact:false}).first().waitFor({state:"visible",timeout:30000});
    await page.getByText("Comenzar",{exact:false}).first().waitFor({state:"visible",timeout:10000});
    mkdirSync("test-results/expo-parity",{recursive:true});
    await page.screenshot({path:"test-results/expo-parity/"+viewport.name+".png",fullPage:true});
    if(errors.length)throw Error(viewport.name+" browser errors: "+errors.slice(0,5).join("; "));
    console.log(viewport.name+" rendered actual Expo welcome");
    await page.close();
  }
} finally {await browser.close();}
