import { isActiveReminderCard, isFunFillerCard, isWeeklyAnchorCard } from "@/lib/timeline/card-roles";
import { pickFunFillerCard } from "@/lib/timeline/fun-filler";
import type { MatchedCard, TimelineResult } from "@/lib/timeline/types";
import type { TimelineCard } from "@/types/content";

export const maxDigestCards = 4;

export type DigestOptions = {
  max?: number;
  /** Card IDs already sent in a previous weekly email — reminders are skipped, anchors are not. */
  previouslyEmailedCardIds?: Set<string>;
  /** Full published pool for fun-filler rotation when the week is thin. */
  allCards?: TimelineCard[];
  currentDate?: string;
};

function byPriority(a: MatchedCard, b: MatchedCard): number {
  return b.card.priority - a.card.priority;
}

function pickAnchor(cards: MatchedCard[]): MatchedCard | null {
  const anchors = cards.filter(({ card }) => isWeeklyAnchorCard(card)).sort(byPriority);
  return anchors[0] ?? null;
}

function pickReminders(
  buckets: MatchedCard[][],
  excludeIds: Set<string>,
  limit: number,
): MatchedCard[] {
  const picks: MatchedCard[] = [];
  const pickedIds = new Set<string>();

  for (const bucket of buckets) {
    for (const item of [...bucket].sort(byPriority)) {
      if (picks.length >= limit) return picks;
      if (!isActiveReminderCard(item.card)) continue;
      if (excludeIds.has(item.card.id) || pickedIds.has(item.card.id)) continue;

      picks.push(item);
      pickedIds.add(item.card.id);
    }
  }

  return picks;
}

/**
 * Weekly email selection:
 * 1. Anchor ("This week with bub") when the week matches
 * 2. Active reminders (not previously emailed)
 * 3. Fun filler when the week is thin (< 2 non-filler cards after anchor)
 */
export function composeDigest(timeline: TimelineResult, options: DigestOptions = {}): MatchedCard[] {
  const max = options.max ?? maxDigestCards;
  const previouslyEmailed = options.previouslyEmailedCardIds ?? new Set<string>();
  const picks: MatchedCard[] = [];
  const pickedIds = new Set<string>();

  const anchor = pickAnchor(timeline.currentCards);
  if (anchor) {
    picks.push(anchor);
    pickedIds.add(anchor.card.id);
  }

  const reminderBuckets = [timeline.currentCards, timeline.comingSoonCards];
  const reminders = pickReminders(reminderBuckets, previouslyEmailed, max - picks.length);

  for (const item of reminders) {
    if (picks.length >= max) break;
    if (pickedIds.has(item.card.id)) continue;
    picks.push(item);
    pickedIds.add(item.card.id);
  }

  const nonFillerCount = picks.filter(({ card }) => !isFunFillerCard(card)).length;
  const shouldAddFun = nonFillerCount < 2 && picks.length < max;

  if (shouldAddFun && options.allCards && options.currentDate) {
    const excludeSlugs = new Set(picks.map(({ card }) => card.slug));
    const filler = pickFunFillerCard(options.allCards, options.currentDate, excludeSlugs);

    if (filler && !pickedIds.has(filler.card.id)) {
      picks.push(filler);
    }
  }

  return picks.slice(0, max);
}

export function digestCardIds(digest: MatchedCard[]): string[] {
  return digest.map(({ card }) => card.id);
}
