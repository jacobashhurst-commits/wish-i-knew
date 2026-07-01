"use client";

import { useState, useTransition } from "react";
import { signInWithMagicLink } from "@/app/actions/auth";

type AuthGateProps = {
  userEmail: string | null;
  onPreviewContinue?: () => void;
};

export function AuthGate({ userEmail, onPreviewContinue }: AuthGateProps) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await signInWithMagicLink(email);

      if (result.error) {
        setError(result.error);

        return;
      }

      setMessage("Check your email for a magic link. It may take a minute.");
    });
  }

  return (
    <section className="wik-shell-card p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold text-[#0d1b2a]">Save your timeline</h2>
      <p className="mt-2 text-sm leading-6 text-[#697386]">
        Sign in with a magic link  -  no password. Your child profile and card actions stay synced across
        devices.
      </p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <label>
          <span className="text-sm font-semibold text-[#172033]">Email</span>
          <input
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </label>

        {error ? <p className="text-sm font-medium text-[#FF6B6B]">{error}</p> : null}
        {message ? <p className="text-sm font-medium text-[#1D809F]">{message}</p> : null}

        <button className="wik-button wik-button-sun w-full" disabled={isPending} type="submit">
          {isPending ? "Sending link…" : "Email me a magic link"}
        </button>
      </form>

      {onPreviewContinue ? (
        <button
          className="mt-4 w-full text-sm font-semibold text-[#697386] underline-offset-2 hover:underline"
          onClick={onPreviewContinue}
          type="button"
        >
          Continue without an account (preview only  -  not saved)
        </button>
      ) : null}
    </section>
  );
}
