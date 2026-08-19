import { describe, expect, it } from "vitest";
import { pickFunFillerCard } from "@/lib/timeline/fun-filler";
import type { TimelineCard } from "@/types/content";

function card(overrides: Partial<TimelineCard>): TimelineCard {
  return {
    id: overrides.id ?? "1",
    slug: overrides.slug ?? "test",
    title: "Test",
    subtitle: null,
    card_type: overrides.card_type ?? "quiet_week",
    category: "Test",
    life_stage: "Any",
    start_age_days: null,
    end_age_days: null,
    pregnancy_week_start: null,
    pregnancy_week_end: null,
    priority: 0,
    time_critical: false,
    short_summary: "Summary",
    wish_i_knew: "Insight",
    why_it_matters: null,
    what_to_do_now: null,
    what_can_wait: null,
    checklist_items: [],
    shopping_items: [],
    source_urls: [],
    source_notes: null,
    medical_sensitivity: false,
    government_sensitivity: false,
    safety_sensitivity: false,
    allergy_sensitivity: false,
    feeding_sensitivity: false,
    state_specific: false,
    states: [],
    conditions: {},
    illustration_prompt: null,
    image_url: null,
    thumbnail_url: null,
    hero_image_url: null,
    image_alt: null,
    image_style: null,
    image_status: "approved",
    status: "published",
    review_due_date: null,
    last_reviewed_at: null,
    ...overrides,
  };
}

describe("pickFunFillerCard", () => {
  it("returns a deterministic card for the same week", () => {
    const pool = [
      card({ id: "a", slug: "aaa", card_type: "quiet_week" }),
      card({ id: "b", slug: "bbb", card_type: "Fun First" }),
    ];

    const first = pickFunFillerCard(pool, "2026-08-01");
    const second = pickFunFillerCard(pool, "2026-08-01");

    expect(first?.card.slug).toBe(second?.card.slug);
  });

  it("excludes slugs already in the digest", () => {
    const pool = [card({ id: "a", slug: "aaa", card_type: "quiet_week" })];

    expect(pickFunFillerCard(pool, "2026-08-01", new Set(["aaa"]))).toBeNull();
  });
});
