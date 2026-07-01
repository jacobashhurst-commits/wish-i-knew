"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signInWithMagicLink } from "@/app/actions/auth";

type AuthGateProps = {
  userEmail?: string | null;
  requireConsent?: boolean;
  showBetaNote?: boolean;
};

export function AuthGate({ userEmail, requireConsent = false, showBetaNote = false }: AuthGateProps) {
  const [email, setEmail] = useState(userEmail ?? "");
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (requireConsent && !consent) {
      setError("Please agree to the Privacy Policy and Terms before continuing.");
      return;
    }

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
      <h2 className="font-display text-2xl font-semibold text-[#0d1b2a]">Email me a magic link</h2>
      <p className="mt-2 text-sm leading-6 text-[#697386]">
        Sign in with a magic link. No password. Your child profile and card actions stay synced across devices.
      </p>

      {showBetaNote ? (
        <p className="mt-3 rounded-xl bg-[#FFF6E6] px-4 py-3 text-sm leading-6 text-[#172033]">
          This is a private friends-and-family beta. Only invited emails can create an account right now.
        </p>
      ) : null}

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

        {requireConsent ? (
          <label className="flex items-start gap-3 text-sm leading-6 text-[#697386]">
            <input
              checked={consent}
              className="mt-1"
              onChange={(event) => setConsent(event.target.checked)}
              type="checkbox"
            />
            <span>
              I agree to the{" "}
              <Link className="font-semibold text-[#1D809F] underline-offset-2 hover:underline" href="/privacy">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link className="font-semibold text-[#1D809F] underline-offset-2 hover:underline" href="/terms">
                Terms of Use
              </Link>
              .
            </span>
          </label>
        ) : null}

        {error ? <p className="text-sm font-medium text-[#FF6B6B]">{error}</p> : null}
        {message ? <p className="text-sm font-medium text-[#1D809F]">{message}</p> : null}

        <button className="wik-button wik-button-sun w-full" disabled={isPending} type="submit">
          {isPending ? "Sending link…" : "Email me a magic link"}
        </button>
      </form>
    </section>
  );
}
