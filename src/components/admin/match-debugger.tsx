"use client";

import { useMemo, useState } from "react";
import { buildTimeline } from "@/lib/timeline/matching";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import { timelineHorizonDays } from "@/lib/content/bundled-cards";
import type { MatchedCard } from "@/lib/timeline/types";
import type { AdminCardRow } from "@/types/admin";
import type { AustralianState, ChildcareIntention, TimelineCard } from "@/types/content";

const allStates: AustralianState[] = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

function toEngineCard(row: AdminCardRow, treatAllAsPublished: boolean): TimelineCard {
  return {
    ...row,
    status: treatAllAsPublished && row.status !== "archived" ? "published" : row.status,
  };
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function Bucket({ title, cards, empty }: { title: string; cards: MatchedCard[]; empty: string }) {
  return (
    <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg font-semibold">
        {title} <span className="text-sm font-normal text-[#172033]/50">({cards.length})</span>
      </h3>
      {cards.length === 0 ? (
        <p className="mt-2 text-sm text-[#172033]/50">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {cards.map(({ card, reasons }) => (
            <li className="rounded-xl bg-[#F7F4EC] p-3" key={card.id}>
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="text-xs text-[#172033]/50">{card.slug}</p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-[#172033]/70">
                {reasons.map((reason) => (
                  <li key={reason.code + reason.message}>
                    <span className="font-mono text-[#1D809F]">{reason.code}</span> — {reason.message}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MatchDebugger({ cards }: { cards: AdminCardRow[] }) {
  const [isBorn, setIsBorn] = useState(true);
  const [birthDate, setBirthDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [currentDate, setCurrentDate] = useState(todayIso());
  const [state, setState] = useState<AustralianState>("NSW");
  const [firstChild, setFirstChild] = useState(true);
  const [childcare, setChildcare] = useState<ChildcareIntention>("unsure");
  const [includeUnpublished, setIncludeUnpublished] = useState(false);

  const anchorReady = isBorn ? Boolean(birthDate) : Boolean(dueDate);

  const result = useMemo(() => {
    if (!anchorReady) return null;

    return buildTimeline({
      profile: {
        currentDate,
        birthDate: isBorn ? birthDate : null,
        dueDate: isBorn ? null : dueDate,
        isBorn,
        state,
        firstChild,
        childcareIntention: childcare,
      },
      cards: cards.map((card) => toEngineCard(card, includeUnpublished)),
      comingSoonDays: timelineHorizonDays,
      recentPastDays: timelineHorizonDays,
    });
  }, [anchorReady, currentDate, isBorn, birthDate, dueDate, state, firstChild, childcare, cards, includeUnpublished]);

  const contextLine = useMemo(() => {
    if (!anchorReady) return null;
    if (isBorn) return `Child is ${calculateAgeInDays(birthDate, currentDate)} days old on the test date.`;
    return `Pregnancy week ${calculatePregnancyWeek(dueDate, currentDate)} on the test date.`;
  }, [anchorReady, isBorn, birthDate, dueDate, currentDate]);

  const inputClass =
    "mt-1 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-3 py-2 text-sm outline-none focus:border-[#1D809F]";

  return (
    <div>
      <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">Sample profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold">
            Stage
            <select
              className={inputClass}
              onChange={(e) => setIsBorn(e.target.value === "born")}
              value={isBorn ? "born" : "pregnant"}
            >
              <option value="born">Baby is born</option>
              <option value="pregnant">Still pregnant</option>
            </select>
          </label>
          {isBorn ? (
            <label className="text-sm font-semibold">
              Birth date
              <input className={inputClass} onChange={(e) => setBirthDate(e.target.value)} type="date" value={birthDate} />
            </label>
          ) : (
            <label className="text-sm font-semibold">
              Due date
              <input className={inputClass} onChange={(e) => setDueDate(e.target.value)} type="date" value={dueDate} />
            </label>
          )}
          <label className="text-sm font-semibold">
            Test date
            <input className={inputClass} onChange={(e) => setCurrentDate(e.target.value)} type="date" value={currentDate} />
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
          <label className="text-sm font-semibold">
            Childcare intention
            <select
              className={inputClass}
              onChange={(e) => setChildcare(e.target.value as ChildcareIntention)}
              value={childcare}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unsure">Unsure</option>
            </select>
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold">
          <input
            checked={includeUnpublished}
            onChange={(e) => setIncludeUnpublished(e.target.checked)}
            type="checkbox"
          />
          Include unpublished cards (treat drafts as published)
        </label>
        {contextLine ? <p className="mt-3 text-sm text-[#1D809F]">{contextLine}</p> : null}
        {!anchorReady ? (
          <p className="mt-3 text-sm text-[#172033]/50">Set a birth date or due date to run the engine.</p>
        ) : null}
      </div>

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Bucket cards={result.currentCards} empty="Nothing lands in this week." title="This week" />
          <Bucket cards={result.comingSoonCards} empty="Nothing in the next month." title="Coming soon (~30 days)" />
          <Bucket cards={result.recentPastCards} empty="Nothing in the past month." title="Recently passed (~30 days)" />
          <Bucket cards={result.overdueCards} empty="Nothing overdue (time-critical only)." title="Overdue" />
          <Bucket cards={result.laterCards} empty="Nothing scheduled later." title="Later" />
        </div>
      ) : null}
    </div>
  );
}
