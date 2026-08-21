import { NextResponse } from "next/server";
import { composeDigest } from "@/lib/email/digest";
import { buildWeekContextLabel, renderLookaheadEmail } from "@/lib/email/render-lookahead";
import { sendEmail } from "@/lib/email/resend";
import { getEmailSecrets } from "@/lib/env";
import { timelineHorizonDays } from "@/lib/content/bundled-cards";
import { getAdminProfile } from "@/lib/data/admin";
import { getSiteUrl } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";
import { isLiveForUsers } from "@/lib/timeline/card-roles";
import { calculatePregnancyWeek } from "@/lib/timeline/dates";
import { buildTimeline } from "@/lib/timeline/matching";
import { dateForPregnancyWeek } from "@/lib/timeline/week-simulation";
import type { AustralianState, ChildcareIntention, TimelineCard } from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const referenceDueDate = "2026-12-15";

/**
 * Smoke test: sends pregnancy week 24 Lookahead.
 * Auth: Bearer CRON_SECRET, or an admin session cookie.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const cronOk = Boolean(cronSecret && bearer && bearer === cronSecret);

  let toEmail: string | null = null;

  if (cronOk) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    toEmail = data?.email ?? null;
  } else {
    const admin = await getAdminProfile();
    if (!admin) {
      return NextResponse.json({ error: "Admin sign-in or CRON_SECRET required." }, { status: 401 });
    }
    toEmail = admin.email;
  }

  if (!toEmail) {
    return NextResponse.json({ error: "No admin email found to send to." }, { status: 500 });
  }

  const { apiKey, from } = await getEmailSecrets();
  const missing = [
    !apiKey ? "RESEND_API_KEY" : null,
    !from ? "WIK_FROM_EMAIL" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: `Missing env: ${missing.join(", ")}`,
        hasApiKey: Boolean(apiKey),
        hasFrom: Boolean(from),
      },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();
  const { data: rows, error: cardsError } = await supabase
    .from("timeline_cards")
    .select("*")
    .neq("status", "archived");

  if (cardsError) {
    return NextResponse.json({ error: cardsError.message }, { status: 500 });
  }

  const engineCards = (rows ?? []).map((row) => ({
    ...(row as TimelineCard),
    status: "published" as const,
  }));
  const liveCards = engineCards.filter((card) => isLiveForUsers(card.status));
  const currentDate = dateForPregnancyWeek(referenceDueDate, 24);
  const timeline = buildTimeline({
    profile: {
      currentDate,
      birthDate: null,
      dueDate: referenceDueDate,
      isBorn: false,
      state: "NSW" as AustralianState,
      firstChild: true,
      childcareIntention: "unsure" as ChildcareIntention,
    },
    cards: engineCards,
    comingSoonDays: timelineHorizonDays,
    recentPastDays: timelineHorizonDays,
  });
  const digest = composeDigest(timeline, { allCards: liveCards, currentDate });

  if (digest.length === 0) {
    return NextResponse.json({ error: "Empty digest for smoke test week." }, { status: 400 });
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const pregnancyWeek = calculatePregnancyWeek(referenceDueDate, currentDate);
  const rendered = renderLookaheadEmail({
    childName: "Sample bub",
    cards: digest,
    siteUrl,
    pauseUrl: `${siteUrl}/`,
    weekContext: buildWeekContextLabel({
      isBorn: false,
      pregnancyWeek,
      babyWeek: null,
    }),
  });

  const subject = `[SMOKE] ${rendered.subject}`;
  const result = await sendEmail({
    to: toEmail,
    subject,
    html: rendered.html,
    text: rendered.text,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    to: toEmail,
    subject,
    cards: digest.length,
  });
}
