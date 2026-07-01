import type { TimelineCard, UserCardState } from "@/types/content";
import { calculateAgeInDays, calculatePregnancyWeek, toUtcDateOnly } from "./dates";
import type {
  CardMatchReason,
  MatchedCard,
  TimelineEngineInput,
  TimelineProfile,
  TimelineResult,
} from "./types";

const defaultComingSoonDays = 30;
const maxOverdueCards = 3;

const quietWeekCardType = "quiet_week";

function isVisibleCard(card: TimelineCard): boolean {
  return card.status === "published";
}

function isQuietWeekCard(card: TimelineCard): boolean {
  return card.card_type === quietWeekCardType;
}

function hasUserHiddenCard(state?: UserCardState): boolean {
  return state?.status === "done" || state?.status === "dismissed" || state?.status === "not_relevant";
}

function isSnoozedForLater(state: UserCardState | undefined, currentDate: string): boolean {
  return state?.status === "snoozed" && !!state.snoozed_until && state.snoozed_until > currentDate;
}

function isSnoozedDue(state: UserCardState | undefined, currentDate: string): boolean {
  return state?.status === "snoozed" && !!state.snoozed_until && state.snoozed_until <= currentDate;
}

function matchesState(card: TimelineCard, profile: TimelineProfile): CardMatchReason | null {
  if (!card.state_specific || !card.states?.length) {
    return { code: "all_states", message: "Card is not state-specific." };
  }

  return card.states.includes(profile.state)
    ? { code: "state_match", message: `Card applies to ${profile.state}.` }
    : null;
}

function matchesSimpleConditions(
  card: TimelineCard,
  profile: TimelineProfile,
): CardMatchReason[] | null {
  const conditions = card.conditions ?? {};
  const reasons: CardMatchReason[] = [];

  if (conditions.first_child_only === true && !profile.firstChild) {
    return null;
  }

  if (conditions.childcare_yes === true && profile.childcareIntention !== "yes") {
    return null;
  }

  if (
    conditions.childcare_yes_or_unsure === true &&
    !["yes", "unsure"].includes(profile.childcareIntention)
  ) {
    return null;
  }

  if (conditions.born_only === true && !profile.isBorn) {
    return null;
  }

  if (conditions.unborn_only === true && profile.isBorn) {
    return null;
  }

  if (Object.keys(conditions).length > 0) {
    reasons.push({ code: "conditions_match", message: "Simple card conditions matched." });
  }

  return reasons;
}

function matchCurrentCard(card: TimelineCard, profile: TimelineProfile): MatchedCard | null {
  const stateReason = matchesState(card, profile);
  if (!stateReason) return null;

  const conditionReasons = matchesSimpleConditions(card, profile);
  if (!conditionReasons) return null;

  const reasons: CardMatchReason[] = [stateReason, ...conditionReasons];

  if (profile.isBorn && profile.birthDate && card.start_age_days !== null && card.end_age_days !== null) {
    const ageInDays = calculateAgeInDays(profile.birthDate, profile.currentDate);
    if (ageInDays >= card.start_age_days && ageInDays <= card.end_age_days) {
      return {
        card,
        reasons: [...reasons, { code: "age_window", message: `Child age ${ageInDays} days is in range.` }],
      };
    }
  }

  if (!profile.isBorn && profile.dueDate && card.pregnancy_week_start !== null && card.pregnancy_week_end !== null) {
    const pregnancyWeek = calculatePregnancyWeek(profile.dueDate, profile.currentDate);
    if (pregnancyWeek >= card.pregnancy_week_start && pregnancyWeek <= card.pregnancy_week_end) {
      return {
        card,
        reasons: [
          ...reasons,
          { code: "pregnancy_window", message: `Pregnancy week ${pregnancyWeek} is in range.` },
        ],
      };
    }
  }

  return null;
}

function matchComingSoonCard(
  card: TimelineCard,
  profile: TimelineProfile,
  comingSoonDays: number,
): MatchedCard | null {
  const stateReason = matchesState(card, profile);
  if (!stateReason) return null;

  const conditionReasons = matchesSimpleConditions(card, profile);
  if (!conditionReasons) return null;

  if (profile.isBorn && profile.birthDate && card.start_age_days !== null) {
    const ageInDays = calculateAgeInDays(profile.birthDate, profile.currentDate);
    const daysUntilStart = card.start_age_days - ageInDays;
    if (daysUntilStart > 0 && daysUntilStart <= comingSoonDays) {
      return {
        card,
        reasons: [
          stateReason,
          ...conditionReasons,
          { code: "coming_soon_age", message: `Card starts in ${daysUntilStart} days.` },
        ],
      };
    }
  }

  if (!profile.isBorn && profile.dueDate && card.pregnancy_week_start !== null) {
    const comingSoonWeeks = Math.max(1, Math.ceil(comingSoonDays / 7));
    const pregnancyWeek = calculatePregnancyWeek(profile.dueDate, profile.currentDate);
    const weeksUntilStart = card.pregnancy_week_start - pregnancyWeek;
    if (weeksUntilStart > 0 && weeksUntilStart <= comingSoonWeeks) {
      return {
        card,
        reasons: [
          stateReason,
          ...conditionReasons,
          {
            code: "coming_soon_pregnancy",
            message: `Card starts in about ${weeksUntilStart} weeks of pregnancy.`,
          },
        ],
      };
    }
  }

  return null;
}

function matchLaterCard(
  card: TimelineCard,
  profile: TimelineProfile,
  comingSoonDays: number,
): MatchedCard | null {
  const stateReason = matchesState(card, profile);
  if (!stateReason) return null;

  const conditionReasons = matchesSimpleConditions(card, profile);
  if (!conditionReasons) return null;

  if (profile.isBorn && profile.birthDate && card.start_age_days !== null) {
    const ageInDays = calculateAgeInDays(profile.birthDate, profile.currentDate);
    const daysUntilStart = card.start_age_days - ageInDays;
    if (daysUntilStart > comingSoonDays) {
      return {
        card,
        reasons: [
          stateReason,
          ...conditionReasons,
          { code: "later_age", message: `Card starts in ${daysUntilStart} days.` },
        ],
      };
    }
  }

  if (!profile.isBorn && profile.dueDate && card.pregnancy_week_start !== null) {
    const comingSoonWeeks = Math.max(1, Math.ceil(comingSoonDays / 7));
    const pregnancyWeek = calculatePregnancyWeek(profile.dueDate, profile.currentDate);
    const weeksUntilStart = card.pregnancy_week_start - pregnancyWeek;
    if (weeksUntilStart > comingSoonWeeks) {
      return {
        card,
        reasons: [
          stateReason,
          ...conditionReasons,
          { code: "later_pregnancy", message: `Card starts in about ${weeksUntilStart} weeks.` },
        ],
      };
    }
  }

  return null;
}

function matchOverdueCard(card: TimelineCard, profile: TimelineProfile): MatchedCard | null {
  // Only explicitly time-critical cards may nag; everything else quietly drops away.
  if (!card.time_critical) {
    return null;
  }

  if (!profile.isBorn || !profile.birthDate || card.end_age_days === null) {
    return null;
  }

  const ageInDays = calculateAgeInDays(profile.birthDate, profile.currentDate);
  if (ageInDays <= card.end_age_days) {
    return null;
  }

  const currentMatch = matchCurrentCard(card, profile);
  if (currentMatch) {
    return null;
  }

  return {
    card,
    reasons: [{ code: "overdue_age", message: `Card window ended ${ageInDays - card.end_age_days} days ago.` }],
  };
}

export function emptyTimeline(): TimelineResult {
  return {
    currentCards: [],
    comingSoonCards: [],
    laterCards: [],
    overdueCards: [],
    savedCards: [],
    snoozedCardsDue: [],
  };
}

function pickQuietWeekCard(cards: TimelineCard[], currentDate: string): MatchedCard | null {
  const pool = cards
    .filter(isQuietWeekCard)
    .sort((a, b) => a.slug.localeCompare(b.slug));

  if (pool.length === 0) return null;

  // Deterministic weekly rotation so the same card shows all week, then changes.
  const weekIndex = Math.floor(toUtcDateOnly(currentDate).getTime() / (7 * 24 * 60 * 60 * 1000));
  const card = pool[weekIndex % pool.length];

  return {
    card,
    reasons: [
      {
        code: "quiet_week",
        message: "Nothing scheduled this week, so here is a gentle quiet-week card.",
      },
    ],
  };
}

export function buildTimeline(input: TimelineEngineInput): TimelineResult {
  if ((input.profile.journeyStatus ?? "active") !== "active") {
    return emptyTimeline();
  }

  const comingSoonDays = input.comingSoonDays ?? defaultComingSoonDays;
  const statesByCard = new Map(input.userCardStates?.map((state) => [state.card_id, state]));
  const visibleCards = input.cards.filter(isVisibleCard);
  const availableCards = visibleCards.filter((card) => {
    const state = statesByCard.get(card.id);

    return (
      !isQuietWeekCard(card) &&
      !hasUserHiddenCard(state) &&
      !isSnoozedForLater(state, input.profile.currentDate)
    );
  });

  const currentCards = availableCards
    .map((card) => matchCurrentCard(card, input.profile))
    .filter((card): card is MatchedCard => Boolean(card));

  const comingSoonCards = availableCards
    .map((card) => matchComingSoonCard(card, input.profile, comingSoonDays))
    .filter((card): card is MatchedCard => Boolean(card));

  const laterCards = availableCards
    .map((card) => matchLaterCard(card, input.profile, comingSoonDays))
    .filter((card): card is MatchedCard => Boolean(card));

  const overdueCards = availableCards
    .map((card) => matchOverdueCard(card, input.profile))
    .filter((card): card is MatchedCard => Boolean(card))
    .sort((a, b) => b.card.priority - a.card.priority)
    .slice(0, maxOverdueCards);

  const savedCards = visibleCards
    .filter((card) => statesByCard.get(card.id)?.status === "saved")
    .map((card) => ({ card, reasons: [{ code: "saved", message: "User saved this card." }] }));

  const snoozedCardsDue = visibleCards
    .filter((card) => isSnoozedDue(statesByCard.get(card.id), input.profile.currentDate))
    .map((card) => ({ card, reasons: [{ code: "snooze_due", message: "Snoozed card is due again." }] }));

  // Quiet-week fallback: only when nothing real is current, never alongside real cards.
  if (currentCards.length === 0) {
    const quietWeekCard = pickQuietWeekCard(visibleCards, input.profile.currentDate);
    if (quietWeekCard) {
      currentCards.push(quietWeekCard);
    }
  }

  return {
    currentCards,
    comingSoonCards,
    laterCards,
    overdueCards,
    savedCards,
    snoozedCardsDue,
  };
}
