import { describe, expect, it } from "vitest";
import { composeDigest } from "@/lib/email/digest";
import { renderLookaheadEmail } from "@/lib/email/render-lookahead";
import { weeklyAnchorCardType } from "@/lib/timeline/card-roles";
import { describeCardTiming } from "@/lib/timeline/timing-preview";
import { dateForBabyWeek, dateForPregnancyWeek } from "@/lib/timeline/week-simulation";
import type { MatchedCard, TimelineResult } from "@/lib/timeline/types";
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

function matched(overrides: Partial<TimelineCard>): MatchedCard {
  return { card: card(overrides), reasons: [{ code: "test", message: "Test match." }] };
}

function emptyResult(): TimelineResult {
  return {
    currentCards: [],
    comingSoonCards: [],
    laterCards: [],
    recentPastCards: [],
    overdueCards: [],
    savedCards: [],
    snoozedCardsDue: [],
  };
}

describe("describeCardTiming", () => {
  it("describes a single-week anchor", () => {
    const preview = describeCardTiming({
      card_type: weeklyAnchorCardType,
      pregnancy_week_start: 28,
      pregnancy_week_end: 28,
      start_age_days: null,
      end_age_days: null,
    });

    expect(preview.firstAppears).toBe("Pregnancy week 28");
    expect(preview.repeatBehavior).toContain("once");
  });

  it("describes repeating reminders", () => {
    const preview = describeCardTiming({
      card_type: "Heads Up",
      pregnancy_week_start: 24,
      pregnancy_week_end: 40,
      start_age_days: null,
      end_age_days: null,
    });

    expect(preview.repeatBehavior).toContain("every week");
  });
});

describe("week simulation dates", () => {
  it("maps pregnancy week 24 to a date inside that week", () => {
    const date = dateForPregnancyWeek("2026-12-15", 24);
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("maps baby week 2 to days 7-13 range", () => {
    const date = dateForBabyWeek("2026-06-01", 2);
    expect(date).toMatch(/^2026-06-/);
  });
});

describe("composeDigest", () => {
  it("leads with the weekly anchor", () => {
    const result = emptyResult();
    result.currentCards = [
      matched({ id: "reminder", slug: "reminder", priority: 99 }),
      matched({
        id: "anchor",
        slug: "anchor",
        card_type: weeklyAnchorCardType,
        priority: 50,
        pregnancy_week_start: 28,
        pregnancy_week_end: 28,
      }),
    ];

    const digest = composeDigest(result);

    expect(digest[0].card.id).toBe("anchor");
  });

  it("skips previously emailed reminders but keeps anchor", () => {
    const result = emptyResult();
    result.currentCards = [
      matched({
        id: "anchor",
        slug: "anchor",
        card_type: weeklyAnchorCardType,
        priority: 100,
      }),
      matched({ id: "old", slug: "old-reminder", priority: 80 }),
      matched({ id: "new", slug: "new-reminder", priority: 70 }),
    ];

    const digest = composeDigest(result, {
      previouslyEmailedCardIds: new Set(["old"]),
    });

    expect(digest.map((item) => item.card.id)).toEqual(["anchor", "new"]);
  });

  it("adds fun filler when the week is thin", () => {
    const anchor = matched({
      id: "anchor",
      slug: "anchor",
      card_type: weeklyAnchorCardType,
      priority: 100,
    });
    const fun = card({
      id: "fun",
      slug: "quiet-week-walk",
      card_type: "quiet_week",
      priority: 10,
      start_age_days: null,
      end_age_days: null,
    });

    const result = emptyResult();
    result.currentCards = [anchor];

    const digest = composeDigest(result, {
      allCards: [anchor.card, fun],
      currentDate: "2026-08-01",
    });

    expect(digest).toHaveLength(2);
    expect(digest[1].card.card_type).toBe("quiet_week");
  });
});

describe("renderLookaheadEmail", () => {
  it("uses anchor title in subject when present", () => {
    const message = renderLookaheadEmail({
      childName: "Pip",
      weekContext: "Pregnancy week 28",
      cards: [
        matched({
          title: "Third trimester begins",
          card_type: weeklyAnchorCardType,
        }),
      ],
      siteUrl: "https://example.com",
      pauseUrl: "https://example.com/pause",
    });

    expect(message.subject).toContain("Third trimester begins");
    expect(message.subject).toContain("Pregnancy week 28");
  });

  it("escapes HTML in card titles", () => {
    const message = renderLookaheadEmail({
      childName: "Pip",
      cards: [matched({ card_type: "quiet_week", title: "A quiet <week>" })],
      siteUrl: "https://example.com",
      pauseUrl: "https://example.com/pause",
    });

    expect(message.html).toContain("A quiet &lt;week&gt;");
    expect(message.html).not.toContain("A quiet <week>");
  });
});
