import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const componentsDir = path.join(root, "components");

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(target)));
    else if (entry.isFile() && /\.(tsx|jsx)$/.test(entry.name)) files.push(target);
  }

  return files;
}

const files = await collect(componentsDir);
const issues = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");

  for (const match of source.matchAll(/<button\b[\s\S]*?>/g)) {
    const tag = match[0];
    const actionable = /onClick\s*=/.test(tag) || /type\s*=\s*["']submit["']/.test(tag);
    if (!actionable) {
      issues.push(`${relative}: button without onClick or submit behavior`);
    }
  }

  for (const match of source.matchAll(/<(input|select|textarea)\b[\s\S]*?>/g)) {
    const tag = match[0];
    const controlled = /value\s*=/.test(tag);
    const writable = /onChange\s*=/.test(tag) || /readOnly\b/.test(tag);
    if (controlled && !writable) {
      issues.push(`${relative}: controlled field without onChange/readOnly`);
    }
  }

  if (/href\s*=\s*["']#["']/.test(source)) {
    issues.push(`${relative}: placeholder href="#" found`);
  }
}

if (issues.length) {
  console.error("Global Stock UI contract audit failed:\n");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`UI contract audit passed across ${files.length} component files.`);
