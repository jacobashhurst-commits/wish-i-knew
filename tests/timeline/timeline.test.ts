import { describe, expect, it } from "vitest";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import { buildTimeline } from "@/lib/timeline/matching";
import type { TimelineCard } from "@/types/content";

function card(overrides: Partial<TimelineCard>): TimelineCard {
  return {
    id: "card-1",
    slug: "sample-card",
    title: "Sample card",
    subtitle: null,
    card_type: "Heads Up",
    category: "Planning",
    life_stage: "Baby",
    start_age_days: 10,
    end_age_days: 20,
    pregnancy_week_start: null,
    pregnancy_week_end: null,
    priority: 0,
    time_critical: false,
    short_summary: "A useful short summary.",
    wish_i_knew: "A useful insight.",
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
    image_url: "/card-images/placeholders/sample.svg",
    thumbnail_url: null,
    hero_image_url: null,
    image_alt: "Sample illustration.",
    image_style: null,
    image_status: "approved",
    status: "published",
    review_due_date: null,
    last_reviewed_at: null,
    ...overrides,
  };
}

const bornProfile = {
  currentDate: "2026-06-15",
  birthDate: "2026-06-01",
  dueDate: null,
  isBorn: true,
  state: "NSW" as const,
  firstChild: true,
  childcareIntention: "unsure" as const,
};

describe("timeline dates", () => {
  it("calculates child age in days from birth date", () => {
    expect(calculateAgeInDays("2026-06-01", "2026-06-15")).toBe(14);
  });

  it("calculates pregnancy week from due date", () => {
    expect(calculatePregnancyWeek("2026-10-08", "2026-06-25")).toBe(26);
  });
});

describe("timeline matching", () => {
  it("matches published cards by age range", () => {
    const result = buildTimeline({
      profile: bornProfile,
      cards: [card({ start_age_days: 10, end_age_days: 20 })],
    });

    expect(result.currentCards).toHaveLength(1);
    expect(result.currentCards[0].card.slug).toBe("sample-card");
  });

  it("matches pregnancy cards by week range", () => {
    const result = buildTimeline({
      profile: {
        ...bornProfile,
        currentDate: "2026-06-25",
        isBorn: false,
        birthDate: null,
        dueDate: "2026-10-08",
      },
      cards: [
        card({
          start_age_days: null,
          end_age_days: null,
          pregnancy_week_start: 25,
          pregnancy_week_end: 27,
          conditions: { unborn_only: true },
        }),
      ],
    });

    expect(result.currentCards).toHaveLength(1);
  });

  it("finds coming soon cards inside the lookahead window", () => {
    const result = buildTimeline({
      profile: bornProfile,
      cards: [card({ start_age_days: 30, end_age_days: 45 })],
      comingSoonDays: 30,
    });

    expect(result.comingSoonCards).toHaveLength(1);
  });

  it("does not expose draft cards to users", () => {
    const result = buildTimeline({
      profile: bornProfile,
      cards: [card({ status: "draft" })],
    });

    expect(result.currentCards).toHaveLength(0);
  });

  it("keeps saved cards visible even outside the current age window", () => {
    const result = buildTimeline({
      profile: bornProfile,
      cards: [card({ id: "saved-card", start_age_days: 100, end_age_days: 120 })],
      userCardStates: [{ card_id: "saved-card", status: "saved", snoozed_until: null }],
    });

    expect(result.savedCards).toHaveLength(1);
  });

  it("returns snoozed cards due again", () => {
    const result = buildTimeline({
      profile: bornProfile,
      cards: [card({ id: "snoozed-card" })],
      userCardStates: [{ card_id: "snoozed-card", status: "snoozed", snoozed_until: "2026-06-15" }],
    });

    expect(result.snoozedCardsDue).toHaveLength(1);
  });

  it("hides snoozed cards until the snooze date", () => {
    const result = buildTimeline({
      profile: bornProfile,
      cards: [card({ id: "snoozed-card" })],
      userCardStates: [{ card_id: "snoozed-card", status: "snoozed", snoozed_until: "2026-06-22" }],
    });

    expect(result.currentCards).toHaveLength(0);
    expect(result.snoozedCardsDue).toHaveLength(0);
  });
});
