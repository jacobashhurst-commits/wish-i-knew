/**
 * Replaces em dashes ( - ) with " - " across project text files.
 * Run: node scripts/strip-em-dashes.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const skipDirs = new Set(["node_modules", ".next", ".git"]);
const extensions = new Set([
  ".ts",
  ".tsx",
  ".sql",
  ".md",
  ".json",
  ".mjs",
  ".html",
]);

let changed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!extensions.has(ext)) continue;
    const text = fs.readFileSync(full, "utf8");
    if (!text.includes(" - ")) continue;
    const next = text.replaceAll(" - ", " - ");
    fs.writeFileSync(full, next);
    changed += 1;
    console.log(path.relative(root, full));
  }
}

walk(root);
console.log(`Updated ${changed} files.`);
