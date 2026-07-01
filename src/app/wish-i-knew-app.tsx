"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { saveOnboarding } from "@/app/actions/onboarding";
import { upsertCardState } from "@/app/actions/card-states";
import { signOut } from "@/app/actions/auth";
import { updateChildJourneyStatus } from "@/app/actions/journey";
import { AuthGate } from "@/components/auth-gate";
import { SuggestCardForm } from "@/components/suggest-card-form";
import clsx from "@/lib/clsx";
import { timelineHorizonDays } from "@/lib/content/bundled-cards";
import { validateCardForPublish } from "@/lib/content/validation";
import { calculateAgeInDays, calculatePregnancyWeek } from "@/lib/timeline/dates";
import { buildTimeline } from "@/lib/timeline/matching";
import type { MatchedCard, TimelineProfile, TimelineResult } from "@/lib/timeline/types";
import type {
  AppInitialData,
  AppMode,
  LookaheadDay,
  OnboardingState,
} from "@/types/app";
import { defaultOnboarding } from "@/types/app";
import type {
  AustralianState,
  ChildcareIntention,
  ChildJourneyStatus,
  TimelineCard,
  UserCardState,
  UserCardStatus,
} from "@/types/content";

type AppView = "home" | "timeline" | "saved" | "settings" | "admin";

const demoStorageKey = "wish-i-knew-demo-state";

const cardTypeStyles: Record<string, string> = {
  "Big Milestone": "bg-[#FFE3C2] text-[#5A3A14]",
  "Tiny Gear Shift": "bg-[#D7F3F1] text-[#0E4D52]",
  "Heads Up": "bg-[#FFE0DE] text-[#7A2E2E]",
  "Admin Trap": "bg-[#E7ECF5] text-[#1B2A45]",
  "Parent Sanity": "bg-[#ECE4FB] text-[#3F2A6E]",
  "Aussie System": "bg-[#E2F0E8] text-[#234B38]",
  "Fun First": "bg-[#FFF0C7] text-[#6A4E12]",
};

const states: AustralianState[] = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

type PreviewState = {
  form: OnboardingState;
  hasOnboarded: boolean;
  cardStates: Record<string, UserCardState>;
};
function isStoredPreviewState(value: unknown): value is Partial<PreviewState> {
  return typeof value === "object" && value !== null;
}

function readStoredPreviewState(): Partial<PreviewState> {
  if (typeof window === "undefined") return {};

  const stored = window.localStorage.getItem(demoStorageKey);
  if (!stored) return {};

  try {
    const parsed: unknown = JSON.parse(stored);

    return isStoredPreviewState(parsed) ? parsed : {};
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

function makeProfile(
  form: OnboardingState,
  currentDate: string,
  journeyStatus: ChildJourneyStatus = "active",
): TimelineProfile {
  return {
    currentDate,
    birthDate: form.isBorn ? form.birthDate : null,
    dueDate: form.isBorn ? null : form.dueDate,
    isBorn: form.isBorn,
    state: form.state,
    firstChild: form.firstChild,
    childcareIntention: form.childcareIntention,
    journeyStatus,
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
  mode,
  userEmail,
  isSubmitting,
  submitError,
  onPreviewContinue,
}: {
  form: OnboardingState;
  setForm: (form: OnboardingState) => void;
  onSubmit: () => void;
  mode: AppMode;
  userEmail: string | null;
  isSubmitting?: boolean;
  submitError?: string | null;
  onPreviewContinue?: () => void;
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

        <div className="space-y-4">
          {mode === "preview" ? (
            <AuthGate onPreviewContinue={onPreviewContinue} userEmail={userEmail} />
          ) : (
            <div className="wik-shell-card p-4 text-sm text-[#697386]">
              Signed in as <span className="font-semibold text-[#0d1b2a]">{userEmail}</span>
            </div>
          )}

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

            {form.isBorn ? (
              <label>
                <span className="text-sm font-semibold text-[#172033]">Original due date (optional)</span>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  type="date"
                  value={form.dueDate}
                />
                <p className="mt-1 text-xs text-[#172033]/60">
                  Helps us show pregnancy-era cards you might still find useful.
                </p>
              </label>
            ) : null}

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

          {submitError ? <p className="mt-3 text-sm font-medium text-[#FF6B6B]">{submitError}</p> : null}

          <button
            className="wik-button wik-button-sun mt-6 w-full text-base"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving…" : "Show my timeline"}
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}

function getInitialClientState(initialData: AppInitialData) {
  if (initialData.mode === "authenticated") {
    return {
      form: initialData.form,
      hasOnboarded: initialData.hasOnboarded,
      cardStates: initialData.cardStates,
      previewReady: true,
    };
  }

  const stored = readStoredPreviewState();

  return {
    form: stored.form ?? initialData.form,
    hasOnboarded: stored.hasOnboarded ?? false,
    cardStates: stored.cardStates ?? initialData.cardStates,
    previewReady: Boolean(stored.hasOnboarded),
  };
}

export default function WishIKnewApp({ initialData }: { initialData: AppInitialData }) {
  const router = useRouter();
  const initialClient = getInitialClientState(initialData);
  const [mode] = useState<AppMode>(initialData.mode);
  const [userEmail] = useState(initialData.userEmail);
  const [childId, setChildId] = useState(initialData.childId);
  const [childStatus, setChildStatus] = useState<ChildJourneyStatus>(initialData.childStatus);
  const [form, setForm] = useState(initialClient.form);
  const [hasOnboarded, setHasOnboarded] = useState(initialClient.hasOnboarded);
  const [cardStates, setCardStates] = useState(initialClient.cardStates);
  const [cards] = useState(initialData.cards);
  const [previewReady, setPreviewReady] = useState(initialClient.previewReady);
  const [activeView, setActiveView] = useState<AppView>("home");
  const [selectedCard, setSelectedCard] = useState<TimelineCard | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentDate] = useState(() => todayIso());
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [, startActionTransition] = useTransition();

  useEffect(() => {
    if (mode !== "preview" || !previewReady) return;

    window.localStorage.setItem(
      demoStorageKey,
      JSON.stringify({ form, hasOnboarded, cardStates }),
    );
  }, [cardStates, form, hasOnboarded, mode, previewReady]);

  // Deep links from the weekly email: /?card=slug or /?card=slug&action=save
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("card");
    if (!slug) return;

    const target = cards.find((item) => item.slug === slug);
    if (!target) return;

    // Synchronizing state from the URL (external system) on first mount only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCard(target);
    if (params.get("action") === "save") {
      handleAction(target.id, "saved");
    }

    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profile = useMemo(
    () => makeProfile(form, currentDate, childStatus),
    [form, currentDate, childStatus],
  );
  const userCardStates = useMemo(() => Object.values(cardStates), [cardStates]);
  const timeline = useMemo(
    () =>
      buildTimeline({
        profile,
        cards,
        userCardStates,
        comingSoonDays: timelineHorizonDays,
        recentPastDays: timelineHorizonDays,
      }),
    [profile, userCardStates, cards],
  );

  const savedCards = useMemo(
    () => cards.filter((card) => cardStates[card.id]?.status === "saved"),
    [cards, cardStates],
  );
  const doneCount = useMemo(
    () => Object.values(cardStates).filter((state) => state.status === "done").length,
    [cardStates],
  );
  const contentHealth = useMemo(
    () => cards.map((card) => ({ card, errors: validateCardForPublish(card) })),
    [cards],
  );

  function handleOnboardingSubmit() {
    setSubmitError(null);

    if (mode === "preview") {
      setPreviewReady(true);
      setHasOnboarded(true);
      return;
    }

    startSubmitTransition(async () => {
      const result = await saveOnboarding(form, childId);

      if (result.error) {
        setSubmitError(result.error);
        return;
      }

      if (result.childId) {
        setChildId(result.childId);
      }

      setHasOnboarded(true);
      router.refresh();
    });
  }

  function handleAction(cardId: string, status: UserCardStatus) {
    const nextState: UserCardState = {
      card_id: cardId,
      status,
      snoozed_until: status === "snoozed" ? addDays(currentDate, 7) : null,
    };

    setCardStates((current) => ({ ...current, [cardId]: nextState }));

    if (mode !== "authenticated" || !childId) return;

    startActionTransition(async () => {
      const result = await upsertCardState({
        childId,
        cardId,
        status,
        snoozedUntil: nextState.snoozed_until,
      });

      if (result.error) {
        router.refresh();
      }
    });
  }

  function resetPreview() {
    window.localStorage.removeItem(demoStorageKey);
    setForm(defaultOnboarding);
    setHasOnboarded(false);
    setCardStates({});
    setActiveView("home");
  }

  if (!hasOnboarded) {
    return (
      <Onboarding
        form={form}
        isSubmitting={isSubmitting}
        mode={mode}
        onPreviewContinue={() => setPreviewReady(true)}
        onSubmit={handleOnboardingSubmit}
        setForm={setForm}
        submitError={submitError}
        userEmail={userEmail}
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
              {mode === "authenticated" && userEmail ? (
                <p className="mt-2 text-xs text-white/55">Signed in as {userEmail}</p>
              ) : (
                <p className="mt-2 text-xs text-white/55">Preview mode — sign in to save progress</p>
              )}
              <button
                className="wik-button wik-button-sun mt-5"
                onClick={() => setHasOnboarded(false)}
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
            libraryCount={cards.length}
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

        {activeView === "settings" ? (
          <SettingsView
            childId={childId}
            childStatus={childStatus}
            form={form}
            mode={mode}
            onJourneyStatusChange={setChildStatus}
            onResetPreview={resetPreview}
            userEmail={userEmail}
          />
        ) : null}

        {activeView === "admin" && initialData.isAdmin ? (
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
  libraryCount,
  onOpen,
  timeline,
}: {
  cardStates: Record<string, UserCardState>;
  childName: string;
  libraryCount: number;
  onOpen: (card: TimelineCard) => void;
  timeline: TimelineResult;
}) {
  const sortCards = (matched: MatchedCard[]) =>
    matched.map(({ card }) => card).sort((a, b) => cardSortValue(a) - cardSortValue(b));

  const missed = sortCards([...timeline.overdueCards, ...timeline.recentPastCards]);
  const now = sortCards([...timeline.currentCards, ...timeline.snoozedCardsDue]);
  const soon = sortCards(timeline.comingSoonCards);
  const later = sortCards(timeline.laterCards);
  const total = missed.length + now.length + soon.length + later.length;

  return (
    <section className="mt-6">
      <SectionHeading
        eyebrow="Journey map"
        title="Your timeline"
        subtitle={`About ${timelineHorizonDays} days behind and ahead — scroll from what you may have missed, through this week, to what's coming for ${childName}.`}
      />

      <p className="mt-2 text-sm text-[#697386]">
        Showing {total} card{total === 1 ? "" : "s"} for your profile · {libraryCount} in the library
      </p>

      {total === 0 ? (
        <div className="mt-4">
          <EmptyState message="Nothing to show yet. Check your setup in Settings." />
        </div>
      ) : (
        <div className="mt-5 space-y-8">
          <TimelineSegment
            cardStates={cardStates}
            cards={missed}
            eyebrow="Heads up"
            onOpen={onOpen}
            subtitle={`The last ${timelineHorizonDays} days — worth a quick catch-up if you haven't already.`}
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
            subtitle={`The next ${timelineHorizonDays} days — get ahead before these sneak up.`}
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

function SettingsView({
  childId,
  childStatus,
  form,
  mode,
  onJourneyStatusChange,
  userEmail,
  onResetPreview,
}: {
  childId: string | null;
  childStatus: ChildJourneyStatus;
  form: OnboardingState;
  mode: AppMode;
  onJourneyStatusChange: (status: ChildJourneyStatus) => void;
  userEmail: string | null;
  onResetPreview: () => void;
}) {
  const router = useRouter();
  const [journeyError, setJourneyError] = useState<string | null>(null);
  const [isUpdatingJourney, startJourneyTransition] = useTransition();

  function handleJourneyChange(status: ChildJourneyStatus) {
    if (!childId) return;

    setJourneyError(null);
    startJourneyTransition(async () => {
      const result = await updateChildJourneyStatus(childId, status);

      if (result.error) {
        setJourneyError(result.error);
        return;
      }

      onJourneyStatusChange(status);
      router.refresh();
    });
  }

  const journeyLabel =
    childStatus === "active" ? "Active" : childStatus === "paused" ? "Paused" : "Ended";

  return (
    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <div className="wik-shell-card p-6">
        <SectionHeading
          eyebrow="Settings"
          title="Timeline setup"
          subtitle={
            mode === "authenticated"
              ? "Your profile is saved in Supabase."
              : "Preview mode — sign in to persist your timeline."
          }
        />
        <dl className="mt-5 grid gap-2.5 text-sm">
          {userEmail ? <SettingRow label="Email" value={userEmail} /> : null}
          <SettingRow label="Child" value={form.childName} />
          <SettingRow label="State" value={form.state} />
          <SettingRow label="First child" value={form.firstChild ? "Yes" : "No"} />
          <SettingRow label="Childcare" value={sentenceCase(form.childcareIntention)} />
          <SettingRow label="Lookahead" value={`${sentenceCase(form.lookaheadDay)} at ${form.lookaheadTime}`} />
          {mode === "authenticated" && childId ? (
            <SettingRow label="Journey" value={journeyLabel} />
          ) : null}
        </dl>
      </div>

      {mode === "authenticated" && childId ? (
        <div className="wik-shell-card p-6">
          <SectionHeading
            eyebrow="Journey"
            title="Pause or end your timeline"
            subtitle="Life changes. You can pause reminders or end this journey anytime — no guilt, no perfect-parent energy."
          />
          <div className="mt-5 flex flex-wrap gap-2">
            {childStatus !== "active" ? (
              <button
                className="wik-button wik-button-sun"
                disabled={isUpdatingJourney}
                onClick={() => handleJourneyChange("active")}
                type="button"
              >
                Resume timeline
              </button>
            ) : null}
            {childStatus !== "paused" ? (
              <button
                className="wik-button border border-[#0d1b2a]/15 bg-white text-[#172033] hover:border-[#0d1b2a]/40"
                disabled={isUpdatingJourney}
                onClick={() => handleJourneyChange("paused")}
                type="button"
              >
                Pause timeline
              </button>
            ) : null}
            {childStatus !== "ended" ? (
              <button
                className="wik-button border border-[#FF6B6B]/30 bg-[#FFF5F5] text-[#FF6B6B] hover:border-[#FF6B6B]/60"
                disabled={isUpdatingJourney}
                onClick={() => handleJourneyChange("ended")}
                type="button"
              >
                End journey
              </button>
            ) : null}
          </div>
          {journeyError ? <p className="mt-3 text-sm font-medium text-[#FF6B6B]">{journeyError}</p> : null}
        </div>
      ) : null}

      {mode === "authenticated" ? (
        <div className="wik-shell-card p-6 lg:col-span-2">
          <SectionHeading
            eyebrow="Suggest a card"
            title="Something you wish you'd known?"
            subtitle="Tell us what would have helped. We read every suggestion."
          />
          <SuggestCardForm />
        </div>
      ) : null}

      <div className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#0d1b2a] p-6 text-white shadow-sm">
        {mode === "authenticated" ? (
          <>
            <p className="wik-chip bg-white/15 text-[#FFD79A]">Account</p>
            <h2 className="font-display mt-3 text-2xl font-semibold">Sign out</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Your timeline stays saved. You can sign back in with a magic link anytime.
            </p>
            <form action={signOut}>
              <button className="wik-button wik-button-sun mt-5" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="wik-chip bg-white/15 text-[#FFD79A]">Preview controls</p>
            <h2 className="font-display mt-3 text-2xl font-semibold">Reset preview</h2>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Clears local preview data only. Nothing is stored on the server until you sign in.
            </p>
            <button className="wik-button wik-button-sun mt-5" onClick={onResetPreview} type="button">
              Reset preview
            </button>
          </>
        )}
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
      <a
        className="wik-button wik-button-sun mt-4 inline-block"
        href="/admin"
      >
        Open the full Content Studio
      </a>
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
