import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const file = path => readFileSync(resolve(root, path), "utf8");

test("PayPal demo is sandbox-only and never accepts a browser-supplied amount", () => {
  const helper = file("apex-stock-os/lib/paypal-sandbox.ts");
  const create = file("apex-stock-os/app/api/paypal/sandbox/orders/route.ts");
  const capture = file("apex-stock-os/app/api/paypal/sandbox/orders/capture/route.ts");
  assert.match(helper, /https:\/\/api-m\.sandbox\.paypal\.com/);
  assert.doesNotMatch(helper, /api-m\.paypal\.com(?!\.sandbox)/);
  assert.match(helper, /const DEMO_AMOUNT = "19\.99"/);
  assert.match(helper, /const DEMO_CURRENCY = "USD"/);
  assert.match(helper, /custom_id: DEMO_CUSTOM_ID/);
  assert.match(helper, /unit\.amount\?\.value !== DEMO_AMOUNT/);
  assert.match(create, /guardApiRequest\(request/);
  assert.match(capture, /guardApiRequest\(request/);
  assert.doesNotMatch(create, /body\.amount|body\.price|body\.currency/);
});

test("demo stays isolated, clearly labels sample data and does not pretend to change real stock", () => {
  const page = file("apex-stock-os/app/hackathon-demo/HackathonDemoClient.tsx");
  const data = file("apex-stock-os/lib/demo-data.ts");
  assert.match(page, /Demo aislada · datos ficticios/);
  assert.match(page, /PayPal Developer Sandbox/);
  assert.match(page, /no modifica datos reales ni ejecuta compras/);
  assert.match(page, /\/api\/paypal\/sandbox\/orders/);
  assert.doesNotMatch(data, /Reel Frontal Apex|Caña Carbon Pro|Delta Fishing Supply/);
  assert.match(data, /Yerba mate 1 kg/);
  assert.match(data, /Leche entera 1 L/);
});

test("public hackathon AI can only access fixed sample data and has no payment or write tools", () => {
  const route = file("apex-stock-os/app/api/hackathon-demo/assistant/route.ts");
  assert.match(route, /scope: "public-hackathon-demo-ai", limit: 8/);
  assert.match(route, /products: demoProducts/);
  assert.match(route, /dataClassification: "fictional sample data only"/);
  assert.match(route, /"modify_inventory", "create_purchase_order", "capture_payment"/);
  assert.match(route, /message.length > 500/);
  assert.doesNotMatch(route, /authorizeBusinessRequest|global_stock_ai_allow_request/);
});

test("Global Intelligence voice input is optional and Spanish-Argentina localized", () => {
  const voice = file("apex-stock-os/components/VoiceInputButton.tsx");
  const assistant = file("apex-stock-os/components/ApexIntelligence.tsx");
  assert.match(voice, /next\.lang = "es-AR"/);
  assert.match(voice, /disabled={!supported}/);
  assert.match(voice, /next\.abort\(\)/);
  assert.match(assistant, /<VoiceInputButton/);
});
