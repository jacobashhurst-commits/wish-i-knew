import type { AustralianState, CardStatus, ImageStatus, TimelineCard } from "@/types/content";

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  return value.filter((item): item is string => typeof item === "string");
}

function parseStateArray(value: unknown): AustralianState[] | null {
  const items = parseStringArray(value);

  return items as AustralianState[] | null;
}

export type TimelineCardRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  card_type: string;
  category: string;
  life_stage: string;
  start_age_days: number | null;
  end_age_days: number | null;
  pregnancy_week_start: number | null;
  pregnancy_week_end: number | null;
  priority: number;
  time_critical?: boolean;
  short_summary: string;
  wish_i_knew: string;
  why_it_matters: string | null;
  what_to_do_now: string | null;
  what_can_wait: string | null;
  checklist_items: unknown;
  shopping_items: unknown;
  source_urls: unknown;
  source_notes: string | null;
  medical_sensitivity: boolean;
  government_sensitivity: boolean;
  safety_sensitivity: boolean;
  allergy_sensitivity: boolean;
  feeding_sensitivity: boolean;
  state_specific: boolean;
  states: unknown;
  conditions: unknown;
  illustration_prompt: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  hero_image_url: string | null;
  image_alt: string | null;
  image_style: string | null;
  image_status: ImageStatus;
  status: CardStatus;
  review_due_date: string | null;
  last_reviewed_at: string | null;
};

export function mapTimelineCard(row: TimelineCardRow): TimelineCard {
  return {
    id: row.id,
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
    priority: row.priority,
    time_critical: row.time_critical ?? false,
    short_summary: row.short_summary,
    wish_i_knew: row.wish_i_knew,
    why_it_matters: row.why_it_matters,
    what_to_do_now: row.what_to_do_now,
    what_can_wait: row.what_can_wait,
    checklist_items: parseStringArray(row.checklist_items),
    shopping_items: parseStringArray(row.shopping_items),
    source_urls: parseStringArray(row.source_urls),
    source_notes: row.source_notes,
    medical_sensitivity: row.medical_sensitivity,
    government_sensitivity: row.government_sensitivity,
    safety_sensitivity: row.safety_sensitivity,
    allergy_sensitivity: row.allergy_sensitivity,
    feeding_sensitivity: row.feeding_sensitivity,
    state_specific: row.state_specific,
    states: parseStateArray(row.states),
    conditions: (row.conditions as Record<string, unknown> | null) ?? null,
    illustration_prompt: row.illustration_prompt,
    image_url: row.image_url,
    thumbnail_url: row.thumbnail_url,
    hero_image_url: row.hero_image_url,
    image_alt: row.image_alt,
    image_style: row.image_style,
    image_status: row.image_status,
    status: row.status,
    review_due_date: row.review_due_date,
    last_reviewed_at: row.last_reviewed_at,
  };
}
