import type {
  AustralianState,
  ChildcareIntention,
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
};

export type TimelineEngineInput = {
  profile: TimelineProfile;
  cards: TimelineCard[];
  userCardStates?: UserCardState[];
  comingSoonDays?: number;
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
  overdueCards: MatchedCard[];
  savedCards: MatchedCard[];
  snoozedCardsDue: MatchedCard[];
};
