import { describe, expect, it } from "vitest";
import { canPublishCard, validateCardForPublish } from "@/lib/content/validation";
import type { TimelineCard } from "@/types/content";

function publishableCard(overrides: Partial<TimelineCard> = {}): TimelineCard {
  return {
    id: "card-1",
    slug: "publishable-card",
    title: "Publishable card",
    subtitle: null,
    card_type: "Tiny Gear Shift",
    category: "Feeding / Gear",
    life_stage: "Baby",
    start_age_days: 300,
    end_age_days: 360,
    pregnancy_week_start: null,
    pregnancy_week_end: null,
    priority: 0,
    short_summary: "Short and useful.",
    wish_i_knew: "The thing parents wish they knew.",
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
    image_url: "/card-images/placeholders/card.svg",
    thumbnail_url: null,
    hero_image_url: null,
    image_alt: "Warm illustration of a card subject.",
    image_style: "warm editorial illustration",
    image_status: "approved",
    status: "published",
    review_due_date: null,
    last_reviewed_at: null,
    ...overrides,
  };
}

describe("card publish validation", () => {
  it("allows complete cards with approved images", () => {
    expect(canPublishCard(publishableCard())).toBe(true);
  });

  it("requires image URL and alt text", () => {
    const errors = validateCardForPublish(
      publishableCard({
        image_url: null,
        image_alt: "",
      }),
    );

    expect(errors).toContain("Published cards require an image URL.");
    expect(errors).toContain("Published cards require image alt text.");
  });

  it("rejects cards with image status still needed", () => {
    const errors = validateCardForPublish(publishableCard({ image_status: "needed" }));

    expect(errors).toContain("Published cards require an approved, uploaded or published image status.");
  });

  it("requires sources and review dates for sensitive cards", () => {
    const errors = validateCardForPublish(
      publishableCard({
        medical_sensitivity: true,
        source_urls: [],
        source_notes: null,
        last_reviewed_at: null,
        review_due_date: null,
      }),
    );

    expect(errors).toContain("Sensitive cards require a source URL or source note.");
    expect(errors).toContain("Sensitive cards require a last reviewed date.");
    expect(errors).toContain("Sensitive cards require a review due date.");
  });
});
