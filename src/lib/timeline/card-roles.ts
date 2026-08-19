import type { TimelineCard } from "@/types/content";

/** Weekly anchor — one per pregnancy/baby week, leads the digest email. */
export const weeklyAnchorCardType = "This week with bub";

export const quietWeekCardType = "quiet_week";

export const funFillerCardTypes = [quietWeekCardType, "Fun First"] as const;

export type FunFillerCardType = (typeof funFillerCardTypes)[number];

export function isWeeklyAnchorCard(card: Pick<TimelineCard, "card_type">): boolean {
  return card.card_type === weeklyAnchorCardType;
}

export function isFunFillerCard(card: Pick<TimelineCard, "card_type">): boolean {
  return (funFillerCardTypes as readonly string[]).includes(card.card_type);
}

/** Actionable cards that can repeat in-app until done/dismissed. */
export function isActiveReminderCard(card: Pick<TimelineCard, "card_type">): boolean {
  return !isWeeklyAnchorCard(card) && !isFunFillerCard(card);
}

export function isSingleWeekPregnancyWindow(card: Pick<TimelineCard, "pregnancy_week_start" | "pregnancy_week_end">): boolean {
  return (
    card.pregnancy_week_start !== null &&
    card.pregnancy_week_end !== null &&
    card.pregnancy_week_start === card.pregnancy_week_end
  );
}
