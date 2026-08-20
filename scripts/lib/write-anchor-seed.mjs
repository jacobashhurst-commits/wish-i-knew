import fs from "node:fs";

const imageStyle = "cute 8-bit pixel art item";
const sourceNotes =
  "Suggestions only — not individual medical advice. Prefer your GP, midwife, child health nurse, or trusted sources (e.g. healthdirect, Pregnancy Care Guidelines, Infant Feeding Guidelines). Search when unsure.";

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

/**
 * @param {object} opts
 * @param {string} opts.outPath
 * @param {string} opts.headerComment
 * @param {Array<object>} opts.cards
 */
export function writeAnchorSeed({ outPath, headerComment, cards }) {
  const tuples = cards.map(
    (card) => `(
  ${sqlString(card.slug)},
  ${sqlString(card.title)},
  ${sqlString(card.subtitle)},
  ${sqlString(card.card_type)},
  ${sqlString(card.category)},
  ${sqlString(card.life_stage)},
  ${card.start_age_days ?? "null"},
  ${card.end_age_days ?? "null"},
  ${card.pregnancy_week_start ?? "null"},
  ${card.pregnancy_week_end ?? "null"},
  ${card.priority},
  false,
  ${sqlString(card.short_summary)},
  ${sqlString(card.wish_i_knew)},
  null,
  ${sqlString(card.what_to_do_now)},
  null,
  '[]'::jsonb,
  '[]'::jsonb,
  ${sqlString(sourceNotes)},
  false,
  false,
  false,
  false,
  false,
  ${sqlJson(card.conditions)},
  ${sqlString(card.illustration_prompt)},
  ${sqlString(card.image_url)},
  ${sqlString(card.image_alt)},
  ${sqlString(imageStyle)},
  ${sqlString(card.image_status)},
  ${sqlString(card.status)},
  null,
  null,
  null
)`,
  );

  const header = `-- ${headerComment}
-- Review and publish from /admin after adding pixel art.

insert into public.timeline_cards (
  slug, title, subtitle, card_type, category, life_stage,
  start_age_days, end_age_days, pregnancy_week_start, pregnancy_week_end,
  priority, time_critical, short_summary, wish_i_knew, why_it_matters,
  what_to_do_now, what_can_wait, checklist_items, source_urls, source_notes,
  medical_sensitivity, government_sensitivity, safety_sensitivity,
  allergy_sensitivity, feeding_sensitivity, conditions, illustration_prompt,
  image_url, image_alt, image_style, image_status, status,
  last_reviewed_at, review_due_date, published_at
) values
`;

  const footer = `
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  card_type = excluded.card_type,
  category = excluded.category,
  life_stage = excluded.life_stage,
  start_age_days = excluded.start_age_days,
  end_age_days = excluded.end_age_days,
  pregnancy_week_start = excluded.pregnancy_week_start,
  pregnancy_week_end = excluded.pregnancy_week_end,
  priority = excluded.priority,
  short_summary = excluded.short_summary,
  wish_i_knew = excluded.wish_i_knew,
  what_to_do_now = excluded.what_to_do_now,
  source_notes = excluded.source_notes,
  conditions = excluded.conditions,
  illustration_prompt = excluded.illustration_prompt,
  image_alt = excluded.image_alt,
  image_style = excluded.image_style,
  -- Keep existing image_url, image_status, status, published_at on re-seed.
  updated_at = now();
`;

  fs.writeFileSync(outPath, `${header}${tuples.join(",\n")}${footer}\n`);
}
