import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

function jsxAttributes(node) {
  return node.attributes.properties.filter(ts.isJsxAttribute);
}

function hasAttribute(attributes, name) {
  return attributes.some(
    (attribute) => attribute.name.getText() === name
  );
}

function literalAttributeValue(attributes, name) {
  const attribute = attributes.find(
    (candidate) => candidate.name.getText() === name
  );

  if (!attribute?.initializer || !ts.isStringLiteral(attribute.initializer)) {
    return null;
  }

  return attribute.initializer.text;
}

const files = await collect(componentsDir);
const issues = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const scriptKind = file.endsWith(".jsx")
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.TSX;
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  function report(node, message) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart(sourceFile)
    );
    issues.push(`${relative}:${line + 1}: ${message}`);
  }

  function visit(node) {
    if (
      ts.isJsxOpeningElement(node) ||
      ts.isJsxSelfClosingElement(node)
    ) {
      const tagName = node.tagName.getText(sourceFile);
      const attributes = jsxAttributes(node);

      if (tagName === "button") {
        const actionable =
          hasAttribute(attributes, "onClick") ||
          literalAttributeValue(attributes, "type") === "submit";

        if (!actionable) {
          report(
            node,
            "button without keyboard-compatible onClick or submit behavior"
          );
        }
      }

      if (["input", "select", "textarea"].includes(tagName)) {
        const controlled = hasAttribute(attributes, "value");
        const writable =
          hasAttribute(attributes, "onChange") ||
          hasAttribute(attributes, "readOnly");

        if (controlled && !writable) {
          report(node, "controlled field without onChange/readOnly");
        }
      }

      if (literalAttributeValue(attributes, "href") === "#") {
        report(node, 'placeholder href="#" found');
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

if (issues.length) {
  console.error("Global Stock UI contract audit failed:\n");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(`UI contract audit passed across ${files.length} component files.`);
