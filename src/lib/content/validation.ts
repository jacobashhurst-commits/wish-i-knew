import type { ImageStatus, TimelineCard } from "@/types/content";

const publishableImageStatuses: ImageStatus[] = ["approved", "uploaded", "published"];

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function hasTiming(card: TimelineCard): boolean {
  const hasAgeWindow = card.start_age_days !== null && card.end_age_days !== null;
  const hasPregnancyWindow = card.pregnancy_week_start !== null && card.pregnancy_week_end !== null;

  return hasText(card.life_stage) || hasAgeWindow || hasPregnancyWindow;
}

function isSensitive(card: TimelineCard): boolean {
  return (
    card.medical_sensitivity ||
    card.government_sensitivity ||
    card.safety_sensitivity ||
    card.allergy_sensitivity ||
    card.feeding_sensitivity
  );
}

export function validateCardForPublish(card: TimelineCard): string[] {
  const errors: string[] = [];

  if (!hasText(card.title)) errors.push("Title is required.");
  if (!hasText(card.slug)) errors.push("Slug is required.");
  if (!hasText(card.card_type)) errors.push("Card type is required.");
  if (!hasText(card.category)) errors.push("Category is required.");
  if (!hasTiming(card)) errors.push("Life stage or timing window is required.");
  if (!hasText(card.short_summary)) errors.push("Short summary is required.");
  if (!hasText(card.wish_i_knew)) errors.push("Wish I Knew insight is required.");
  if (!hasText(card.image_url)) errors.push("Published cards require an image URL.");
  if (!hasText(card.image_alt)) errors.push("Published cards require image alt text.");

  if (!publishableImageStatuses.includes(card.image_status)) {
    errors.push("Published cards require an approved, uploaded or published image status.");
  }

  if (isSensitive(card)) {
    const hasSource = (card.source_urls?.length ?? 0) > 0 || hasText(card.source_notes);

    if (!hasSource) errors.push("Sensitive cards require a source URL or source note.");
    if (!hasText(card.last_reviewed_at)) errors.push("Sensitive cards require a last reviewed date.");
    if (!hasText(card.review_due_date)) errors.push("Sensitive cards require a review due date.");
  }

  return errors;
}

export function canPublishCard(card: TimelineCard): boolean {
  return validateCardForPublish(card).length === 0;
}
