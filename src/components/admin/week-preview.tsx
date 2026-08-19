"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { composeDigest } from "@/lib/email/digest";
import { buildWeekContextLabel, renderLookaheadEmail } from "@/lib/email/render-lookahead";
import { isWeeklyAnchorCard } from "@/lib/timeline/card-roles";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import { buildTimeline } from "@/lib/timeline/matching";
import { timelineHorizonDays } from "@/lib/content/bundled-cards";
import {
  dateForBabyWeek,
  dateForPregnancyWeek,
  formatWeekContext,
} from "@/lib/timeline/week-simulation";
import type { MatchedCard } from "@/lib/timeline/types";
import type { AdminCardRow } from "@/types/admin";
import type { AustralianState, ChildcareIntention, TimelineCard } from "@/types/content";

const allStates: AustralianState[] = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const referenceDueDate = "2026-12-15";
const referenceBirthDate = "2026-06-01";

function toEngineCard(row: AdminCardRow, treatAllAsPublished: boolean): TimelineCard {
  return {
    ...row,
    status: treatAllAsPublished && row.status !== "archived" ? "published" : row.status,
  };
}

function CardList({
  title,
  cards,
  empty,
  highlightSlugs,
}: {
  title: string;
  cards: MatchedCard[];
  empty: string;
  highlightSlugs?: Set<string>;
}) {
  return (
    <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold">
        {title} <span className="text-sm font-normal text-[#172033]/50">({cards.length})</span>
      </h3>
      {cards.length === 0 ? (
        <p className="mt-2 text-sm text-[#172033]/50">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {cards.map(({ card }) => (
            <li
              className={`rounded-xl p-3 text-sm ${highlightSlugs?.has(card.slug) ? "bg-[#E7F1FB] ring-1 ring-[#1D809F]/30" : "bg-[#F7F4EC]"}`}
              key={card.id}
            >
              <Link className="font-semibold text-[#1D809F] hover:underline" href={`/admin/cards/${card.id}`}>
                {card.title}
              </Link>
              <p className="text-xs text-[#172033]/50">
                {card.card_type}
                {isWeeklyAnchorCard(card) ? " · anchor" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeekPreview({ cards }: { cards: AdminCardRow[] }) {
  const [mode, setMode] = useState<"pregnancy" | "baby">("pregnancy");
  const [weekNumber, setWeekNumber] = useState(24);
  const [includeUnpublished, setIncludeUnpublished] = useState(true);
  const [state, setState] = useState<AustralianState>("NSW");
  const [firstChild, setFirstChild] = useState(true);
  const [childcare, setChildcare] = useState<ChildcareIntention>("unsure");

  const engineCards = useMemo(
    () => cards.map((card) => toEngineCard(card, includeUnpublished)),
    [cards, includeUnpublished],
  );

  const publishedCards = useMemo(
    () => engineCards.filter((card) => card.status === "published"),
    [engineCards],
  );

  const currentDate = useMemo(() => {
    if (mode === "pregnancy") return dateForPregnancyWeek(referenceDueDate, weekNumber);
    return dateForBabyWeek(referenceBirthDate, weekNumber);
  }, [mode, weekNumber]);

  const profile = useMemo(
    () => ({
      currentDate,
      birthDate: mode === "baby" ? referenceBirthDate : null,
      dueDate: mode === "pregnancy" ? referenceDueDate : null,
      isBorn: mode === "baby",
      state,
      firstChild,
      childcareIntention: childcare,
    }),
    [currentDate, mode, state, firstChild, childcare],
  );

  const timeline = useMemo(
    () =>
      buildTimeline({
        profile,
        cards: engineCards,
        comingSoonDays: timelineHorizonDays,
        recentPastDays: timelineHorizonDays,
      }),
    [profile, engineCards],
  );

  const digest = useMemo(
    () =>
      composeDigest(timeline, {
        allCards: publishedCards,
        currentDate,
      }),
    [timeline, publishedCards, currentDate],
  );

  const digestSlugs = useMemo(() => new Set(digest.map(({ card }) => card.slug)), [digest]);

  const pregnancyWeek =
    mode === "pregnancy" ? calculatePregnancyWeek(referenceDueDate, currentDate) : null;
  const babyWeek =
    mode === "baby" ? Math.floor(calculateAgeInDays(referenceBirthDate, currentDate) / 7) + 1 : null;

  const emailPreview = useMemo(
    () =>
      renderLookaheadEmail({
        childName: "Sample bub",
        cards: digest,
        siteUrl: "https://wish-i-knew.vercel.app",
        pauseUrl: "https://wish-i-knew.vercel.app/api/lookahead/pause",
        weekContext: buildWeekContextLabel({
          isBorn: mode === "baby",
          pregnancyWeek,
          babyWeek,
        }),
      }),
    [digest, mode, pregnancyWeek, babyWeek],
  );

  const hasAnchor = digest.some(({ card }) => isWeeklyAnchorCard(card));
  const anchorGap =
    mode === "pregnancy" && !timeline.currentCards.some(({ card }) => isWeeklyAnchorCard(card));

  const minWeek = 1;
  const maxWeek = mode === "pregnancy" ? 42 : 104;

  const inputClass =
    "mt-1 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-3 py-2 text-sm outline-none focus:border-[#1D809F]";

  return (
    <div>
      <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Browse by week</h2>
            <p className="mt-1 text-sm text-[#172033]/60">
              See what parents would get in-app and in the weekly email for any week.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-[#0d1b2a]/15 px-3 py-2 text-sm font-semibold hover:bg-[#F7F4EC] disabled:opacity-40"
              disabled={weekNumber <= minWeek}
              onClick={() => setWeekNumber((w) => Math.max(minWeek, w - 1))}
              type="button"
            >
              ← Previous
            </button>
            <label className="text-sm font-semibold">
              Week
              <input
                className="mx-2 w-16 rounded-xl border border-[#0d1b2a]/15 px-2 py-2 text-center text-sm"
                max={maxWeek}
                min={minWeek}
                onChange={(e) => setWeekNumber(Number(e.target.value) || minWeek)}
                type="number"
                value={weekNumber}
              />
            </label>
            <button
              className="rounded-xl border border-[#0d1b2a]/15 px-3 py-2 text-sm font-semibold hover:bg-[#F7F4EC] disabled:opacity-40"
              disabled={weekNumber >= maxWeek}
              onClick={() => setWeekNumber((w) => Math.min(maxWeek, w + 1))}
              type="button"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Journey
            <select
              className={inputClass}
              onChange={(e) => {
                setMode(e.target.value as "pregnancy" | "baby");
                setWeekNumber(e.target.value === "pregnancy" ? 24 : 2);
              }}
              value={mode}
            >
              <option value="pregnancy">Pregnancy</option>
              <option value="baby">Baby (since birth)</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            State
            <select className={inputClass} onChange={(e) => setState(e.target.value as AustralianState)} value={state}>
              {allStates.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            First child
            <select
              className={inputClass}
              onChange={(e) => setFirstChild(e.target.value === "yes")}
              value={firstChild ? "yes" : "no"}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input
            checked={includeUnpublished}
            onChange={(e) => setIncludeUnpublished(e.target.checked)}
            type="checkbox"
          />
          Include unpublished cards (treat as published for preview)
        </label>

        <p className="mt-3 text-sm font-semibold text-[#1D809F]">{formatWeekContext(profile)}</p>
        {anchorGap ? (
          <p className="mt-2 rounded-xl bg-[#FFF3DB] px-3 py-2 text-sm text-[#9A6B15]">
            No weekly anchor card for this pregnancy week — add a &ldquo;This week with bub&rdquo; card with start
            and end set to week {weekNumber}.
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-[#1D809F]/20 bg-[#E7F1FB]/40 p-5">
        <h3 className="font-display text-lg font-semibold">Weekly email preview</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-[#172033]/50">Subject line</p>
        <p className="mt-1 text-sm font-semibold text-[#0d1b2a]">{emailPreview.subject}</p>
        <p className="mt-3 text-xs uppercase tracking-wide text-[#172033]/50">
          {digest.length} card{digest.length === 1 ? "" : "s"} in digest
          {hasAnchor ? " · anchor included" : ""}
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <CardList
          cards={digest}
          empty="Nothing would be emailed this week."
          highlightSlugs={digestSlugs}
          title="Email digest"
        />
        <CardList
          cards={timeline.currentCards}
          empty="Nothing in This week."
          highlightSlugs={digestSlugs}
          title="Timeline — This week"
        />
        <CardList cards={timeline.comingSoonCards} empty="Nothing coming soon." title="Coming soon" />
        <CardList cards={timeline.overdueCards} empty="Nothing overdue." title="Overdue" />
      </div>
    </div>
  );
}
