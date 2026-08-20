import { NextResponse } from "next/server";
import { composeDigest } from "@/lib/email/digest";
import { buildWeekContextLabel, renderLookaheadEmail } from "@/lib/email/render-lookahead";
import { sendEmail } from "@/lib/email/resend";
import { getEmailSecrets } from "@/lib/env";
import { timelineHorizonDays } from "@/lib/content/bundled-cards";
import { fetchAdminCards, getAdminProfile } from "@/lib/data/admin";
import { getSiteUrl } from "@/lib/supabase/config";
import { isLiveForUsers } from "@/lib/timeline/card-roles";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import { buildTimeline } from "@/lib/timeline/matching";
import {
  dateForBabyWeek,
  dateForPregnancyWeek,
} from "@/lib/timeline/week-simulation";
import type { AustralianState, ChildcareIntention, TimelineCard } from "@/types/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const referenceDueDate = "2026-12-15";
const referenceBirthDate = "2026-06-01";

type Body = {
  mode: "pregnancy" | "baby";
  weekNumber: number;
  state: AustralianState;
  firstChild: boolean;
  childcare: ChildcareIntention;
  includeUnpublished: boolean;
  childName?: string;
};

export async function POST(request: Request) {
  const admin = await getAdminProfile();
  if (!admin) {
    return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });
  }

  let input: Body;
  try {
    input = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { apiKey, from } = await getEmailSecrets();
  const missingEmailEnv = [
    !apiKey ? "RESEND_API_KEY" : null,
    !from ? "WIK_FROM_EMAIL" : null,
  ].filter(Boolean);

  if (missingEmailEnv.length > 0) {
    return NextResponse.json(
      {
        error: `Email is not configured. Missing on this deploy: ${missingEmailEnv.join(", ")}. Add under Vercel project wish-i-knew → Environment Variables, then Redeploy.`,
      },
      { status: 503 },
    );
  }

  const rows = await fetchAdminCards({});
  const engineCards: TimelineCard[] = rows.map((row) => ({
    ...row,
    status:
      input.includeUnpublished && row.status !== "archived" ? "published" : row.status,
  }));

  const liveCards = engineCards.filter((card) => isLiveForUsers(card.status));
  const currentDate =
    input.mode === "pregnancy"
      ? dateForPregnancyWeek(referenceDueDate, input.weekNumber)
      : dateForBabyWeek(referenceBirthDate, input.weekNumber);

  const profile = {
    currentDate,
    birthDate: input.mode === "baby" ? referenceBirthDate : null,
    dueDate: input.mode === "pregnancy" ? referenceDueDate : null,
    isBorn: input.mode === "baby",
    state: input.state,
    firstChild: input.firstChild,
    childcareIntention: input.childcare,
  };

  const timeline = buildTimeline({
    profile,
    cards: engineCards,
    comingSoonDays: timelineHorizonDays,
    recentPastDays: timelineHorizonDays,
  });

  const digest = composeDigest(timeline, {
    allCards: liveCards,
    currentDate,
  });

  if (digest.length === 0) {
    return NextResponse.json(
      { error: "Nothing in the digest for this week — nothing to send." },
      { status: 400 },
    );
  }

  const pregnancyWeek =
    input.mode === "pregnancy"
      ? calculatePregnancyWeek(referenceDueDate, currentDate)
      : null;
  const babyWeek =
    input.mode === "baby"
      ? Math.floor(calculateAgeInDays(referenceBirthDate, currentDate) / 7) + 1
      : null;

  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const childName = input.childName?.trim() || "Sample bub";
  const rendered = renderLookaheadEmail({
    childName,
    cards: digest,
    siteUrl,
    pauseUrl: `${siteUrl}/`,
    weekContext: buildWeekContextLabel({
      isBorn: input.mode === "baby",
      pregnancyWeek,
      babyWeek,
    }),
  });

  const subject = `[TEST] ${rendered.subject}`;
  const result = await sendEmail({
    to: admin.email,
    subject,
    html: rendered.html,
    text: `${rendered.text}\n\n—\nThis was a Content Studio test send to ${admin.email}.`,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    success: `Sent “${subject}” to ${admin.email} (${digest.length} card${digest.length === 1 ? "" : "s"}).`,
  });
}
