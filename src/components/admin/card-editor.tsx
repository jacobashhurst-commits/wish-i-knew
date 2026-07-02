"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  changeCardStatus,
  duplicateCard,
  saveCard,
  uploadCardImage,
} from "@/app/actions/admin-cards";
import { validateCardForPublish } from "@/lib/content/validation";
import type { AdminCardInput, AdminCardRow } from "@/types/admin";
import { cardTypes, imageStatuses, lifeStages } from "@/types/admin";
import type { AustralianState, CardStatus, ImageStatus, TimelineCard } from "@/types/content";

const allStates: AustralianState[] = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const knownConditions: { key: string; label: string }[] = [
  { key: "first_child_only", label: "First child only" },
  { key: "childcare_yes", label: "Childcare intention: yes" },
  { key: "childcare_yes_or_unsure", label: "Childcare intention: yes or unsure" },
  { key: "born_only", label: "Born babies only" },
  { key: "unborn_only", label: "Pregnancy only" },
];

function emptyCard(): AdminCardInput {
  return {
    slug: "",
    title: "",
    subtitle: null,
    card_type: "Heads Up",
    category: "",
    life_stage: "Any",
    start_age_days: null,
    end_age_days: null,
    pregnancy_week_start: null,
    pregnancy_week_end: null,
    priority: 50,
    time_critical: false,
    emotional_tone: null,
    short_summary: "",
    wish_i_knew: "",
    why_it_matters: null,
    what_to_do_now: null,
    what_can_wait: null,
    checklist_items: [],
    parent_script: null,
    partner_prompt: null,
    shopping_items: [],
    source_urls: [],
    source_notes: null,
    medical_sensitivity: false,
    government_sensitivity: false,
    safety_sensitivity: false,
    allergy_sensitivity: false,
    feeding_sensitivity: false,
    state_specific: false,
    states: [],
    conditions: {},
    illustration_prompt: null,
    image_url: null,
    thumbnail_url: null,
    hero_image_url: null,
    image_alt: null,
    image_style: "cute 8-bit pixel art item",
    image_status: "needed",
    review_due_date: null,
    last_reviewed_at: null,
  };
}

function toInput(row: AdminCardRow): AdminCardInput {
  const input: Record<string, unknown> = { ...row };
  for (const key of ["id", "status", "version", "created_at", "updated_at", "published_at", "archived_at"]) {
    delete input[key];
  }

  return input as AdminCardInput;
}

function linesToArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-3 py-2 text-sm outline-none focus:border-[#1D809F]";
const labelClass = "block text-sm font-semibold text-[#172033]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function CardEditor({ card }: { card: AdminCardRow | null }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminCardInput>(card ? toInput(card) : emptyCard());
  const [cardId, setCardId] = useState<string | null>(card?.id ?? null);
  const [status, setStatus] = useState<CardStatus>(card?.status ?? "draft");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [publishErrors, setPublishErrors] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof AdminCardInput>(key: K, value: AdminCardInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const liveValidation = useMemo(() => {
    const candidate: TimelineCard = {
      ...form,
      id: cardId ?? "new",
      status: "published",
    };

    return validateCardForPublish(candidate);
  }, [form, cardId]);

  function run(action: () => Promise<{ error?: string; errors?: string[]; cardId?: string }>, onDone?: (id: string) => void) {
    setMessage(null);
    setError(null);
    setPublishErrors([]);

    startTransition(async () => {
      const result = await action();

      if (result.error) {
        setError(result.error);
        setPublishErrors(result.errors ?? []);
        return;
      }

      if (result.cardId && onDone) onDone(result.cardId);
      router.refresh();
    });
  }

  function handleSave() {
    run(
      () => saveCard(form, cardId),
      (id) => {
        setMessage("Card saved.");
        if (!cardId) {
          setCardId(id);
          router.replace(`/admin/cards/${id}`);
        }
      },
    );
  }

  function handleStatus(next: CardStatus) {
    if (!cardId) return;
    run(
      () => changeCardStatus(cardId, next),
      () => {
        setStatus(next);
        setMessage(next === "published" ? "Card published. It is live for matching users." : `Status changed to ${next}.`);
      },
    );
  }

  function handleDuplicate() {
    if (!cardId) return;
    run(
      () => duplicateCard(cardId),
      (id) => router.push(`/admin/cards/${id}`),
    );
  }

  function handleUpload() {
    if (!cardId || !imageFile) return;
    const data = new FormData();
    data.set("cardId", cardId);
    data.set("file", imageFile);

    run(
      () => uploadCardImage(data),
      () => {
        if (!form.image_alt?.trim()) {
          set("image_alt", form.title);
        }
        setMessage("Image uploaded and attached.");
        setImageFile(null);
        router.refresh();
      },
    );
  }

  const suggestedPrompt = `${form.image_style ?? "cute 8-bit pixel art item"}: ${form.title}. ${form.short_summary}`;

  async function copyIllustrationPrompt() {
    const text = form.illustration_prompt?.trim() || suggestedPrompt;
    await navigator.clipboard.writeText(text);
    setMessage("Illustration prompt copied.");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-5">
        <Section title="Identity">
          <label className={labelClass}>
            Title
            <input className={inputClass} onChange={(e) => set("title", e.target.value)} value={form.title} />
          </label>
          <label className={labelClass}>
            Slug
            <input className={inputClass} onChange={(e) => set("slug", e.target.value)} value={form.slug} />
          </label>
          <label className={labelClass}>
            Subtitle
            <input
              className={inputClass}
              onChange={(e) => set("subtitle", e.target.value || null)}
              value={form.subtitle ?? ""}
            />
          </label>
          <label className={labelClass}>
            Category
            <input
              className={inputClass}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Health / Immunisation"
              value={form.category}
            />
          </label>
          <label className={labelClass}>
            Card type
            <select className={inputClass} onChange={(e) => set("card_type", e.target.value)} value={form.card_type}>
              {cardTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "quiet_week" ? "Quiet week (fallback)" : type}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Life stage
            <select className={inputClass} onChange={(e) => set("life_stage", e.target.value)} value={form.life_stage}>
              {lifeStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
              {!lifeStages.includes(form.life_stage as (typeof lifeStages)[number]) ? (
                <option value={form.life_stage}>{form.life_stage}</option>
              ) : null}
            </select>
          </label>
          <label className={labelClass}>
            Priority (higher shows first)
            <input
              className={inputClass}
              onChange={(e) => set("priority", numberOrNull(e.target.value) ?? 0)}
              type="number"
              value={form.priority}
            />
          </label>
          <label className="flex items-center gap-2 self-end text-sm font-semibold">
            <input
              checked={form.time_critical}
              onChange={(e) => set("time_critical", e.target.checked)}
              type="checkbox"
            />
            Time-critical (may appear as overdue)
          </label>
        </Section>

        <Section title="Timing window">
          <label className={labelClass}>
            Start age (days)
            <input
              className={inputClass}
              onChange={(e) => set("start_age_days", numberOrNull(e.target.value))}
              type="number"
              value={form.start_age_days ?? ""}
            />
          </label>
          <label className={labelClass}>
            End age (days)
            <input
              className={inputClass}
              onChange={(e) => set("end_age_days", numberOrNull(e.target.value))}
              type="number"
              value={form.end_age_days ?? ""}
            />
          </label>
          <label className={labelClass}>
            Pregnancy week start
            <input
              className={inputClass}
              onChange={(e) => set("pregnancy_week_start", numberOrNull(e.target.value))}
              type="number"
              value={form.pregnancy_week_start ?? ""}
            />
          </label>
          <label className={labelClass}>
            Pregnancy week end
            <input
              className={inputClass}
              onChange={(e) => set("pregnancy_week_end", numberOrNull(e.target.value))}
              type="number"
              value={form.pregnancy_week_end ?? ""}
            />
          </label>
          {form.card_type === "quiet_week" ? (
            <p className="text-xs text-[#172033]/60 sm:col-span-2">
              Quiet-week cards need no window  -  they are served as a fallback when a week has nothing scheduled.
            </p>
          ) : null}
        </Section>

        <Section title="Content">
          <label className={`${labelClass} sm:col-span-2`}>
            Short summary
            <textarea
              className={inputClass}
              onChange={(e) => set("short_summary", e.target.value)}
              rows={2}
              value={form.short_summary}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Wish I knew (the one-liner insight)
            <textarea
              className={inputClass}
              onChange={(e) => set("wish_i_knew", e.target.value)}
              rows={2}
              value={form.wish_i_knew}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Why it matters
            <textarea
              className={inputClass}
              onChange={(e) => set("why_it_matters", e.target.value || null)}
              rows={3}
              value={form.why_it_matters ?? ""}
            />
          </label>
          <label className={labelClass}>
            What to do now
            <textarea
              className={inputClass}
              onChange={(e) => set("what_to_do_now", e.target.value || null)}
              rows={3}
              value={form.what_to_do_now ?? ""}
            />
          </label>
          <label className={labelClass}>
            What can wait
            <textarea
              className={inputClass}
              onChange={(e) => set("what_can_wait", e.target.value || null)}
              rows={3}
              value={form.what_can_wait ?? ""}
            />
          </label>
          <label className={labelClass}>
            Parent script (optional)
            <textarea
              className={inputClass}
              onChange={(e) => set("parent_script", e.target.value || null)}
              rows={2}
              value={form.parent_script ?? ""}
            />
          </label>
          <label className={labelClass}>
            Partner prompt (optional)
            <textarea
              className={inputClass}
              onChange={(e) => set("partner_prompt", e.target.value || null)}
              rows={2}
              value={form.partner_prompt ?? ""}
            />
          </label>
          <label className={labelClass}>
            Checklist items (one per line)
            <textarea
              className={inputClass}
              onChange={(e) => set("checklist_items", linesToArray(e.target.value))}
              rows={4}
              defaultValue={form.checklist_items.join("\n")}
            />
          </label>
          <label className={labelClass}>
            Shopping items (one per line)
            <textarea
              className={inputClass}
              onChange={(e) => set("shopping_items", linesToArray(e.target.value))}
              rows={4}
              defaultValue={form.shopping_items.join("\n")}
            />
          </label>
        </Section>

        <Section title="Sources & review">
          <label className={`${labelClass} sm:col-span-2`}>
            Source URLs (one per line)
            <textarea
              className={inputClass}
              onChange={(e) => set("source_urls", linesToArray(e.target.value))}
              rows={3}
              defaultValue={form.source_urls.join("\n")}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Source notes
            <textarea
              className={inputClass}
              onChange={(e) => set("source_notes", e.target.value || null)}
              rows={2}
              value={form.source_notes ?? ""}
            />
          </label>
          <label className={labelClass}>
            Last reviewed
            <input
              className={inputClass}
              onChange={(e) => set("last_reviewed_at", e.target.value || null)}
              type="date"
              value={form.last_reviewed_at ?? ""}
            />
          </label>
          <label className={labelClass}>
            Review due
            <input
              className={inputClass}
              onChange={(e) => set("review_due_date", e.target.value || null)}
              type="date"
              value={form.review_due_date ?? ""}
            />
          </label>
        </Section>

        <Section title="Sensitivity & audience">
          <div className="space-y-2 text-sm font-semibold">
            {(
              [
                ["medical_sensitivity", "Medical"],
                ["government_sensitivity", "Government / entitlements"],
                ["safety_sensitivity", "Safety"],
                ["allergy_sensitivity", "Allergy"],
                ["feeding_sensitivity", "Feeding"],
              ] as const
            ).map(([key, label]) => (
              <label className="flex items-center gap-2" key={key}>
                <input checked={form[key]} onChange={(e) => set(key, e.target.checked)} type="checkbox" />
                {label} sensitivity
              </label>
            ))}
          </div>
          <div className="space-y-2 text-sm font-semibold">
            {knownConditions.map(({ key, label }) => (
              <label className="flex items-center gap-2" key={key}>
                <input
                  checked={form.conditions[key] === true}
                  onChange={(e) => {
                    const next = { ...form.conditions };
                    if (e.target.checked) next[key] = true;
                    else delete next[key];
                    set("conditions", next);
                  }}
                  type="checkbox"
                />
                {label}
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              checked={form.state_specific}
              onChange={(e) => set("state_specific", e.target.checked)}
              type="checkbox"
            />
            State-specific card
          </label>
          {form.state_specific ? (
            <div className="flex flex-wrap gap-2 text-sm font-semibold sm:col-span-2">
              {allStates.map((state) => (
                <label
                  className={`rounded-full border px-3 py-1 ${form.states.includes(state) ? "border-[#0d1b2a] bg-[#0d1b2a] text-white" : "border-[#0d1b2a]/20"}`}
                  key={state}
                >
                  <input
                    checked={form.states.includes(state)}
                    className="sr-only"
                    onChange={(e) =>
                      set(
                        "states",
                        e.target.checked
                          ? [...form.states, state]
                          : form.states.filter((s) => s !== state),
                      )
                    }
                    type="checkbox"
                  />
                  {state}
                </label>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="Image">
          <div className={`${labelClass} sm:col-span-2`}>
            <div className="flex items-center justify-between gap-3">
              <span>Illustration prompt</span>
              <button
                className="rounded-lg border border-[#0d1b2a]/15 px-3 py-1.5 text-xs font-semibold text-[#172033] hover:border-[#1D809F]"
                onClick={() => {
                  void copyIllustrationPrompt();
                }}
                type="button"
              >
                Copy prompt
              </button>
            </div>
            <textarea
              className={inputClass}
              onChange={(e) => set("illustration_prompt", e.target.value || null)}
              placeholder={suggestedPrompt}
              rows={2}
              value={form.illustration_prompt ?? ""}
            />
          </div>
          <label className={labelClass}>
            Image URL
            <input
              className={inputClass}
              onChange={(e) => set("image_url", e.target.value || null)}
              value={form.image_url ?? ""}
            />
          </label>
          <label className={labelClass}>
            Image alt text
            <input
              className={inputClass}
              onChange={(e) => set("image_alt", e.target.value || null)}
              value={form.image_alt ?? ""}
            />
          </label>
          <label className={labelClass}>
            Image style
            <input
              className={inputClass}
              onChange={(e) => set("image_style", e.target.value || null)}
              value={form.image_style ?? ""}
            />
          </label>
          <label className={labelClass}>
            Image status
            <select
              className={inputClass}
              onChange={(e) => set("image_status", e.target.value as ImageStatus)}
              value={form.image_status}
            >
              {imageStatuses.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={form.image_alt ?? "Card image preview"}
              className="h-32 w-32 rounded-xl border border-[#0d1b2a]/10 object-cover"
              src={form.image_url}
            />
          ) : null}
          <div className="sm:col-span-2">
            <span className={labelClass}>Upload to Storage</span>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <input
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                type="file"
              />
              <button
                className="rounded-xl bg-[#0d1b2a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                disabled={!cardId || !imageFile || isPending}
                onClick={handleUpload}
                type="button"
              >
                Upload image
              </button>
              {!cardId ? <span className="text-xs text-[#172033]/60">Save the card first.</span> : null}
            </div>
          </div>
        </Section>
      </div>

      <aside className="space-y-5">
        <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Lifecycle</h2>
          <p className="mt-1 text-sm text-[#172033]/70">
            Current status: <span className="font-semibold">{status}</span>
          </p>

          <div className="mt-4 flex flex-col gap-2">
            <button
              className="rounded-xl bg-[#0d1b2a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              disabled={isPending}
              onClick={handleSave}
              type="button"
            >
              {cardId ? "Save changes" : "Create card"}
            </button>

            {cardId && (status === "draft" || status === "idea" || status === "needs_review") ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus("in_review")}
                type="button"
              >
                Submit for review
              </button>
            ) : null}

            {cardId && status === "in_review" ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus("approved")}
                type="button"
              >
                Approve
              </button>
            ) : null}

            {cardId && (status === "approved" || status === "in_review" || status === "draft") ? (
              <button
                className="rounded-xl bg-[#1B7A4B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                disabled={isPending || liveValidation.length > 0}
                onClick={() => handleStatus("published")}
                type="button"
              >
                Publish
              </button>
            ) : null}

            {cardId && status === "published" ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus("approved")}
                type="button"
              >
                Unpublish (back to approved)
              </button>
            ) : null}

            {cardId && status !== "archived" ? (
              <button
                className="rounded-xl border border-[#B4423C]/30 px-4 py-2.5 text-sm font-semibold text-[#B4423C] disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus("archived")}
                type="button"
              >
                Archive
              </button>
            ) : null}

            {cardId && status === "archived" ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus("draft")}
                type="button"
              >
                Restore to draft
              </button>
            ) : null}

            {cardId ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                disabled={isPending}
                onClick={handleDuplicate}
                type="button"
              >
                Duplicate card
              </button>
            ) : null}
          </div>

          {message ? <p className="mt-3 text-sm font-semibold text-[#1B7A4B]">{message}</p> : null}
          {error ? <p className="mt-3 text-sm font-semibold text-[#B4423C]">{error}</p> : null}
          {publishErrors.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#B4423C]">
              {publishErrors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Publish readiness</h2>
          {liveValidation.length === 0 ? (
            <p className="mt-2 text-sm font-semibold text-[#1B7A4B]">
              All publish checks pass.
            </p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#B4423C]">
              {liveValidation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
