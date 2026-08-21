import type {
  AustralianState,
  ChildJourneyStatus,
  TimelineCard,
  UserCardState,
  UserCardStatus,
} from "@/types/content";

export type LookaheadDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OnboardingState = {
  childName: string;
  isBorn: boolean;
  birthDate: string;
  dueDate: string;
  state: AustralianState;
  firstChild: boolean;
  childcareIntention: "yes" | "no" | "unsure";
  lookaheadDay: LookaheadDay;
  lookaheadTime: string;
  weeklyEmailEnabled: boolean;
  timezone: string;
};

export type AppMode = "preview" | "authenticated";

export type AppInitialData = {
  mode: AppMode;
  requireAuth: boolean;
  userEmail: string | null;
  /** Auth user id when signed in; used to scope client welcome caches across wipe/re-invite. */
  authUserId: string | null;
  profileId: string | null;
  childId: string | null;
  childStatus: ChildJourneyStatus;
  form: OnboardingState;
  hasOnboarded: boolean;
  /** Pre-onboarding product welcome dismissed (profile-backed when signed in). */
  seenProductWelcome: boolean;
  /** First home-page tour dismissed (profile-backed when signed in). */
  seenHomeTour: boolean;
  cardStates: Record<string, UserCardState>;
  cards: TimelineCard[];
  isAdmin: boolean;
};

export const defaultOnboarding: OnboardingState = {
  childName: "",
  isBorn: true,
  birthDate: "",
  dueDate: "",
  state: "NSW",
  firstChild: true,
  childcareIntention: "unsure",
  lookaheadDay: "saturday",
  lookaheadTime: "08:00",
  weeklyEmailEnabled: true,
  timezone: "Australia/Sydney",
};

export function emptyCardStates(): Record<string, UserCardState> {
  return {};
}

export function cardStateFromRow(row: {
  card_id: string;
  status: UserCardStatus;
  snoozed_until: string | null;
}): UserCardState {
  return {
    card_id: row.card_id,
    status: row.status,
    snoozed_until: row.snoozed_until,
  };
}
