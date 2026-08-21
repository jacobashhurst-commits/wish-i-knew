import { mergePublishedCards } from "@/lib/content/bundled-cards";
import { mapTimelineCard, type TimelineCardRow } from "@/lib/data/map-card";
import { isAuthRequired } from "@/lib/launch/config";
import { lookaheadTimeForUi } from "@/lib/launch/timezone";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { AppInitialData, LookaheadDay, OnboardingState } from "@/types/app";
import { cardStateFromRow, defaultOnboarding, emptyCardStates } from "@/types/app";
import type { UserCardStatus, ChildJourneyStatus } from "@/types/content";

function lookaheadDayFromDb(value: string | null | undefined): LookaheadDay {
  const days: LookaheadDay[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  if (value && days.includes(value as LookaheadDay)) {
    return value as LookaheadDay;
  }

  return "saturday";
}

function previewInitialData(): AppInitialData {
  return {
    mode: "preview",
    requireAuth: isAuthRequired(),
    userEmail: null,
    authUserId: null,
    profileId: null,
    childId: null,
    childStatus: "active",
    form: defaultOnboarding,
    hasOnboarded: false,
    seenProductWelcome: false,
    seenHomeTour: false,
    cardStates: emptyCardStates(),
    cards: mergePublishedCards([]),
    isAdmin: false,
  };
}

export async function fetchPublishedCards(): Promise<TimelineCardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timeline_cards")
    .select("*")
    .in("status", ["approved", "published"])
    .order("priority", { ascending: false });

  if (error) {
    throw new Error(`Failed to load live cards: ${error.message}`);
  }

  return (data ?? []) as TimelineCardRow[];
}

export async function loadAppInitialData(): Promise<AppInitialData> {
  if (!isSupabaseConfigured()) {
    return previewInitialData();
  }

  try {
    return await loadAuthenticatedAppData();
  } catch {
    return {
      ...previewInitialData(),
      requireAuth: isAuthRequired(),
      cards: [],
    };
  }
}

async function loadAuthenticatedAppData(): Promise<AppInitialData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cards: TimelineCardRow[] = [];

  try {
    cards = await fetchPublishedCards();
  } catch {
    cards = [];
  }

  const mappedCards = cards.map(mapTimelineCard);
  const requireAuth = isAuthRequired();

  if (!user) {
    // Local preview (auth not required): merge bundle so devs see the full library without
    // every card published in Supabase. Production sign-in path uses DB published rows only.
    const cardsForView = requireAuth ? mappedCards : mergePublishedCards(mappedCards);

    return {
      ...previewInitialData(),
      requireAuth,
      cards: cardsForView,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, state, seen_product_welcome, seen_home_tour")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Failed to load profile: ${profileError.message}`);
  }

  if (!profile) {
    return {
      mode: "authenticated",
      requireAuth,
      userEmail: user.email ?? null,
      authUserId: user.id,
      profileId: null,
      childId: null,
      childStatus: "active",
      form: defaultOnboarding,
      hasOnboarded: false,
      seenProductWelcome: false,
      seenHomeTour: false,
      cardStates: emptyCardStates(),
      cards: mappedCards,
      isAdmin: false,
    };
  }

  const seenProductWelcome = Boolean(profile.seen_product_welcome);
  const seenHomeTour = Boolean(profile.seen_home_tour);

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (childError) {
    throw new Error(`Failed to load child: ${childError.message}`);
  }

  if (!child) {
    return {
      mode: "authenticated",
      requireAuth,
      userEmail: user.email ?? profile.email,
      authUserId: user.id,
      profileId: profile.id,
      childId: null,
      childStatus: "active",
      form: {
        ...defaultOnboarding,
        state: profile.state ?? defaultOnboarding.state,
      },
      hasOnboarded: false,
      seenProductWelcome,
      seenHomeTour,
      cardStates: emptyCardStates(),
      cards: mappedCards,
      isAdmin: profile.role === "admin",
    };
  }

  const { data: preferences } = await supabase
    .from("weekly_lookahead_preferences")
    .select("day_of_week, time_of_day, timezone, delivery_channel, enabled")
    .eq("user_id", profile.id)
    .eq("child_id", child.id)
    .maybeSingle();

  const { data: cardStateRows, error: cardStateError } = await supabase
    .from("user_card_states")
    .select("card_id, status, snoozed_until")
    .eq("user_id", profile.id)
    .eq("child_id", child.id);

  if (cardStateError) {
    throw new Error(`Failed to load card states: ${cardStateError.message}`);
  }

  const cardStates = emptyCardStates();

  for (const row of cardStateRows ?? []) {
    cardStates[row.card_id] = cardStateFromRow({
      card_id: row.card_id,
      status: row.status as UserCardStatus,
      snoozed_until: row.snoozed_until,
    });
  }

  const weeklyEmailEnabled =
    preferences?.delivery_channel === "email" && (preferences?.enabled ?? true);

  const form: OnboardingState = {
    childName: child.nickname,
    isBorn: child.is_born,
    birthDate: child.birth_date ?? "",
    dueDate: child.due_date ?? "",
    state: child.state,
    firstChild: child.first_child,
    childcareIntention: child.childcare_intention,
    lookaheadDay: lookaheadDayFromDb(preferences?.day_of_week),
    lookaheadTime: lookaheadTimeForUi(preferences?.time_of_day),
    weeklyEmailEnabled,
    timezone: preferences?.timezone ?? "Australia/Sydney",
  };

  return {
    mode: "authenticated",
    requireAuth,
    userEmail: user.email ?? profile.email,
    authUserId: user.id,
    profileId: profile.id,
    childId: child.id,
    childStatus: (child.status ?? "active") as ChildJourneyStatus,
    form,
    hasOnboarded: true,
    seenProductWelcome,
    seenHomeTour,
    cardStates,
    cards: mappedCards,
    isAdmin: profile.role === "admin",
  };
}
