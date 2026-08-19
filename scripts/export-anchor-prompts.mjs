/**
 * Export weekly anchor illustration prompts for Codex batch image generation.
 * Run: node scripts/export-anchor-prompts.mjs > docs/anchor-codex-prompts.txt
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const seeds = [
  path.join(root, "supabase", "seed_pregnancy_weekly_anchors.sql"),
  path.join(root, "supabase", "seed_baby_weekly_anchors.sql"),
];

const slugRe = /'((?:pregnancy|baby)-week-\d+)'[\s\S]*?'([^']*(?:''[^']*)*)',\s*\n\s*'\/card-images\/pixel\/(px-(?:pregnancy|baby)-week-\d+\.png)'/g;

const rows = [];
for (const file of seeds) {
  const sql = fs.readFileSync(file, "utf8");
  let m;
  while ((m = slugRe.exec(sql)) !== null) {
    const slug = m[1];
    const prompt = m[2].replace(/''/g, "'");
    const filename = m[3];
    rows.push({ slug, filename, prompt });
  }
}

rows.sort((a, b) => a.slug.localeCompare(b.slug, undefined, { numeric: true }));

console.log(`# Weekly anchor Codex prompts (${rows.length} cards)\n`);
console.log(`Save each PNG to public/card-images/pixel/{filename}\n`);

for (const { slug, filename, prompt } of rows) {
  console.log(`--- ${slug} → ${filename} ---`);
  console.log(prompt);
  console.log("");
}
