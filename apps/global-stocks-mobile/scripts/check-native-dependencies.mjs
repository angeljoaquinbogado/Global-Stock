/**
 * Prevent red-screen "Unable to resolve module" errors in Expo Go.
 * Scans all mobile TypeScript imports and package.json and verifies that
 * every declared native runtime dependency is actually installed locally.
 * No network requests, no credentials, and no automatic package changes.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
const verifyInstalled = process.argv.includes("--installed");

function listSources(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listSources(path);
    return /\.(?:[cm]?ts|tsx|jsx?)$/.test(entry.name) ? [path] : [];
  });
}
function packageName(specifier) {
  if (specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("node:")) return null;
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}

const sources = [
  ...listSources(join(root, "src")),
  ...["App.tsx", "index.ts"].map((file) => join(root, file)).filter(existsSync),
];
const used = new Map();
function register(name, source) {
  const dep = packageName(name);
  if (!dep) return;
  if (!used.has(dep)) used.set(dep, []);
  used.get(dep).push(source.substring(root.length + 1));
}
for (const source of sources) {
  const code = readFileSync(source, "utf8");
  // Only parse actual import declarations. A bare "from \"...\"" regex
  // also matches JSX expressions and text inside the currency converter.
  let statement = "";
  for (const line of code.split("\\n")) {
    if (!statement && /^\\s*import(?:\\s|\\{|$)/.test(line)) statement = line;
    else if (statement) statement += "\\n" + line;
    if (statement && (statement.includes(";") || statement.length > 1200)) {
      const found = statement.match(/\\bfrom\\s*["']([^"'\\r\\n]+)["']/)
        ?? statement.match(/^\\s*import\\s*["']([^"'\\r\\n]+)["']/);
      if (found) register(found[1], source);
      statement = "";
    }
  }
  const requires = /\\brequire\\s*\\(\\s*["']([^"'\\r\\n]+)["']\\s*\\)/g;
  for (const [, name] of code.matchAll(requires)) register(name, source);
}
const errors = [];
for (const [dep, paths] of used) {
  if (!Object.hasOwn(dependencies, dep)) errors.push(`Package "${dep}" imported by ${paths[0]} is missing from package.json`);
}
if (verifyInstalled) {
  for (const dep of Object.keys(pkg.dependencies ?? {})) {
    const path = join(root, "node_modules", ...dep.split("/"), "package.json");
    if (!existsSync(path)) errors.push(`Package "${dep}" is missing from node_modules (run npm install)`);
  }
}
if (errors.length) {
  process.stderr.write("Global Stock Mobile dependency check failed:\n" + errors.map((item) => " - " + item).join("\n") + "\n");
  process.exit(1);
}
process.stdout.write(`Dependency audit passed: ${used.size} imported packages, ${Object.keys(pkg.dependencies ?? {}).length} runtime dependencies${verifyInstalled ? " installed" : " declared"}.\n`);
