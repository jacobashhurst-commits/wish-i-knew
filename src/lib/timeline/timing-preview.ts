import { isFunFillerCard, isWeeklyAnchorCard } from "@/lib/timeline/card-roles";
import type { TimelineCard } from "@/types/content";

export type TimingPreview = {
  windowLabel: string;
  firstAppears: string | null;
  repeatBehavior: string;
  notes: string[];
};

function formatAgeWindow(start: number, end: number): string {
  if (start === end) return `Day ${start}`;
  return `Day ${start}–${end}`;
}

function formatPregnancyWindow(start: number, end: number): string {
  if (start === end) return `Pregnancy week ${start}`;
  return `Pregnancy week ${start}–${end}`;
}

export function describeCardTiming(card: Pick<
  TimelineCard,
  | "card_type"
  | "start_age_days"
  | "end_age_days"
  | "pregnancy_week_start"
  | "pregnancy_week_end"
>): TimingPreview {
  const notes: string[] = [];

  if (isFunFillerCard(card)) {
    return {
      windowLabel: card.card_type === "quiet_week" ? "Quiet week (fun filler)" : "Fun filler",
      firstAppears: null,
      repeatBehavior: "Rotates in as a digest filler when the week is thin.",
      notes: ["Not tied to a timing window; picked by weekly rotation in the email digest."],
    };
  }

  if (isWeeklyAnchorCard(card)) {
    notes.push("Leads the weekly email when this week matches.");
    notes.push("Designed for a single week. Set pregnancy start and end to the same number.");
  }

  const hasAge =
    card.start_age_days !== null &&
    card.end_age_days !== null;
  const hasPregnancy =
    card.pregnancy_week_start !== null &&
    card.pregnancy_week_end !== null;

  const parts: string[] = [];
  const firstParts: string[] = [];

  if (hasPregnancy) {
    parts.push(formatPregnancyWindow(card.pregnancy_week_start!, card.pregnancy_week_end!));
    firstParts.push(`Pregnancy week ${card.pregnancy_week_start}`);
  }

  if (hasAge) {
    parts.push(formatAgeWindow(card.start_age_days!, card.end_age_days!));
    firstParts.push(`Day ${card.start_age_days}`);
  }

  if (parts.length === 0) {
    return {
      windowLabel: "No window set",
      firstAppears: null,
      repeatBehavior: "Add a pregnancy week or age window.",
      notes: ["Cards without a window only appear if they are quiet-week fillers."],
    };
  }

  let repeatBehavior: string;
  if (isWeeklyAnchorCard(card) || (hasPregnancy && card.pregnancy_week_start === card.pregnancy_week_end)) {
    repeatBehavior = "Shows once when that week arrives. Next week's anchor takes over.";
  } else {
    repeatBehavior = "Stays active every week in the window until the parent marks it as read or dismisses it.";
    notes.push("Can appear in multiple weekly emails until actioned.");
  }

  if (hasPregnancy && hasAge) {
    notes.push("Dual window: matches during pregnancy weeks OR baby age days, depending on journey stage.");
  }

  return {
    windowLabel: parts.join(" · "),
    firstAppears: firstParts.join(" · "),
    repeatBehavior,
    notes,
  };
}
