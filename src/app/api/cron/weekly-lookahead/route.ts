import { NextResponse } from "next/server";
import { composeDigest, digestCardIds } from "@/lib/email/digest";
import { buildWeekContextLabel, renderLookaheadEmail } from "@/lib/email/render-lookahead";
import { sendEmail } from "@/lib/email/resend";
import { signPauseToken } from "@/lib/email/tokens";
import { mapTimelineCard, type TimelineCardRow } from "@/lib/data/map-card";
import { createServiceClient } from "@/lib/supabase/service";
import { getSiteUrl } from "@/lib/supabase/config";
import { buildTimeline } from "@/lib/timeline/matching";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import type { UserCardState } from "@/types/content";

export const dynamic = "force-dynamic";
// Vercel Hobby caps function duration well below Pro's 300s; 60s is the safe ceiling.
export const maxDuration = 60;

type PreferenceRow = {
  id: string;
  user_id: string;
  child_id: string;
  day_of_week: string;
  time_of_day: string;
  timezone: string;
  delivery_channel: string;
  enabled: boolean;
  profiles: { email: string } | null;
  children: {
    id: string;
    nickname: string;
    birth_date: string | null;
    due_date: string | null;
    is_born: boolean;
    state: string;
    first_child: boolean;
    childcare_intention: string;
    status: string;
  } | null;
};

/** Local weekday name (lowercase) and hour for "now" in the preference's timezone. */
function localNow(timezone: string): { weekday: string; hour: number; date: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    weekday: "long",
    hour: "numeric",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );

  return {
    weekday: (parts.weekday ?? "").toLowerCase(),
    hour: Number(parts.hour ?? "-1") % 24,
    date: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const supabase = createServiceClient();

  const { data: preferences, error: prefError } = await supabase
    .from("weekly_lookahead_preferences")
    .select(
      "id, user_id, child_id, day_of_week, time_of_day, timezone, delivery_channel, enabled, profiles(email), children(id, nickname, birth_date, due_date, is_born, state, first_child, childcare_intention, status)",
    )
    .eq("enabled", true)
    .eq("delivery_channel", "email");

  if (prefError) {
    return NextResponse.json({ error: prefError.message }, { status: 500 });
  }

  const { data: cardRows, error: cardsError } = await supabase
    .from("timeline_cards")
    .select("*")
    .in("status", ["approved", "published"]);

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  const cards = ((cardRows ?? []) as TimelineCardRow[]).map(mapTimelineCard);
  const results: { preference: string; outcome: string }[] = [];
  let sent = 0;

  for (const pref of (preferences ?? []) as unknown as PreferenceRow[]) {
    const child = pref.children;
    const email = pref.profiles?.email;

    if (!child || !email) {
      results.push({ preference: pref.id, outcome: "skipped: missing child or email" });
      continue;
    }

    if (child.status !== "active") {
      results.push({ preference: pref.id, outcome: "skipped: journey not active" });
      continue;
    }

    const now = localNow(pref.timezone || "Australia/Sydney");

    // Match the user's chosen weekday in their timezone. Preferred time_of_day is
    // stored end-to-end (onboarding/settings → weekly_lookahead_preferences) and
    // surfaced in the app UI; Vercel Hobby only allows one daily cron run, so we
    // cannot reliably honor exact local hour yet without an hourly scheduler.
    if (now.weekday !== pref.day_of_week) {
      results.push({ preference: pref.id, outcome: "skipped: not their chosen day" });
      continue;
    }

    const preferredHour = Number(String(pref.time_of_day).slice(0, 2));
    // Soft signal for ops: preferred hour is recorded even though this run is daily.
    const scheduleNote =
      Number.isFinite(preferredHour) && preferredHour !== now.hour
        ? ` (preferred ${String(preferredHour).padStart(2, "0")}:00 local; cron hour ${String(now.hour).padStart(2, "0")})`
        : "";

    const { error: claimError } = await supabase.from("reminders").insert({
      user_id: pref.user_id,
      child_id: pref.child_id,
      reminder_date: now.date,
      reminder_type: "weekly_lookahead",
      status: "pending",
    });

    if (claimError) {
      if (claimError.code === "23505") {
        results.push({ preference: pref.id, outcome: "skipped: already sent today" });
        continue;
      }

      results.push({ preference: pref.id, outcome: `error: ${claimError.message}` });
      continue;
    }

    const { data: stateRows } = await supabase
      .from("user_card_states")
      .select("card_id, status, snoozed_until")
      .eq("user_id", pref.user_id)
      .eq("child_id", pref.child_id);

    const { data: priorSendRows } = await supabase
      .from("digest_card_sends")
      .select("card_id")
      .eq("user_id", pref.user_id)
      .eq("child_id", pref.child_id);

    const previouslyEmailedCardIds = new Set((priorSendRows ?? []).map((row) => row.card_id as string));

    const timeline = buildTimeline({
      profile: {
        currentDate: now.date,
        birthDate: child.is_born ? child.birth_date : null,
        dueDate: child.is_born ? null : child.due_date,
        isBorn: child.is_born,
        state: child.state as never,
        firstChild: child.first_child,
        childcareIntention: child.childcare_intention as never,
        journeyStatus: "active",
      },
      cards,
      userCardStates: (stateRows ?? []) as UserCardState[],
      comingSoonDays: 45,
    });

    const digest = composeDigest(timeline, {
      previouslyEmailedCardIds,
      allCards: cards,
      currentDate: now.date,
    });

    if (digest.length === 0) {
      // Nothing to send today - keep the claim so we do not retry every hour.
      await supabase
        .from("reminders")
        .update({ status: "dismissed" })
        .eq("user_id", pref.user_id)
        .eq("child_id", pref.child_id)
        .eq("reminder_type", "weekly_lookahead")
        .eq("reminder_date", now.date);

      results.push({ preference: pref.id, outcome: "skipped: nothing to say this week" });
      continue;
    }

    const pauseUrl = `${siteUrl}/api/lookahead/pause?id=${pref.id}&token=${signPauseToken(pref.id)}`;

    const pregnancyWeek = !child.is_born && child.due_date
      ? calculatePregnancyWeek(child.due_date, now.date)
      : null;
    const babyWeek = child.is_born && child.birth_date
      ? Math.floor(calculateAgeInDays(child.birth_date, now.date) / 7) + 1
      : null;

    const message = renderLookaheadEmail({
      childName: child.nickname,
      cards: digest,
      siteUrl,
      pauseUrl,
      weekContext: buildWeekContextLabel({
        isBorn: child.is_born,
        pregnancyWeek,
        babyWeek,
      }),
    });

    let { error: sendError } = await sendEmail({
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      unsubscribeUrl: pauseUrl,
    });

    if (sendError) {
      // One in-run retry: with a single daily cron there is no later run today,
      // so a transient Resend blip would otherwise cost the whole week.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      ({ error: sendError } = await sendEmail({
        to: email,
        subject: message.subject,
        html: message.html,
        text: message.text,
        unsubscribeUrl: pauseUrl,
      }));
    }

    if (sendError) {
      // Release the claim so a manual re-run of this endpoint (same day) can retry.
      await supabase
        .from("reminders")
        .delete()
        .eq("user_id", pref.user_id)
        .eq("child_id", pref.child_id)
        .eq("reminder_type", "weekly_lookahead")
        .eq("reminder_date", now.date);

      results.push({ preference: pref.id, outcome: `error: ${sendError}` });
      continue;
    }

    await supabase
      .from("reminders")
      .update({ status: "sent" })
      .eq("user_id", pref.user_id)
      .eq("child_id", pref.child_id)
      .eq("reminder_type", "weekly_lookahead")
      .eq("reminder_date", now.date);

    const sentCardIds = digestCardIds(digest);
    if (sentCardIds.length > 0) {
      await supabase.from("digest_card_sends").upsert(
        sentCardIds.map((cardId) => ({
          user_id: pref.user_id,
          child_id: pref.child_id,
          card_id: cardId,
          sent_on: now.date,
        })),
        { onConflict: "user_id,child_id,card_id,sent_on", ignoreDuplicates: true },
      );
    }

    sent += 1;
    results.push({ preference: pref.id, outcome: `sent ${digest.length} cards${scheduleNote}` });
  }

  return NextResponse.json({ checked: preferences?.length ?? 0, sent, results });
}
