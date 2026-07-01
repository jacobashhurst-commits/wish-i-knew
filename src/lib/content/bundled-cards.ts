import type { TimelineCard } from "@/types/content";
import libraryCards from "@/lib/content/library-cards.json";
import { mapTimelineCard, type TimelineCardRow } from "@/lib/data/map-card";

/** Default ±30 day horizon for the timeline journey map. */
export const timelineHorizonDays = 30;

/** Published cards bundled from seed SQL  -  used when Supabase is empty or unavailable. */
export const bundledPublishedCards: TimelineCard[] = (libraryCards as TimelineCardRow[]).map(
  mapTimelineCard,
);

/** Merge Supabase rows over bundled cards by slug (DB wins). */
export function mergePublishedCards(
  fromDatabase: TimelineCard[],
  bundled = bundledPublishedCards,
): TimelineCard[] {
  const bySlug = new Map(bundled.map((card) => [card.slug, card]));

  for (const card of fromDatabase) {
    bySlug.set(card.slug, card);
  }

  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}
