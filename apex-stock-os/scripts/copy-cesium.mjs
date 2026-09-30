import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const source = path.join(root, "node_modules", "cesium", "Build", "Cesium");
const destination = path.join(root, "public", "cesium");

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(source))) {
  throw new Error(
    "Cesium is not installed. Run npm install before building Global Stock."
  );
}

await mkdir(destination, { recursive: true });

for (const folder of ["Assets", "ThirdParty", "Widgets", "Workers"]) {
  await cp(
    path.join(source, folder),
    path.join(destination, folder),
    { recursive: true, force: true }
  );
}

console.log("Cesium runtime assets prepared in public/cesium.");
