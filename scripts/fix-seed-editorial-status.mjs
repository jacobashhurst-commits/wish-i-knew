/**
 * Sets in_review (no fake review dates) on seed cards that need editorial review.
 * Run: node scripts/fix-seed-editorial-status.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const seedFiles = [
  path.join(root, "supabase/seed.sql"),
  path.join(root, "supabase/seed_content_library.sql"),
  path.join(root, "supabase/seed_content_library_batch2.sql"),
];

const publishedFooter = /'approved',\s*'published',\s*current_date,\s*current_date \+ interval '12 months',\s*now\(\)/g;
const inReviewFooter = "'approved', 'in_review', null, null, null";

function stripSqlComments(block) {
  return block.replace(/--[^\n]*/g, "");
}

function needsEditorialReview(tupleText) {
  if (/review before production use/i.test(tupleText)) {
    return true;
  }

  const fiveFlagMatch = tupleText.match(
    /,\s*(true|false),\s*(true|false),\s*(true|false),\s*(true|false),\s*(true|false),\s*('|\{)/,
  );
  if (fiveFlagMatch) {
    return fiveFlagMatch.slice(1, 6).some((value) => value === "true");
  }

  const fourFlagMatch = tupleText.match(
    /,\s*(true|false),\s*(true|false),\s*(true|false),\s*(true|false),\s*('|\{)/,
  );
  if (fourFlagMatch) {
    return fourFlagMatch.slice(1, 5).some((value) => value === "true");
  }

  return false;
}

function fixValuesSection(valuesBlock) {
  const cleaned = stripSqlComments(valuesBlock);
  let changed = 0;
  let searchFrom = 0;
  let output = "";
  let depth = 0;
  let tupleStart = -1;

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];
    if (char === "(") {
      if (depth === 0) tupleStart = i;
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
      if (depth === 0 && tupleStart !== -1) {
        const cleanedTuple = cleaned.slice(tupleStart, i + 1);
        const originalStart = valuesBlock.indexOf(cleanedTuple, searchFrom);
        const originalTuple =
          originalStart === -1 ? cleanedTuple : valuesBlock.slice(originalStart, originalStart + cleanedTuple.length);

        let nextTuple = originalTuple;
        if (needsEditorialReview(cleanedTuple)) {
          const replaced = originalTuple.replace(publishedFooter, inReviewFooter);
          if (replaced !== originalTuple) {
            nextTuple = replaced;
            changed += 1;
          }
        }

        if (originalStart === -1) {
          output += nextTuple;
        } else {
          output += valuesBlock.slice(searchFrom, originalStart) + nextTuple;
          searchFrom = originalStart + originalTuple.length;
        }

        tupleStart = -1;
      }
    }
  }

  output += valuesBlock.slice(searchFrom);
  return { values: output, changed };
}

for (const file of seedFiles) {
  const sql = fs.readFileSync(file, "utf8");
  const valuesIndex = sql.indexOf(") values");
  if (valuesIndex === -1) {
    console.warn(`No values block in ${path.basename(file)}`);
    continue;
  }

  const valuesStart = valuesIndex + ") values".length;
  const conflictIndex = sql.indexOf("\non conflict", valuesStart);
  const valuesEnd = conflictIndex === -1 ? sql.length : conflictIndex;

  const { values, changed } = fixValuesSection(sql.slice(valuesStart, valuesEnd));
  const nextSql = `${sql.slice(0, valuesStart)}${values}${sql.slice(valuesEnd)}`;
  fs.writeFileSync(file, nextSql);
  console.log(`${path.basename(file)}: ${changed} cards set to in_review`);
}
