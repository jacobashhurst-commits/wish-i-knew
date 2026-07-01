import type { MatchedCard, TimelineResult } from "@/lib/timeline/types";

export const maxDigestCards = 4;

/**
 * Picks up to four cards for the weekly email: this-week first (highest priority),
 * then coming-soon. The engine already substitutes a quiet-week card when the
 * week is empty, so an active journey always has something calm to say.
 */
export function composeDigest(timeline: TimelineResult, max = maxDigestCards): MatchedCard[] {
  const byPriority = (a: MatchedCard, b: MatchedCard) => b.card.priority - a.card.priority;

  const picks: MatchedCard[] = [...timeline.currentCards].sort(byPriority);

  for (const item of [...timeline.comingSoonCards].sort(byPriority)) {
    if (picks.length >= max) break;
    picks.push(item);
  }

  return picks.slice(0, max);
}
