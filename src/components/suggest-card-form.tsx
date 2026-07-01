"use client";

import { useState, useTransition } from "react";
import { submitCardSuggestion } from "@/app/actions/suggestions";

export function SuggestCardForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [timing, setTiming] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await submitCardSuggestion({
        title,
        body,
        suggestedTiming: timing,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setTitle("");
      setBody("");
      setTiming("");
      setMessage("Thanks  -  we read every suggestion. No pressure, no perfect-parent energy.");
    });
  }

  return (
    <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
      <label>
        <span className="text-sm font-semibold text-[#172033]">Title</span>
        <input
          className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Something I wish I'd known…"
          value={title}
        />
      </label>
      <label>
        <span className="text-sm font-semibold text-[#172033]">What would help?</span>
        <textarea
          className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
          onChange={(event) => setBody(event.target.value)}
          placeholder="A calm, practical card idea for other Australian parents."
          rows={3}
          value={body}
        />
      </label>
      <label>
        <span className="text-sm font-semibold text-[#172033]">When would it matter? (optional)</span>
        <input
          className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
          onChange={(event) => setTiming(event.target.value)}
          placeholder="e.g. around 6 months, before daycare"
          value={timing}
        />
      </label>
      {error ? <p className="text-sm font-medium text-[#FF6B6B]">{error}</p> : null}
      {message ? <p className="text-sm font-medium text-[#1D809F]">{message}</p> : null}
      <button className="wik-button wik-button-sun" disabled={isPending} type="submit">
        {isPending ? "Sending…" : "Send suggestion"}
      </button>
    </form>
  );
}
