import type {
  AustralianState,
  CardStatus,
  ImageStatus,
  SuggestionStatus,
} from "@/types/content";

/** Full timeline_cards row as stored in Supabase (snake_case, all authoring fields). */
export type AdminCardRow = {
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
  emotional_tone: string | null;
  short_summary: string;
  wish_i_knew: string;
  why_it_matters: string | null;
  what_to_do_now: string | null;
  what_can_wait: string | null;
  checklist_items: string[];
  parent_script: string | null;
  partner_prompt: string | null;
  shopping_items: string[];
  source_urls: string[];
  source_notes: string | null;
  medical_sensitivity: boolean;
  government_sensitivity: boolean;
  safety_sensitivity: boolean;
  allergy_sensitivity: boolean;
  feeding_sensitivity: boolean;
  state_specific: boolean;
  states: AustralianState[];
  conditions: Record<string, unknown>;
  illustration_prompt: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  hero_image_url: string | null;
  image_alt: string | null;
  image_style: string | null;
  image_status: ImageStatus;
  status: CardStatus;
  version: number;
  review_due_date: string | null;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
};

/** Editable fields for create/update. Everything except server-managed columns. */
export type AdminCardInput = Omit<
  AdminCardRow,
  "id" | "version" | "created_at" | "updated_at" | "published_at" | "archived_at" | "status"
>;

export type AdminSuggestionRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  suggested_timing: string | null;
  status: SuggestionStatus;
  created_at: string;
  updated_at: string;
};

export const cardTypes = [
  "Big Milestone",
  "Heads Up",
  "Admin Trap",
  "Gear & Setup",
  "Health & Development",
  "Feeding",
  "Sleep",
  "Money & Entitlements",
  "Childcare & Work",
  "Just Reassurance",
  "quiet_week",
] as const;

export const cardStatuses: CardStatus[] = [
  "idea",
  "draft",
  "in_review",
  "approved",
  "published",
  "needs_review",
  "archived",
];

export const imageStatuses: ImageStatus[] = [
  "needed",
  "prompt_ready",
  "generated",
  "approved",
  "uploaded",
  "published",
];

export const lifeStages = [
  "Pregnancy",
  "Pregnancy or early baby",
  "Newborn (0–3 months)",
  "Baby (3–12 months)",
  "Toddler (12–24 months)",
  "Any",
] as const;
