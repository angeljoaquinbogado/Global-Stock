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
  assert.match(helper, /process.env.VERCEL_URL/);
  assert.match(helper, /custom_id: DEMO_CUSTOM_ID/);
  assert.match(helper, /unit\.amount\?\.value !== DEMO_AMOUNT/);
  assert.match(create, /guardApiRequest\(request/);
  assert.match(capture, /guardApiRequest\(request/);
  assert.doesNotMatch(create, /body\.amount|body\.price|body\.currency/);
});

test("hackathon demo uses the app's own sample data and does not ship a disconnected mock page", () => {
  const page = file("apex-stock-os/app/hackathon-demo/page.tsx");
  const data = file("apex-stock-os/lib/demo-data.ts");
  assert.match(page, /redirect\("\/\?hackathon-demo=1"\)/);
  assert.doesNotMatch(data, /Reel Frontal Apex|Caña Carbon Pro|Delta Fishing Supply/);
  assert.match(data, /Yerba mate 1 kg/);
  assert.match(data, /Leche entera 1 L/);
  assert.doesNotMatch(page, /HackathonDemoClient/);
});

test("hackathon URL enters the actual Global Stock demo workspace and Sandbox checkout stays outside cash closeout", () => {
  const page = file("apex-stock-os/app/hackathon-demo/page.tsx");
  const shell = file("apex-stock-os/components/ApexShell.tsx");
  const cash = file("apex-stock-os/components/CashRegisterCenter.tsx");
  assert.match(page, /redirect\("\/\?hackathon-demo=1"\)/);
  assert.match(shell, /requestedHackathonDemo/);
  assert.match(shell, /setDemoMode\(true\)/);
  assert.doesNotMatch(cash, /PayPal Sandbox|paypalConfigured|paypalBusy/);
  assert.doesNotMatch(shell, /PayPal Sandbox · demo del hackathon/);
  assert.doesNotMatch(shell, /paypalPanelOpen|hackathonPaymentNotice|startHackathonSandboxCheckout/);
  const plans = file("apex-stock-os/components/SubscriptionPlans.tsx");
  const account = file("apex-stock-os/components/WorkspaceAccountPanel.tsx");
  assert.match(account, /<SubscriptionPlans language={language} \/>/);
  assert.match(plans, /Prueba gratuita/);
  assert.match(plans, /15 días/);
  assert.match(plans, /9900/);
  assert.match(plans, /19900/);
  assert.match(plans, /La contratación y los cobros todavía no están activados/);
  assert.doesNotMatch(plans, /window\.location\.assign|fetch\("\/api\/paypal/);
});

test("hackathon demo reuses the real Global Intelligence assistant rather than a second mock AI", () => {
  const assistant = file("apex-stock-os/components/ApexIntelligence.tsx");
  const shell = file("apex-stock-os/components/ApexShell.tsx");
  assert.match(assistant, /Global Intelligence/);
  assert.match(assistant, /<VoiceInputButton/);
  assert.match(assistant, /<VoiceOutputButton/);
  assert.match(shell, /requestedHackathonDemo/);
  assert.doesNotMatch(shell, /HackathonDemoClient/);
});

test("Global Intelligence voice input is optional and Spanish-Argentina localized", () => {
  const voice = file("apex-stock-os/components/VoiceInputButton.tsx");
  const assistant = file("apex-stock-os/components/ApexIntelligence.tsx");
  const output = file("apex-stock-os/components/VoiceOutputButton.tsx");
  assert.match(voice, /next\.lang = "es-AR"/);
  assert.match(voice, /disabled={!supported}/);
  assert.match(voice, /recognition\.current\?\.abort\(\)/);
  assert.match(assistant, /<VoiceInputButton/);
  assert.match(assistant, /<VoiceOutputButton/);
  assert.match(output, /utterance.lang = "es-AR"/);
  assert.match(output, /window.speechSynthesis.cancel\(\)/);
});
