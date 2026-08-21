"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { signInWithPassword, signUpWithPassword } from "@/app/actions/auth";

type AuthGateProps = {
  userEmail?: string | null;
  requireConsent?: boolean;
  showBetaNote?: boolean;
};

export function AuthGate({ userEmail, requireConsent = false, showBetaNote = false }: AuthGateProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(userEmail ?? "");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (requireConsent && !consent) {
      setError("Please agree to the Privacy Policy and Terms before continuing.");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "signin"
          ? await signInWithPassword(email, password)
          : await signUpWithPassword(email, password);

      // Successful auth redirects from the server action — no client refresh needed.
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <section className="wik-shell-card p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold text-[#0d1b2a]">
        {mode === "signin" ? "Sign in" : "Create alpha password"}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#697386]">
        Friends-and-family alpha uses email + password (no magic link). Invited emails only, then your
        timeline saves across devices.
      </p>

      {showBetaNote ? (
        <p className="mt-3 rounded-xl bg-[#FFF6E6] px-4 py-3 text-sm leading-6 text-[#172033]">
          Private beta for invited emails. Sign in, meet the product in a quick welcome, then add baby
          details and start poking around the timeline.
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

        <label>
          <span className="text-sm font-semibold text-[#172033]">Password</span>
          <input
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="mt-1.5 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-4 py-3 outline-none focus:border-[#1D809F]"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            type="password"
            value={password}
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

        <button className="wik-button wik-button-sun w-full" disabled={isPending} type="submit">
          {isPending
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : "Create password & continue"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[#697386]">
        {mode === "signin" ? (
          <>
            First visit?{" "}
            <button
              className="font-semibold text-[#1D809F] underline-offset-2 hover:underline"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              type="button"
            >
              Create a password
            </button>
          </>
        ) : (
          <>
            Already set a password?{" "}
            <button
              className="font-semibold text-[#1D809F] underline-offset-2 hover:underline"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              type="button"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </section>
  );
}
