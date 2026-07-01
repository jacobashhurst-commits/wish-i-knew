/**
 * Builds src/lib/content/library-cards.json from Supabase seed SQL files.
 * Run: node scripts/export-card-library.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const seedFiles = [
  path.join(root, "supabase/seed.sql"),
  path.join(root, "supabase/seed_content_library.sql"),
];

const insertColumns = [
  "slug",
  "title",
  "subtitle",
  "card_type",
  "category",
  "life_stage",
  "start_age_days",
  "end_age_days",
  "pregnancy_week_start",
  "pregnancy_week_end",
  "priority",
  "time_critical",
  "short_summary",
  "wish_i_knew",
  "why_it_matters",
  "what_to_do_now",
  "what_can_wait",
  "checklist_items",
  "source_urls",
  "source_notes",
  "medical_sensitivity",
  "government_sensitivity",
  "safety_sensitivity",
  "allergy_sensitivity",
  "feeding_sensitivity",
  "conditions",
  "illustration_prompt",
  "image_url",
  "image_alt",
  "image_style",
  "image_status",
  "status",
  "last_reviewed_at",
  "review_due_date",
  "published_at",
];

function tokenizeTuple(inner) {
  const tokens = [];
  let i = 0;

  while (i < inner.length) {
    while (i < inner.length && /\s|,/.test(inner[i])) i += 1;
    if (i >= inner.length) break;

    if (inner.startsWith("null", i)) {
      tokens.push(null);
      i += 4;
      continue;
    }

    if (inner.startsWith("true", i)) {
      tokens.push(true);
      i += 4;
      continue;
    }

    if (inner.startsWith("false", i)) {
      tokens.push(false);
      i += 5;
      continue;
    }

    if (inner.startsWith("current_date", i)) {
      tokens.push(new Date().toISOString().slice(0, 10));
      i += "current_date".length;
      if (inner.startsWith(" + interval", i)) {
        i = inner.indexOf("'", i);
        const end = inner.indexOf("'", i + 1);
        tokens.push(inner.slice(i + 1, end));
        i = end + 1;
      }
      continue;
    }

    if (inner.startsWith("now()", i)) {
      tokens.push(new Date().toISOString());
      i += 5;
      continue;
    }

    if (inner[i] === "'") {
      let value = "";
      i += 1;
      while (i < inner.length) {
        if (inner[i] === "'") {
          if (inner[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        value += inner[i];
        i += 1;
      }

      if (inner.slice(i, i + 7) === "::jsonb") {
        try {
          tokens.push(JSON.parse(value));
        } catch {
          tokens.push(value);
        }
        i += 7;
      } else {
        tokens.push(value);
      }
      continue;
    }

    const numMatch = inner.slice(i).match(/^-?\d+/);
    if (numMatch) {
      tokens.push(Number(numMatch[0]));
      i += numMatch[0].length;
      continue;
    }

    throw new Error(`Unexpected token near: ${inner.slice(i, i + 40)}`);
  }

  return tokens;
}

function extractTuples(sql) {
  const valuesIndex = sql.indexOf(") values");
  if (valuesIndex === -1) return [];

  const body = sql.slice(valuesIndex + ") values".length);
  const endIndex = body.indexOf("\non conflict");
  const valuesBlock = endIndex === -1 ? body : body.slice(0, endIndex);

  const tuples = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < valuesBlock.length; i += 1) {
    const char = valuesBlock[i];
    if (char === "(") {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        tuples.push(valuesBlock.slice(start, i));
        start = -1;
      }
    }
  }

  return tuples;
}

function slugToId(slug) {
  return createHash("sha256").update(slug).digest("hex").slice(0, 32);
}

function rowToCard(tokens) {
  const row = {};
  insertColumns.forEach((key, index) => {
    row[key] = tokens[index];
  });

  return {
    id: slugToId(row.slug),
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    card_type: row.card_type,
    category: row.category,
    life_stage: row.life_stage,
    start_age_days: row.start_age_days,
    end_age_days: row.end_age_days,
    pregnancy_week_start: row.pregnancy_week_start,
    pregnancy_week_end: row.pregnancy_week_end,
    priority: row.priority ?? 0,
    time_critical: row.time_critical ?? false,
    short_summary: row.short_summary,
    wish_i_knew: row.wish_i_knew,
    why_it_matters: row.why_it_matters,
    what_to_do_now: row.what_to_do_now,
    what_can_wait: row.what_can_wait,
    checklist_items: Array.isArray(row.checklist_items) ? row.checklist_items : [],
    shopping_items: [],
    source_urls: Array.isArray(row.source_urls) ? row.source_urls : [],
    source_notes: row.source_notes,
    medical_sensitivity: row.medical_sensitivity ?? false,
    government_sensitivity: row.government_sensitivity ?? false,
    safety_sensitivity: row.safety_sensitivity ?? false,
    allergy_sensitivity: row.allergy_sensitivity ?? false,
    feeding_sensitivity: row.feeding_sensitivity ?? false,
    state_specific: false,
    states: [],
    conditions: typeof row.conditions === "object" && row.conditions ? row.conditions : {},
    illustration_prompt: row.illustration_prompt,
    image_url: row.image_url,
    thumbnail_url: null,
    hero_image_url: null,
    image_alt: row.image_alt,
    image_style: row.image_style,
    image_status: row.image_status ?? "approved",
    status: row.status ?? "published",
    review_due_date: typeof row.review_due_date === "string" ? row.review_due_date : null,
    last_reviewed_at: typeof row.last_reviewed_at === "string" ? row.last_reviewed_at : null,
  };
}

const bySlug = new Map();

for (const file of seedFiles) {
  const sql = fs.readFileSync(file, "utf8");
  const hasTimeCritical = sql.includes("time_critical,");

  for (const tuple of extractTuples(sql)) {
    try {
      const tokens = tokenizeTuple(tuple);
      if (!hasTimeCritical && tokens.length === insertColumns.length - 1) {
        // seed.sql predates time_critical column in values  -  insert false after priority (index 10)
        tokens.splice(11, 0, false);
      }
      const card = rowToCard(tokens);
      bySlug.set(card.slug, card);
    } catch (error) {
      console.warn(`Skipping tuple in ${path.basename(file)}: ${error.message}`);
    }
  }
}

const cards = [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
const outPath = path.join(root, "src/lib/content/library-cards.json");

fs.writeFileSync(outPath, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Wrote ${cards.length} cards to ${outPath}`);
