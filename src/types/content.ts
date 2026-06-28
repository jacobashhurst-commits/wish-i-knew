export type UserRole = "user" | "admin";

export type AustralianState =
  | "ACT"
  | "NSW"
  | "NT"
  | "QLD"
  | "SA"
  | "TAS"
  | "VIC"
  | "WA";

export type ChildcareIntention = "yes" | "no" | "unsure";

export type CardStatus =
  | "idea"
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "needs_review"
  | "archived";

export type ImageStatus =
  | "needed"
  | "prompt_ready"
  | "generated"
  | "approved"
  | "uploaded"
  | "published";

export type UserCardStatus =
  | "unseen"
  | "viewed"
  | "saved"
  | "done"
  | "snoozed"
  | "dismissed"
  | "not_relevant";

export type ChildJourneyStatus = "active" | "paused" | "ended";

export type SuggestionStatus = "new" | "reviewed" | "accepted" | "declined";

export type TimelineCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  card_type: string;
  category: string;
  life_stage: string;
  start_age_days: number | null;
  end_age_days: number | null;
  pregnancy_week_start: number | null;
  pregnancy_week_end: number | null;
  priority: number;
  time_critical: boolean;
  short_summary: string;
  wish_i_knew: string;
  why_it_matters: string | null;
  what_to_do_now: string | null;
  what_can_wait: string | null;
  checklist_items: string[] | null;
  shopping_items: string[] | null;
  source_urls: string[] | null;
  source_notes: string | null;
  medical_sensitivity: boolean;
  government_sensitivity: boolean;
  safety_sensitivity: boolean;
  allergy_sensitivity: boolean;
  feeding_sensitivity: boolean;
  state_specific: boolean;
  states: AustralianState[] | null;
  conditions: Record<string, unknown> | null;
  illustration_prompt: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  hero_image_url: string | null;
  image_alt: string | null;
  image_style: string | null;
  image_status: ImageStatus;
  status: CardStatus;
  review_due_date: string | null;
  last_reviewed_at: string | null;
};

export type UserCardState = {
  card_id: string;
  status: UserCardStatus;
  snoozed_until: string | null;
};

export type CardSuggestion = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  suggested_timing: string | null;
  status: SuggestionStatus;
  created_at: string;
};
