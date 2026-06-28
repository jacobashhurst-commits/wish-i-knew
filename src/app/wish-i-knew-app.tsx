"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "@/lib/clsx";
import { demoCards } from "@/lib/content/demo-cards";
import { validateCardForPublish } from "@/lib/content/validation";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import { buildTimeline } from "@/lib/timeline/matching";
import type { MatchedCard, TimelineProfile, TimelineResult } from "@/lib/timeline/types";
import type {
  AustralianState,
  ChildcareIntention,
  TimelineCard,
  UserCardState,
  UserCardStatus,
} from "@/types/content";

type LookaheadDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type OnboardingState = {
  childName: string;
  isBorn: boolean;
  birthDate: string;
  dueDate: string;
  state: AustralianState;
  firstChild: boolean;
  childcareIntention: ChildcareIntention;
  lookaheadDay: LookaheadDay;
  lookaheadTime: string;
};

type AppView = "home" | "timeline" | "saved" | "settings" | "admin";

type DemoState = {
  form: OnboardingState;
  hasOnboarded: boolean;
  cardStates: Record<string, UserCardState>;
};

const defaultOnboarding: OnboardingState = {
  childName: "Audrey",
  isBorn: true,
  birthDate: "2025-07-25",
  dueDate: "2026-10-08",
  state: "NSW",
  firstChild: true,
  childcareIntention: "unsure",
  lookaheadDay: "saturday",
  lookaheadTime: "08:00",
};

const defaultDemoState: DemoState = {
  form: defaultOnboarding,
  hasOnboarded: false,
  cardStates: {},
};

const states: AustralianState[] = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const cardTypeStyles: Record<string, string> = {
  "Big Milestone": "bg-[#FFE3C2] text-[#5A3A14]",
  "Tiny Gear Shift": "bg-[#D7F3F1] text-[#0E4D52]",
  "Heads Up": "bg-[#FFE0DE] text-[#7A2E2E]",
  "Admin Trap": "bg-[#E7ECF5] text-[#1B2A45]",
  "Parent Sanity": "bg-[#ECE4FB] text-[#3F2A6E]",
  "Aussie System": "bg-[#E2F0E8] text-[#234B38]",
  "Fun First": "bg-[#FFF0C7] text-[#6A4E12]",
};

const demoStorageKey = "wish-i-knew-demo-state";

function isStoredDemoState(value: unknown): value is Partial<DemoState> {
  return typeof value === "object" && value !== null;
}

function readStoredDemoState(): Partial<DemoState> {
  if (typeof window === "undefined") return {};

  const stored = window.localStorage.getItem(demoStorageKey);
  if (!stored) return {};

  try {
    const parsed: unknown = JSON.parse(stored);

    return isStoredDemoState(parsed) ? parsed : {};
  } catch {
    window.localStorage.removeItem(demoStorageKey);

    return {};
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);

  return next.toISOString().slice(0, 10);
}

function sentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function describeStage(profile: TimelineProfile, childName: string): string {
  if (!profile.isBorn && profile.dueDate) {
    const week = calculatePregnancyWeek(profile.dueDate, profile.currentDate);

    return `${childName} is due soon — around ${week} weeks along.`;
  }

  if (!profile.birthDate) {
    return `${childName}'s timeline is ready.`;
  }

  const ageDays = calculateAgeInDays(profile.birthDate, profile.currentDate);
  const months = Math.floor(ageDays / 30.4375);

  if (months < 1) return `${childName} is ${ageDays} days old.`;
  if (months < 24) return `${childName} is about ${months} months old.`;

  return `${childName} is about ${Math.floor(months / 12)} years old.`;
}

function makeProfile(form: OnboardingState, currentDate: string): TimelineProfile {
  return {
    currentDate,
    birthDate: form.isBorn ? form.birthDate : null,
    dueDate: form.isBorn ? null : form.dueDate,
    isBorn: form.isBorn,
    state: form.state,
    firstChild: form.firstChild,
    childcareIntention: form.childcareIntention,
  };
}

function cardSortValue(card: TimelineCard): number {
  if (card.start_age_days !== null) return card.start_age_days;
  if (card.pregnancy_week_start !== null) return card.pregnancy_week_start * 7 - 280;

  return 9999;
}

function CardThumb({ card, className }: { card: TimelineCard; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-2xl bg-[#0d1b2a]", className)}>
      {card.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-full w-full object-cover" src={card.image_url} />
      ) : null}
    </div>
  );
}

function CardArt({ card }: { card: TimelineCard }) {
  return (
    <div
      aria-label={card.image_alt ?? card.title}
      className="relative overflow-hidden rounded-[1.4rem] bg-[#0d1b2a] ring-1 ring-[#0d1b2a]/10"
      role="img"
    >
      {card.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="aspect-[16/10] w-full object-cover" src={card.image_url} />
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center p-6 text-center text-sm font-bold text-white/70">
          Image needed
        </div>
      )}
      <span className="absolute left-3 top-3 rounded-full bg-[#FFF6E6] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0d1b2a] shadow-sm">
        {card.life_stage}
      </span>
    </div>
  );
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return <span className={clsx("wik-chip", tone ?? "bg-[#F1ECDF] text-[#172033]")}>{children}</span>;
}

function ActionButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      className={clsx(
        "rounded-full border px-3 py-2 text-xs font-bold transition",
        active
          ? "border-[#0d1b2a] bg-[#0d1b2a] text-white"
          : "border-[#0d1b2a]/15 bg-white text-[#172033] hover:border-[#0d1b2a]/40",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function TimelineCardItem({
  card,
  state,
  onAction,
  onOpen,
}: {
  card: TimelineCard;
  state?: UserCardState;
  onAction: (cardId: string, status: UserCardStatus) => void;
  onOpen: (card: TimelineCard) => void;
}) {
  const typeTone = cardTypeStyles[card.card_type] ?? "bg-[#F1ECDF] text-[#172033]";

  return (
    <article className="wik-game-card flex flex-col p-3">
      <button className="block w-full text-left" onClick={() => onOpen(card)} type="button">
        <CardArt card={card} />
        <div className="mt-3 flex flex-wrap gap-2 px-1">
          <StatusPill tone={typeTone}>{card.card_type}</StatusPill>
          {state?.status && state.status !== "unseen" ? (
            <StatusPill tone="bg-[#E2F0E8] text-[#234B38]">{state.status.replace("_", " ")}</StatusPill>
          ) : null}
        </div>
        <h3 className="font-display mt-2 px-1 text-xl font-semibold leading-tight text-[#0d1b2a]">
          {card.title}
        </h3>
        {card.subtitle ? (
          <p className="mt-1 px-1 text-sm font-medium text-[#697386]">{card.subtitle}</p>
        ) : null}
        <p className="mt-2 px-1 text-sm leading-6 text-[#172033]/75">{card.short_summary}</p>
      </button>

      <div className="mt-3 flex flex-wrap gap-2 px-1 pb-1">
        <ActionButton
          active={state?.status === "saved"}
          onClick={() => onAction(card.id, state?.status === "saved" ? "unseen" : "saved")}
        >
          Save
        </ActionButton>
        <ActionButton active={state?.status === "done"} onClick={() => onAction(card.id, "done")}>
          Done
        </ActionButton>
        <ActionButton active={state?.status === "snoozed"} onClick={() => onAction(card.id, "snoozed")}>
          Snooze
        </ActionButton>
        <ActionButton active={state?.status === "not_relevant"} onClick={() => onAction(card.id, "not_relevant")}>
          Not relevant
        </ActionButton>
      </div>
    </article>
  );
}

function CardDetail({
  card,
  state,
  onAction,
  onClose,
}: {
  card: TimelineCard;
  state?: UserCardState;
  onAction: (cardId: string, status: UserCardStatus) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#0d1b2a]/40 p-3 backdrop-blur-sm sm:p-6">
      <section className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-[#FFF6E6] shadow-2xl">
        <div className="overflow-y-auto p-5 sm:p-7">
          <button
            className="mb-4 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#172033] shadow-sm"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <CardArt card={card} />
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusPill tone={cardTypeStyles[card.card_type]}>{card.card_type}</StatusPill>
            <StatusPill tone="bg-white text-[#697386]">{card.category}</StatusPill>
          </div>
          <h2 className="font-display mt-4 text-3xl font-semibold leading-tight text-[#0d1b2a]">{card.title}</h2>
          {card.subtitle ? <p className="mt-1 text-lg font-medium text-[#697386]">{card.subtitle}</p> : null}

          <div className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-[#0d1b2a]/5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6B6B]">Wish I knew</p>
            <p className="mt-2 text-lg font-semibold leading-7 text-[#0d1b2a]">{card.wish_i_knew}</p>
          </div>

          <DetailSection title="Why it matters" value={card.why_it_matters} />
          <DetailSection title="What to do now" value={card.what_to_do_now} />
          <DetailSection title="What can wait" value={card.what_can_wait} />

          {card.checklist_items?.length ? (
            <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-[#0d1b2a]/5">
              <h3 className="font-display font-semibold text-[#0d1b2a]">Quick checklist</h3>
              <ul className="mt-3 space-y-2">
                {card.checklist_items.map((item) => (
                  <li className="flex gap-3 text-sm leading-6 text-[#172033]/80" key={item}>
                    <span className="mt-1 h-4 w-4 shrink-0 rounded-full bg-[#6FAF8E]/50" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <ActionButton
              active={state?.status === "saved"}
              onClick={() => onAction(card.id, state?.status === "saved" ? "unseen" : "saved")}
            >
              Save card
            </ActionButton>
            <ActionButton active={state?.status === "done"} onClick={() => onAction(card.id, "done")}>
              Mark done
            </ActionButton>
            <ActionButton active={state?.status === "snoozed"} onClick={() => onAction(card.id, "snoozed")}>
              Snooze 7 days
            </ActionButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function DetailSection({ title, value }: { title: string; value: string | null }) {
  if (!value) return null;

  return (
    <section className="mt-5 rounded-[1.5rem] bg-white/70 p-5 ring-1 ring-[#0d1b2a]/5">
      <h3 className="font-display font-semibold text-[#0d1b2a]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#172033]/80">{value}</p>
    </section>
  );
}

function Onboarding({
  form,
  setForm,
  onSubmit,
}: {
  form: OnboardingState;
  setForm: (form: OnboardingState) => void;
  onSubmit: () => void;
}) {
  return (
    <main className="px-4 py-6 text-[#172033] sm:py-10">
      <section className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#0d1b2a] text-white shadow-[0_24px_60px_rgba(13,27,42,0.25)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Warm illustration of a parent with coffee and a baby on a picnic rug at a coastal NSW headland, with a pram, childcare backpack, soft toy and milestone cards."
            className="h-56 w-full object-cover sm:h-72"
            src="/illustrations/hero-coastal.png"
          />
          <div className="p-6 sm:p-8">
            <p className="wik-chip bg-white/15 text-[#FFD79A]">Wish I Knew</p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl">
              Know what&apos;s coming next.
            </h1>
            <p className="mt-4 text-base leading-7 text-white/75">
              A calm, playful timeline for Australian parents. Tell us the basics and we&apos;ll show what
              matters now, what&apos;s coming soon, and what can happily wait.
            </p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-sm font-semibold text-white">Your weekly Lookahead is the ritual.</p>
              <p className="mt-1 text-sm leading-6 text-white/75">
                A calm Saturday-morning check-in with practical cards — not a guilt machine.
              </p>
            </div>
          </div>
        </div>

        <form
          className="wik-shell-card p-5 sm:p-7"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <h2 className="font-display text-2xl font-semibold text-[#0d1b2a]">Build your baby timeline</h2>
          <p className="mt-1 text-sm text-[#697386]">Takes about 30 seconds. You can change it later.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-[#172033]">Child nickname</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) => setForm({ ...form, childName: event.target.value })}
                value={form.childName}
              />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-semibold text-[#172033]">Where are you up to?</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {[
                  { label: "Baby is born", value: true },
                  { label: "Still pregnant", value: false },
                ].map((option) => (
                  <button
                    className={clsx(
                      "rounded-xl border px-4 py-3 text-sm font-bold transition",
                      form.isBorn === option.value
                        ? "border-[#0d1b2a] bg-[#0d1b2a] text-white"
                        : "border-[#0d1b2a]/15 bg-white text-[#172033] hover:border-[#0d1b2a]/40",
                    )}
                    key={option.label}
                    onClick={() => setForm({ ...form, isBorn: option.value })}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              <span className="text-sm font-semibold text-[#172033]">{form.isBorn ? "Birth date" : "Due date"}</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) =>
                  setForm(
                    form.isBorn
                      ? { ...form, birthDate: event.target.value }
                      : { ...form, dueDate: event.target.value },
                  )
                }
                type="date"
                value={form.isBorn ? form.birthDate : form.dueDate}
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-[#172033]">State or territory</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) => setForm({ ...form, state: event.target.value as AustralianState })}
                value={form.state}
              >
                {states.map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-[#172033]">First child?</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) => setForm({ ...form, firstChild: event.target.value === "yes" })}
                value={form.firstChild ? "yes" : "no"}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-[#172033]">Childcare needed?</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) =>
                  setForm({ ...form, childcareIntention: event.target.value as ChildcareIntention })
                }
                value={form.childcareIntention}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="unsure">Unsure</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-[#172033]">Weekly Lookahead day</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) => setForm({ ...form, lookaheadDay: event.target.value as LookaheadDay })}
                value={form.lookaheadDay}
              >
                {["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"].map((day) => (
                  <option key={day} value={day}>
                    {sentenceCase(day)}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-[#172033]">Time</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                onChange={(event) => setForm({ ...form, lookaheadTime: event.target.value })}
                type="time"
                value={form.lookaheadTime}
              />
            </label>
          </div>

          <button className="wik-button wik-button-sun mt-6 w-full text-base" type="submit">
            Show my timeline
          </button>
        </form>
      </section>
    </main>
  );
}

export default function WishIKnewApp() {
  const [demo, setDemo] = useState<DemoState>(defaultDemoState);
  const [hydrated, setHydrated] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [selectedCard, setSelectedCard] = useState<TimelineCard | null>(null);
  const [currentDate] = useState(() => todayIso());

  const { form, hasOnboarded, cardStates } = demo;

  useEffect(() => {
    const stored = readStoredDemoState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDemo({
      form: stored.form ?? defaultOnboarding,
      hasOnboarded: stored.hasOnboarded ?? false,
      cardStates: stored.cardStates ?? {},
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(demoStorageKey, JSON.stringify(demo));
  }, [demo, hydrated]);

  const profile = useMemo(() => makeProfile(form, currentDate), [form, currentDate]);
  const userCardStates = useMemo(() => Object.values(cardStates), [cardStates]);
  const timeline = useMemo(
    () =>
      buildTimeline({
        profile,
        cards: demoCards,
        userCardStates,
        comingSoonDays: 45,
      }),
    [profile, userCardStates],
  );

  const savedCards = useMemo(
    () => demoCards.filter((card) => cardStates[card.id]?.status === "saved"),
    [cardStates],
  );
  const doneCount = useMemo(
    () => Object.values(cardStates).filter((state) => state.status === "done").length,
    [cardStates],
  );
  const contentHealth = useMemo(
    () => demoCards.map((card) => ({ card, errors: validateCardForPublish(card) })),
    [],
  );

  function setForm(next: OnboardingState) {
    setDemo((current) => ({ ...current, form: next }));
  }

  function handleAction(cardId: string, status: UserCardStatus) {
    setDemo((current) => ({
      ...current,
      cardStates: {
        ...current.cardStates,
        [cardId]: {
          card_id: cardId,
          status,
          snoozed_until: status === "snoozed" ? addDays(currentDate, 7) : null,
        },
      },
    }));
  }

  function resetDemo() {
    window.localStorage.removeItem(demoStorageKey);
    setDemo(defaultDemoState);
    setActiveView("home");
  }

  if (!hasOnboarded) {
    return (
      <Onboarding
        form={form}
        onSubmit={() => setDemo((current) => ({ ...current, hasOnboarded: true }))}
        setForm={setForm}
      />
    );
  }

  const lookaheadCards = [
    ...timeline.currentCards,
    ...timeline.snoozedCardsDue,
    ...timeline.comingSoonCards,
    ...timeline.overdueCards,
  ]
    .slice(0, 4)
    .map(({ card }) => card);
  const stageSummary = describeStage(profile, form.childName || "Your child");

  return (
    <main className="min-h-screen text-[#172033]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-7">
        <header className="relative isolate overflow-hidden rounded-[2rem] bg-[#0d1b2a] text-white shadow-[0_22px_55px_rgba(13,27,42,0.25)]">
          <div className="grid sm:grid-cols-[1.1fr_1fr]">
            <div className="order-2 p-6 sm:order-1 sm:p-8">
              <p className="wik-chip bg-white/15 text-[#FFD79A]">Wish I Knew</p>
              <h1 className="font-display mt-3 text-4xl font-semibold leading-[1.05] sm:text-5xl">
                Know what&apos;s coming next.
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/75">{stageSummary}</p>
              <button
                className="wik-button wik-button-sun mt-5"
                onClick={() => setDemo((current) => ({ ...current, hasOnboarded: false }))}
                type="button"
              >
                Edit setup
              </button>
            </div>
            <div className="order-1 sm:order-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Warm illustration of a parent with coffee and a baby on a picnic rug at a coastal NSW headland."
                className="h-44 w-full object-cover sm:h-full"
                src="/illustrations/hero-coastal.png"
              />
            </div>
          </div>
        </header>

        <AppNav activeView={activeView} onChange={setActiveView} />

        {activeView === "home" ? (
          <HomeView
            cardStates={cardStates}
            doneCount={doneCount}
            form={form}
            lookaheadCards={lookaheadCards}
            onAction={handleAction}
            onOpen={setSelectedCard}
            savedCount={savedCards.length}
            timeline={timeline}
          />
        ) : null}

        {activeView === "timeline" ? (
          <TimelineView
            cardStates={cardStates}
            childName={form.childName || "Your child"}
            onOpen={setSelectedCard}
            timeline={timeline}
          />
        ) : null}

        {activeView === "saved" ? (
          <SavedView
            cards={savedCards}
            cardStates={cardStates}
            onAction={handleAction}
            onOpen={setSelectedCard}
          />
        ) : null}

        {activeView === "settings" ? <SettingsView form={form} onReset={resetDemo} /> : null}

        {activeView === "admin" ? (
          <ContentStudioView contentHealth={contentHealth} onOpen={setSelectedCard} />
        ) : null}
      </div>

      {selectedCard ? (
        <CardDetail
          card={selectedCard}
          onAction={handleAction}
          onClose={() => setSelectedCard(null)}
          state={cardStates[selectedCard.id]}
        />
      ) : null}
    </main>
  );
}

function AppNav({
  activeView,
  onChange,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
}) {
  const items: { label: string; view: AppView }[] = [
    { label: "Home", view: "home" },
    { label: "Timeline", view: "timeline" },
    { label: "Saved", view: "saved" },
    { label: "Settings", view: "settings" },
    { label: "Content", view: "admin" },
  ];

  return (
    <nav className="sticky top-3 z-20 mt-4 overflow-x-auto rounded-full border border-[#0d1b2a]/8 bg-white/85 p-1 shadow-[0_10px_30px_rgba(13,27,42,0.1)] backdrop-blur">
      <div className="flex min-w-max gap-1">
        {items.map((item) => (
          <button
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-bold transition",
              activeView === item.view ? "bg-[#0d1b2a] text-white" : "text-[#697386] hover:bg-[#FFF6E6]",
            )}
            key={item.view}
            onClick={() => onChange(item.view)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function HomeView({
  cardStates,
  doneCount,
  form,
  lookaheadCards,
  onAction,
  onOpen,
  savedCount,
  timeline,
}: {
  cardStates: Record<string, UserCardState>;
  doneCount: number;
  form: OnboardingState;
  lookaheadCards: TimelineCard[];
  onAction: (cardId: string, status: UserCardStatus) => void;
  onOpen: (card: TimelineCard) => void;
  savedCount: number;
  timeline: TimelineResult;
}) {
  return (
    <>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="wik-shell-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B6B]">
                {sentenceCase(form.lookaheadDay)} Lookahead
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[#0d1b2a]">
                {lookaheadCards.length} things worth knowing
              </h2>
            </div>
            <span className="rounded-xl bg-[#FFF0C7] px-3 py-2 text-xs font-bold text-[#6A4E12]">
              {form.lookaheadTime}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#697386]">
            Calm, practical, Australia-specific. No panic, no perfect-parent energy.
          </p>

          <div className="mt-4 space-y-2.5">
            {lookaheadCards.map((card) => (
              <button
                className="flex w-full items-center gap-3 rounded-2xl border border-[#0d1b2a]/8 bg-[#FFFDF7] p-2.5 text-left transition hover:border-[#0d1b2a]/25"
                key={card.id}
                onClick={() => onOpen(card)}
                type="button"
              >
                <CardThumb card={card} className="h-14 w-14 shrink-0" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0d1b2a]">{card.title}</p>
                  <p className="mt-0.5 truncate text-xs text-[#697386]">{card.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Metric label="Current cards" value={timeline.currentCards.length} />
          <Metric label="Coming soon" value={timeline.comingSoonCards.length} />
          <Metric label="Saved" value={savedCount} />
          <Metric label="Done" value={doneCount} />
        </section>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <SectionHeading
            eyebrow="Right now"
            title="Cards for this stage"
            subtitle="The things most likely to matter around now."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {timeline.currentCards.length ? (
              timeline.currentCards.map(({ card }) => (
                <TimelineCardItem
                  card={card}
                  key={card.id}
                  onAction={onAction}
                  onOpen={onOpen}
                  state={cardStates[card.id]}
                />
              ))
            ) : (
              <EmptyState message="Nothing urgent right now. That is allowed." />
            )}
          </div>
        </section>

        <aside>
          <SectionHeading
            eyebrow="Next up"
            title="Coming soon"
            subtitle="Useful things to know before they become annoying."
          />
          <div className="mt-4 space-y-4">
            {timeline.comingSoonCards.map(({ card }) => (
              <TimelineCardItem
                card={card}
                key={card.id}
                onAction={onAction}
                onOpen={onOpen}
                state={cardStates[card.id]}
              />
            ))}
            {!timeline.comingSoonCards.length ? (
              <EmptyState message="No coming-soon cards in this window." />
            ) : null}
          </div>
        </aside>
      </div>
    </>
  );
}

type TimelineSegmentTone = "overdue" | "now" | "soon" | "later";

const segmentToneStyles: Record<
  TimelineSegmentTone,
  { dot: string; rail: string; chip: string; eyebrow: string }
> = {
  overdue: {
    dot: "bg-[#FF6B6B] ring-[#FF6B6B]/25",
    rail: "bg-[#FF6B6B]/30",
    chip: "bg-[#FFE0DE] text-[#7A2E2E]",
    eyebrow: "text-[#FF6B6B]",
  },
  now: {
    dot: "bg-[#1D809F] ring-[#1D809F]/25",
    rail: "bg-[#1D809F]/30",
    chip: "bg-[#D7F3F1] text-[#0E4D52]",
    eyebrow: "text-[#1D809F]",
  },
  soon: {
    dot: "bg-[#FFC857] ring-[#FFC857]/30",
    rail: "bg-[#FFC857]/35",
    chip: "bg-[#FFF0C7] text-[#6A4E12]",
    eyebrow: "text-[#B8861F]",
  },
  later: {
    dot: "bg-[#6FAF8E] ring-[#6FAF8E]/25",
    rail: "bg-[#6FAF8E]/30",
    chip: "bg-[#E2F0E8] text-[#234B38]",
    eyebrow: "text-[#4F7D63]",
  },
};

function TimelineRow({
  card,
  tone,
  faded,
  state,
  onOpen,
}: {
  card: TimelineCard;
  tone: TimelineSegmentTone;
  faded?: boolean;
  state?: UserCardState;
  onOpen: (card: TimelineCard) => void;
}) {
  const toneStyle = segmentToneStyles[tone];

  return (
    <div className="relative pl-12">
      <span
        className={clsx(
          "absolute left-[14px] top-5 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-4",
          toneStyle.dot,
        )}
      />
      <button
        className={clsx(
          "flex w-full items-center gap-3 rounded-2xl border border-[#0d1b2a]/8 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
          faded && "opacity-80",
        )}
        onClick={() => onOpen(card)}
        type="button"
      >
        <CardThumb card={card} className="h-16 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx("wik-chip", toneStyle.chip)}>{card.card_type}</span>
            {state?.status === "done" ? (
              <span className="wik-chip bg-[#E2F0E8] text-[#234B38]">done</span>
            ) : null}
          </div>
          <h3 className="font-display mt-1 text-lg font-semibold leading-tight text-[#0d1b2a]">{card.title}</h3>
          <p className="mt-0.5 truncate text-sm text-[#697386]">{card.subtitle}</p>
        </div>
        <span className="shrink-0 self-center text-[#697386]" aria-hidden>
          →
        </span>
      </button>
    </div>
  );
}

function TimelineSegment({
  eyebrow,
  title,
  subtitle,
  tone,
  cards,
  faded,
  cardStates,
  onOpen,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  tone: TimelineSegmentTone;
  cards: TimelineCard[];
  faded?: boolean;
  cardStates: Record<string, UserCardState>;
  onOpen: (card: TimelineCard) => void;
}) {
  if (!cards.length) return null;
  const toneStyle = segmentToneStyles[tone];

  return (
    <section className="relative">
      <div
        className={clsx("absolute bottom-0 left-[14px] top-2 -translate-x-1/2 w-0.5 rounded-full", toneStyle.rail)}
        aria-hidden
      />
      <div className="relative pl-12">
        <span className={clsx("absolute left-[14px] top-1.5 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-4", toneStyle.dot)} />
        <p className={clsx("text-xs font-bold uppercase tracking-[0.2em]", toneStyle.eyebrow)}>{eyebrow}</p>
        <h2 className="font-display mt-0.5 text-2xl font-semibold text-[#0d1b2a]">{title}</h2>
        <p className="mt-0.5 text-sm leading-6 text-[#697386]">{subtitle}</p>
      </div>
      <div className="mt-3 space-y-3">
        {cards.map((card) => (
          <TimelineRow
            card={card}
            faded={faded}
            key={card.id}
            onOpen={onOpen}
            state={cardStates[card.id]}
            tone={tone}
          />
        ))}
      </div>
    </section>
  );
}

function TimelineView({
  cardStates,
  childName,
  onOpen,
  timeline,
}: {
  cardStates: Record<string, UserCardState>;
  childName: string;
  onOpen: (card: TimelineCard) => void;
  timeline: TimelineResult;
}) {
  const sortCards = (matched: MatchedCard[]) =>
    matched.map(({ card }) => card).sort((a, b) => cardSortValue(a) - cardSortValue(b));

  const overdue = sortCards(timeline.overdueCards);
  const now = sortCards([...timeline.currentCards, ...timeline.snoozedCardsDue]);
  const soon = sortCards(timeline.comingSoonCards);
  const later = sortCards(timeline.laterCards);
  const total = overdue.length + now.length + soon.length + later.length;

  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Journey map"
        title="Your timeline"
        subtitle={`Scroll from what you may have missed, through this week, to what's coming for ${childName}.`}
      />

      {total === 0 ? (
        <div className="mt-4">
          <EmptyState message="Nothing to show yet. Check your setup in Settings." />
        </div>
      ) : (
        <div className="mt-5 space-y-8">
          <TimelineSegment
            cardStates={cardStates}
            cards={overdue}
            eyebrow="Heads up"
            onOpen={onOpen}
            subtitle="Windows that have passed — worth a quick catch-up if you haven't already."
            title="You may have missed"
            tone="overdue"
          />
          <TimelineSegment
            cardStates={cardStates}
            cards={now}
            eyebrow="This week"
            onOpen={onOpen}
            subtitle="What's most likely to matter right now."
            title="On for this week"
            tone="now"
          />
          <TimelineSegment
            cardStates={cardStates}
            cards={soon}
            eyebrow="Coming soon"
            onOpen={onOpen}
            subtitle="Get ahead of these before they sneak up."
            title="What's next"
            tone="soon"
          />
          <TimelineSegment
            cardStates={cardStates}
            cards={later}
            eyebrow="Later"
            faded
            onOpen={onOpen}
            subtitle="Further down the track — no action needed yet."
            title="Down the track"
            tone="later"
          />
        </div>
      )}
    </section>
  );
}

function SavedView({
  cards,
  cardStates,
  onAction,
  onOpen,
}: {
  cards: TimelineCard[];
  cardStates: Record<string, UserCardState>;
  onAction: (cardId: string, status: UserCardStatus) => void;
  onOpen: (card: TimelineCard) => void;
}) {
  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Saved"
        title="Your saved cards"
        subtitle="A quiet place for the cards you want to come back to later."
      />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.length ? (
          cards.map((card) => (
            <TimelineCardItem
              card={card}
              key={card.id}
              onAction={onAction}
              onOpen={onOpen}
              state={cardStates[card.id]}
            />
          ))
        ) : (
          <EmptyState message="No saved cards yet. Save one from Home or Timeline." />
        )}
      </div>
    </section>
  );
}

function SettingsView({ form, onReset }: { form: OnboardingState; onReset: () => void }) {
  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <div className="wik-shell-card p-6">
        <SectionHeading
          eyebrow="Settings"
          title="Timeline setup"
          subtitle="This is local demo state for now. Supabase persistence comes next."
        />
        <dl className="mt-5 grid gap-2.5 text-sm">
          <SettingRow label="Child" value={form.childName} />
          <SettingRow label="State" value={form.state} />
          <SettingRow label="First child" value={form.firstChild ? "Yes" : "No"} />
          <SettingRow label="Childcare" value={sentenceCase(form.childcareIntention)} />
          <SettingRow label="Lookahead" value={`${sentenceCase(form.lookaheadDay)} at ${form.lookaheadTime}`} />
        </dl>
      </div>

      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#0d1b2a] p-6 text-white shadow-sm">
        <p className="wik-chip bg-white/15 text-[#FFD79A]">Demo controls</p>
        <h2 className="font-display mt-3 text-2xl font-semibold">Reset and try another setup</h2>
        <p className="mt-2 text-sm leading-6 text-white/75">
          This clears local demo state only. It does not touch Supabase migrations or seed content.
        </p>
        <button className="wik-button wik-button-sun mt-5" onClick={onReset} type="button">
          Reset demo
        </button>
      </div>
    </section>
  );
}

function ContentStudioView({
  contentHealth,
  onOpen,
}: {
  contentHealth: { card: TimelineCard; errors: string[] }[];
  onOpen: (card: TimelineCard) => void;
}) {
  const readyCount = contentHealth.filter((item) => item.errors.length === 0).length;

  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Content Studio"
        title="Card health"
        subtitle="A lightweight admin preview showing publish readiness, image status and source validation."
      />
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Publish-ready" value={readyCount} />
        <Metric label="Cards checked" value={contentHealth.length} />
        <Metric label="Needs work" value={contentHealth.length - readyCount} />
      </div>
      <div className="mt-5 space-y-3">
        {contentHealth.map(({ card, errors }) => (
          <button
            className="flex w-full items-center gap-4 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-[#0d1b2a]/5 transition hover:ring-[#0d1b2a]/20"
            key={card.id}
            onClick={() => onOpen(card)}
            type="button"
          >
            <CardThumb card={card} className="h-14 w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6FAF8E]">{card.card_type}</p>
              <h3 className="font-display text-lg font-semibold text-[#0d1b2a]">{card.title}</h3>
              <p className="mt-0.5 text-sm text-[#697386]">
                Image: {card.image_status} · Sources: {card.source_urls?.length ?? 0}
              </p>
            </div>
            <StatusPill tone={errors.length ? "bg-[#FFE0DE] text-[#7A2E2E]" : "bg-[#E2F0E8] text-[#234B38]"}>
              {errors.length ? `${errors.length} issue${errors.length === 1 ? "" : "s"}` : "Ready"}
            </StatusPill>
          </button>
        ))}
      </div>
    </section>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-[#FFF6E6] px-4 py-3">
      <dt className="font-medium text-[#697386]">{label}</dt>
      <dd className="font-bold text-[#0d1b2a]">{value}</dd>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="wik-shell-card p-4 sm:p-5">
      <p className="font-display text-3xl font-semibold text-[#1D809F] sm:text-4xl">{value}</p>
      <p className="mt-1 text-sm font-medium text-[#697386]">{label}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF6B6B]">{eyebrow}</p>
      <h2 className="font-display mt-1 text-2xl font-semibold text-[#0d1b2a]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#697386]">{subtitle}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#0d1b2a]/20 bg-white/60 p-6 text-sm font-medium text-[#697386]">
      {message}
    </div>
  );
}
