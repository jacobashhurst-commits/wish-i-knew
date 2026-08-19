/**
 * Split anchor seed SQL into chunks for remote apply.
 * Usage: node scripts/split-anchor-seed.mjs supabase/seed_baby_weekly_anchors.sql 18
 */
import fs from "node:fs";
import path from "node:path";

const [fileArg, sizeArg] = process.argv.slice(2);
if (!fileArg) {
  console.error("Usage: node scripts/split-anchor-seed.mjs <seed.sql> [chunkSize=15]");
  process.exit(1);
}

const chunkSize = Number(sizeArg ?? 15);
const sql = fs.readFileSync(fileArg, "utf8");
const valuesMatch = sql.match(/\) values\s*([\s\S]*?)\s*on conflict/s);
if (!valuesMatch) throw new Error("Could not parse seed file");

const tuples = valuesMatch[1]
  .split(/\),\s*\n/)
  .map((t) => t.trim())
  .filter((t) => t.startsWith("("))
  .map((t, i, arr) => {
    const closed = t.endsWith(")") ? t : `${t})`;
    return i < arr.length - 1 ? `${closed},` : closed;
  });

const insertHeader = sql.slice(0, valuesMatch.index + ") values\n".length);
const footer = sql.slice(sql.indexOf("on conflict"));

const base = path.basename(fileArg, ".sql");
const outDir = path.join(path.dirname(fileArg), ".anchor-chunks");
fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < tuples.length; i += chunkSize) {
  const chunk = tuples.slice(i, i + chunkSize);
  const part = Math.floor(i / chunkSize) + 1;
  const out = path.join(outDir, `${base}.part${part}.sql`);
  fs.writeFileSync(out, `${insertHeader}${chunk.join("\n")}\n${footer}\n`);
  console.log(`Wrote ${out} (${chunk.length} cards)`);
}
