import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const current = dirname(fileURLToPath(import.meta.url));
const nextRoot = resolve(current, "..");
const expoRoot = resolve(nextRoot, "..", "apps", "global-stocks-mobile");
const destination = resolve(nextRoot, "public", "native-app");
if (!existsSync(resolve(expoRoot, "App.tsx")) || !existsSync(resolve(expoRoot, "app.json"))) {
  throw new Error("The Expo Go source must be present in this checkout. Do not deploy a partial substitute.");
}
function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd, env: { ...process.env, CI: "1", EXPO_NO_TELEMETRY: "1" },
    stdio: "inherit", shell: process.platform === "win32", timeout: 360_000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(command+" "+args.join(" ")+" failed ("+result.status+")");
}
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
run(npm, ["install","--no-audit","--no-fund"], expoRoot);
run(npx, ["expo","install","react-dom","react-native-web","@expo/metro-runtime"], expoRoot);
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, {recursive:true});
run(npm, ["run","export:web"], expoRoot);
const htmlPath=resolve(destination,"index.html");
if (!existsSync(htmlPath) || !existsSync(resolve(destination,"_expo","static","js","web")))
  throw new Error("Expo did not export a complete browser app; keep the previous production deployment.");
const html=readFileSync(htmlPath,"utf8");
if (!html.includes('src="/native-app/_expo/') || !html.includes('<div id="root"></div>'))
  throw new Error("Expo asset paths or root are invalid. Stop before deploying a blank app.");
console.log("Expo Web parity build created at /native-app/.");
