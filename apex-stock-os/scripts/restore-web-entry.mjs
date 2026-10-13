// Restore the original Next.js desktop website. The Expo app lives in its
// own workspace and must NEVER be copied into the public website on build.
// Only remove previously generated web-export assets in Next's public folder.
import { existsSync, lstatSync, rmSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = resolve(webRoot, "public");
const generated = resolve(publicRoot, "native-app");
if (!generated.startsWith(publicRoot + sep)) {
  throw new Error("Unsafe legacy export path");
}
if (existsSync(generated)) {
  // Fail closed on symlinks: never follow a path outside the web workspace.
  if (lstatSync(generated).isSymbolicLink()) {
    throw new Error("Legacy Expo export path unexpectedly points to a symlink");
  }
  rmSync(generated, { recursive: true, force: true });
  console.log("[Global Stock Web] Removed legacy /native-app export from web assets.");
}
console.log("[Global Stock Web] Next.js keeps its own design; Expo Go remains unchanged.");
