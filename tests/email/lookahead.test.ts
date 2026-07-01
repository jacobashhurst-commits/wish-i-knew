import { describe, expect, it } from "vitest";
import { composeDigest } from "@/lib/email/digest";
import { renderLookaheadEmail } from "@/lib/email/render-lookahead";
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
    overdueCards: [],
    savedCards: [],
    snoozedCardsDue: [],
  };
}

describe("composeDigest", () => {
  it("puts this-week cards before coming-soon and caps at four", () => {
    const result = emptyResult();
    result.currentCards = [
      matched({ id: "now-low", slug: "now-low", priority: 10 }),
      matched({ id: "now-high", slug: "now-high", priority: 90 }),
    ];
    result.comingSoonCards = [
      matched({ id: "soon-1", slug: "soon-1", priority: 50 }),
      matched({ id: "soon-2", slug: "soon-2", priority: 40 }),
      matched({ id: "soon-3", slug: "soon-3", priority: 30 }),
    ];

    const digest = composeDigest(result);

    expect(digest).toHaveLength(4);
    expect(digest.map((item) => item.card.id)).toEqual(["now-high", "now-low", "soon-1", "soon-2"]);
  });

  it("returns an empty digest when there is nothing at all", () => {
    expect(composeDigest(emptyResult())).toHaveLength(0);
  });
});

describe("renderLookaheadEmail", () => {
  it("renders full card content into the email body", () => {
    const message = renderLookaheadEmail({
      childName: "Pip",
      cards: [
        matched({
          title: "Two-month immunisations",
          wish_i_knew: "The appointment is quicker than the worry.",
          what_to_do_now: "Book the GP or council clinic.",
        }),
      ],
      siteUrl: "https://example.com",
      pauseUrl: "https://example.com/api/lookahead/pause?id=x&token=y",
    });

    expect(message.subject).toContain("Pip");
    expect(message.html).toContain("Two-month immunisations");
    expect(message.html).toContain("The appointment is quicker than the worry.");
    expect(message.html).toContain("Book the GP or council clinic.");
    expect(message.html).toContain("Pause these emails");
    expect(message.text).toContain("Two-month immunisations");
  });

  it("uses a calm subject for quiet weeks and escapes HTML", () => {
    const message = renderLookaheadEmail({
      childName: "Pip",
      cards: [matched({ card_type: "quiet_week", title: "A quiet <week>" })],
      siteUrl: "https://example.com",
      pauseUrl: "https://example.com/pause",
    });

    expect(message.subject).toContain("a quiet one");
    expect(message.html).toContain("A quiet &lt;week&gt;");
    expect(message.html).not.toContain("A quiet <week>");
  });
});
