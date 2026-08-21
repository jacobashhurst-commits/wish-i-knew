"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addAlphaInvite,
  removeAlphaInvite,
  resendAlphaInvite,
  type AlphaInvite,
} from "@/app/actions/admin-invites";

export function InviteManager({ initialInvites }: { initialInvites: AlphaInvite[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("Alpha tester");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await addAlphaInvite(email, note);
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Added.");
        setEmail("");
        router.refresh();
      }
    });
  }

  function handleRemove(target: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await removeAlphaInvite(target);
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Removed.");
        router.refresh();
      }
    });
  }

  function handleResend(target: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resendAlphaInvite(target);
      if (result.error) setError(result.error);
      else setMessage(result.success ?? "Sent.");
    });
  }

  return (
    <div className="space-y-5">
      <form
        className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm"
        onSubmit={handleAdd}
      >
        <h2 className="font-display text-lg font-semibold">Add tester</h2>
        <p className="mt-1 text-sm text-[#697386]">
          Saves them to the allowlist and emails a signup link (they choose their own password).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <label className="text-sm font-semibold">
            Email
            <input
              className="mt-1 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-3 py-2 text-sm"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              type="email"
              value={email}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Note
            <input
              className="mt-1 w-full rounded-xl border border-[#0d1b2a]/15 bg-[#FFFDF7] px-3 py-2 text-sm"
              onChange={(e) => setNote(e.target.value)}
              value={note}
            />
          </label>
          <div className="flex items-end">
            <button
              className="w-full rounded-xl bg-[#1D809F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Sending…" : "Invite + email"}
            </button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-[#B4423C]">{error}</p> : null}
        {message ? <p className="mt-3 text-sm text-[#1B7A4B]">{message}</p> : null}
      </form>

      <div className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold">
          Invited <span className="text-sm font-normal text-[#172033]/50">({initialInvites.length})</span>
        </h2>
        {initialInvites.length === 0 ? (
          <p className="mt-2 text-sm text-[#172033]/50">No invites yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#0d1b2a]/8">
            {initialInvites.map((invite) => (
              <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={invite.email}>
                <div>
                  <p className="text-sm font-semibold">{invite.email}</p>
                  <p className="text-xs text-[#172033]/50">
                    {invite.note || "—"} · added{" "}
                    {new Date(invite.invited_at).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl border border-[#0d1b2a]/15 px-3 py-1.5 text-xs font-semibold hover:bg-[#F7F4EC] disabled:opacity-40"
                    disabled={isPending}
                    onClick={() => handleResend(invite.email)}
                    type="button"
                  >
                    Resend email
                  </button>
                  <button
                    className="rounded-xl border border-[#0d1b2a]/15 px-3 py-1.5 text-xs font-semibold hover:bg-[#F7F4EC] disabled:opacity-40"
                    disabled={isPending}
                    onClick={() => handleRemove(invite.email)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
