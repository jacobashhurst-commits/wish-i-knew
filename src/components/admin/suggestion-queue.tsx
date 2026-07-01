"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  promoteSuggestionToCard,
  setSuggestionStatus,
} from "@/app/actions/admin-suggestions";
import type { AdminSuggestionRow } from "@/types/admin";
import type { SuggestionStatus } from "@/types/content";

const statusTone: Record<SuggestionStatus, string> = {
  new: "bg-[#FFF3DB] text-[#9A6B15]",
  reviewed: "bg-[#E7F1FB] text-[#1D5C9F]",
  accepted: "bg-[#E4F5EC] text-[#1B7A4B]",
  declined: "bg-[#EDEDED] text-[#77746E]",
};

export function SuggestionQueue({ suggestions }: { suggestions: AdminSuggestionRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatus(id: string, status: SuggestionStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setSuggestionStatus(id, status);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handlePromote(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await promoteSuggestionToCard(id);
      if (result.error) setError(result.error);
      else if (result.cardId) router.push(`/admin/cards/${result.cardId}`);
    });
  }

  if (suggestions.length === 0) {
    return (
      <p className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-8 text-center text-sm text-[#172033]/50 shadow-sm">
        No suggestions yet. When parents send ideas from Settings, they land here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm font-semibold text-[#B4423C]">{error}</p> : null}
      {suggestions.map((suggestion) => (
        <article
          className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm"
          key={suggestion.id}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">{suggestion.title}</h2>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[suggestion.status]}`}
            >
              {suggestion.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#172033]/80">{suggestion.body}</p>
          {suggestion.suggested_timing ? (
            <p className="mt-1 text-sm text-[#1D809F]">
              Suggested timing: {suggestion.suggested_timing}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-[#172033]/40">
            Sent {new Date(suggestion.created_at).toLocaleDateString("en-AU")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
            <button
              className="rounded-xl bg-[#0d1b2a] px-4 py-2 text-white disabled:opacity-40"
              disabled={isPending}
              onClick={() => handlePromote(suggestion.id)}
              type="button"
            >
              Promote to draft card
            </button>
            {suggestion.status !== "reviewed" ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2 disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus(suggestion.id, "reviewed")}
                type="button"
              >
                Mark reviewed
              </button>
            ) : null}
            {suggestion.status !== "declined" ? (
              <button
                className="rounded-xl border border-[#0d1b2a]/20 px-4 py-2 text-[#77746E] disabled:opacity-40"
                disabled={isPending}
                onClick={() => handleStatus(suggestion.id, "declined")}
                type="button"
              >
                Decline
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
