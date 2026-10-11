// Run before Expo. This catches TypeScript and JSX syntax failures on the PC.
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, extname, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [join(root, "App.tsx"), join(root, "index.ts")];

function collect(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (/\.(?:tsx?|jsx?)$/.test(entry.name)) files.push(path);
  }
}
collect(join(root, "src"));

let errors = 0;
for (const path of files) {
  const extension = extname(path).toLowerCase();
  const kind = extension === ".tsx" ? ts.ScriptKind.TSX
    : extension === ".jsx" ? ts.ScriptKind.JSX
    : extension === ".js" ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, kind);
  for (const diagnostic of source.parseDiagnostics) {
    const location = source.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    process.stderr.write(`${relative(root, path)}:${location.line + 1}:${location.character + 1} - ${message}\n`);
    errors++;
  }
}
if (errors > 0) {
  process.stderr.write(`ERROR: ${errors} problemas de sintaxis detectados en Global Stock. Corregir antes de abrir Expo Go.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`OK: sintaxis verificada en ${files.length} archivos TypeScript/JSX.\n`);
}
