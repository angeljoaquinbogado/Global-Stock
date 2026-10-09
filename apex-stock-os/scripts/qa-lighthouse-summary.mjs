import { readFileSync, appendFileSync } from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("Expected path to Lighthouse JSON report");
const report = JSON.parse(readFileSync(file, "utf8"));
const scores = Object.entries(report.categories || {}).map(([key, cat]) => ({
  key,
  label: cat.title || key,
  score: typeof cat.score === "number" ? Math.round(cat.score * 100) : null,
}));
if (!scores.length) throw new Error("No Lighthouse categories found");
const lines = [
  "## Global Stock public landing — Lighthouse lab (mobile)",
  "",
  "| Category | Score / 100 |",
  "| --- | ---: |",
  ...scores.map((s) => `| ${s.label} | ${s.score ?? "n/a"} |`),
  "",
  "Lab estimates from this run only; not real-user Core Web Vitals.",
  "",
  "### Failed or manual-review accessibility audits",
];
const issues = Object.values(report.audits || {})
  .filter((audit) =>
    audit?.details?.type === "table" &&
    (audit.score === 0 || audit.scoreDisplayMode === "manual") &&
    /accessib|contrast|label|aria|focus|button|link|image/i.test((audit.title || "") + " " + (audit.id || ""))
  )
  .slice(0, 15)
  .map((audit) => `- ${audit.title} (${audit.id})`);
lines.push(...(issues.length ? issues : ["No failed table-based accessibility audits in this run."]));
for (const id of ["aria-prohibited-attr", "color-contrast"]) {
  const audit = report.audits?.[id];
  const nodes = audit?.details?.items ?? [];
  if (nodes.length) {
    lines.push("", "### " + id + " — example affected elements");
    for (const row of nodes.slice(0, 12)) {
      const node = row.node || row;
      const selector = String(node.selector || node.target?.[0] || "unknown");
      const snippet = String(node.snippet || "").replace(/\\s+/g, " ").slice(0, 180);
      lines.push("- \`" + selector.replace(/\\`/g, "") + "\` — " + snippet.replace(/[|]/g, "/"));
    }
  }
}
lines.push("", "Full report saved to the Actions artifact.");
const out = lines.join("\n") + "\n";
console.log(out);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, out);
