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
};

export type AppMode = "preview" | "authenticated";

export type AppInitialData = {
  mode: AppMode;
  userEmail: string | null;
  profileId: string | null;
  childId: string | null;
  childStatus: ChildJourneyStatus;
  form: OnboardingState;
  hasOnboarded: boolean;
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
