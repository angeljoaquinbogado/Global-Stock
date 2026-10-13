import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const webRoot = resolve(import.meta.dirname, "..");
const repositoryRoot = resolve(webRoot, "..");
const web = path => readFileSync(resolve(webRoot, path), "utf8");
const repo = path => readFileSync(resolve(repositoryRoot, path), "utf8");

test("PC website builds its own Next.js app, never an Expo Web export", () => {
  const scripts = JSON.parse(web("package.json")).scripts;
  assert.match(scripts.prebuild, /restore-web-entry\.mjs/);
  assert.doesNotMatch(scripts.prebuild, /export-expo-to-web|expo export/);
  assert.match(scripts.predev, /restore-web-entry\.mjs/);
  assert.doesNotMatch(scripts.predev, /ensure-expo-web-for-dev|expo export/);
  assert.match(scripts["predev:lan"], /restore-web-entry\.mjs/);
  const config = web("next.config.mjs");
  assert.match(config, /source: "\/native-app\/(:path\*|index\.html)"/);
  assert.match(config, /destination: "\/"/);
});

test("original responsive PC entry stays separate from Expo Go source", () => {
  assert.match(web("app/page.tsx"), /<ApexShell\s*\/>/);
  assert.match(web("components/BusinessWorkspace.tsx"), /lg:grid-cols-\[250px_minmax\(0,1fr\)\]/);
  assert.match(repo("apps/global-stocks-mobile/index.ts"), /import App from "\.\/App"/);
  assert.doesNotMatch(repo("apps/global-stocks-mobile/index.ts"), /\.\/src\/components\/UnifiedApp/);
});

test("web cleanup is restricted to legacy generated public files", () => {
  const cleanup = web("scripts/restore-web-entry.mjs");
  assert.match(cleanup, /"public"/);
  assert.match(cleanup, /"native-app"/);
  assert.match(cleanup, /isSymbolicLink/);
  assert.doesNotMatch(cleanup, /rmSync\(expoRoot|rmSync\(expo\b/);
});
