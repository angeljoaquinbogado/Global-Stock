import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expo = resolve(root, "..", "apps", "global-stocks-mobile");
const web = resolve(root, "public", "native-app");
const htmlPath = resolve(web, "index.html");
const jsPath = resolve(web, "_expo", "static", "js", "web");
const exportScript = resolve(root, "scripts", "export-expo-to-web.mjs");
const extensions = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".png", ".jpg", ".jpeg", ".webp", ".svg"]);
const ignored = new Set(["node_modules", ".expo", ".git", "dist", "build", "web-build", "coverage", "ios", "android"]);

function validExport() {
  if (!existsSync(htmlPath) || !existsSync(jsPath)) return false;
  try {
    const html = readFileSync(htmlPath, "utf8");
    return html.includes('src="/native-app/_expo/') && html.includes('<div id="root"></div>');
  } catch {
    return false;
  }
}

function sourceIsNewer(rootDir, generatedAt) {
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    if (!dir) continue;
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      if (item.isDirectory()) {
        if (!ignored.has(item.name)) stack.push(resolve(dir, item.name));
      } else if (item.isFile() && extensions.has(extname(item.name).toLowerCase())) {
        if (statSync(resolve(dir, item.name)).mtimeMs > generatedAt + 1000) return true;
      }
    }
  }
  return false;
}

if (!existsSync(expo)) {
  throw new Error("Missing apps/global-stocks-mobile. Keep the Expo source in the same repository.");
}
const needsExport = !validExport() ||
  sourceIsNewer(expo, existsSync(htmlPath) ? statSync(htmlPath).mtimeMs : 0);

if (needsExport) {
  console.log("[Global Stock] Preparando la misma interfaz Expo Go para el navegador...");
  const result = spawnSync(process.execPath, [exportScript], {
    cwd: root, stdio: "inherit", timeout: 420_000,
    env: { ...process.env, EXPO_NO_TELEMETRY: "1" }
  });
  if (result.error || result.status !== 0 || !validExport()) {
    throw new Error(
      "La exportación de Expo Web falló. No iniciaremos una aplicación incompleta. " +
      "Revisá el error anterior; no borres tus proyectos ni archivos locales."
    );
  }
} else {
  console.log("[Global Stock] Expo Web ya está actualizado. Se reutiliza la exportación existente.");
}
console.log("[Global Stock] /native-app/index.html listo para Next.js.");
