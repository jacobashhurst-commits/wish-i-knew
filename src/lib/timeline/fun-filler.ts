import { funFillerCardTypes, isLiveForUsers, quietWeekCardType } from "@/lib/timeline/card-roles";
import { toUtcDateOnly } from "@/lib/timeline/dates";
import type { MatchedCard } from "@/lib/timeline/types";
import type { TimelineCard } from "@/types/content";

function isFunPoolCard(card: TimelineCard): boolean {
  return (funFillerCardTypes as readonly string[]).includes(card.card_type) && isLiveForUsers(card.status);
}

/** Deterministic fun card for a calendar week, excluding slugs already picked. */
export function pickFunFillerCard(
  cards: TimelineCard[],
  currentDate: string,
  excludeSlugs: Set<string> = new Set(),
): MatchedCard | null {
  const pool = cards
    .filter(isFunPoolCard)
    .filter((card) => !excludeSlugs.has(card.slug))
    .sort((a, b) => a.slug.localeCompare(b.slug));

  if (pool.length === 0) return null;

  const weekIndex = Math.floor(toUtcDateOnly(currentDate).getTime() / (7 * 24 * 60 * 60 * 1000));
  const card = pool[weekIndex % pool.length];

  return {
    card,
    reasons: [
      {
        code: card.card_type === quietWeekCardType ? "quiet_week" : "fun_filler",
        message: "Added as a fun digest filler for a thin week.",
      },
    ],
  };
}
