import type {
  AustralianState,
  ChildcareIntention,
  ChildJourneyStatus,
  TimelineCard,
  UserCardState,
} from "@/types/content";

export type TimelineProfile = {
  currentDate: string;
  birthDate?: string | null;
  dueDate?: string | null;
  isBorn: boolean;
  state: AustralianState;
  firstChild: boolean;
  childcareIntention: ChildcareIntention;
  /** Journey off-ramp. Anything other than "active" suppresses all buckets. Defaults to "active". */
  journeyStatus?: ChildJourneyStatus;
};

export type TimelineEngineInput = {
  profile: TimelineProfile;
  cards: TimelineCard[];
  userCardStates?: UserCardState[];
  /** How far ahead (days) to surface coming-soon cards. Default 30. */
  comingSoonDays?: number;
  /** How far back (days) to surface recently-passed windows. Default 30. */
  recentPastDays?: number;
};

export type CardMatchReason = {
  code: string;
  message: string;
};

export type MatchedCard = {
  card: TimelineCard;
  reasons: CardMatchReason[];
};

export type TimelineResult = {
  currentCards: MatchedCard[];
  comingSoonCards: MatchedCard[];
  laterCards: MatchedCard[];
  /** Non-time-critical cards whose window ended within recentPastDays. */
  recentPastCards: MatchedCard[];
  overdueCards: MatchedCard[];
  savedCards: MatchedCard[];
  snoozedCardsDue: MatchedCard[];
};
