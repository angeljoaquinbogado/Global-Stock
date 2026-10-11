import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const repository = resolve(here, "../../..");
const project = resolve(here, "..");

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: repository, encoding: "utf8" })
  .split("\0").filter(Boolean);

const allowedEnv = /\.env(?:\.[^/]+)?\.(?:example|sample|template)$/i;
const secretExtensions = /\.(?:pem|p8|p12|jks|keystore|mobileprovision|sqlite|sqlite3|db|key)$/i;
const bad = tracked.filter((path) => {
  const filename = path.slice(path.lastIndexOf("/") + 1);
  if (filename === ".env" || (filename.startsWith(".env.") && !allowedEnv.test(filename))) return true;
  if (secretExtensions.test(filename)) return true;
  return /(?:^|\/)\.expo\/|(?:^|\/)node_modules\/|(?:^|\/)\.vercel\//.test(path);
});
if (bad.length > 0) {
  process.stderr.write("Potential private/generated files are tracked; review and remove before release:\n");
  for (const file of bad) process.stderr.write(" - " + file + "\n");
  process.exitCode = 1;
}

const app = JSON.parse(readFileSync(resolve(project, "app.json"), "utf8"));
if (app.expo.name !== "Global Stock" || app.expo.slug !== "global-stocks") {
  throw new Error("Unexpected Expo app name/slug. Check mobile app.json.");
}
const entry = readFileSync(resolve(project, "App.tsx"), "utf8");
if (!entry.includes("PreviewMode") || !existsSync(resolve(project, "src/components/PreviewMode.tsx"))) {
  throw new Error("The Global Stock preview entry is missing.");
}
if (!existsSync(resolve(repository, "INICIAR-GLOBAL-STOCK.cmd"))) {
  throw new Error("Windows launcher is missing.");
}
for (const asset of ["assets/icon.png", "assets/splash.png", "assets/brand-mark.png"]) {
  if (!existsSync(resolve(project, asset))) throw new Error("Missing mobile brand asset: " + asset);
}
if (!process.exitCode) process.stdout.write("Expo project and tracked-file hygiene checks passed.\n");
