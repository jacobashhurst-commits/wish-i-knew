"use client";

import { useState, useTransition } from "react";
import { addAlphaInvite, removeAlphaInvite } from "@/app/actions/admin-invites";

type Invite = { email: string; note: string | null; created_at: string };

export function InviteManager({ initialInvites }: { initialInvites: Invite[] }) {
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
      }
    });
  }

  function handleRemove(target: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await removeAlphaInvite(target);
      if (result.error) setError(result.error);
      else setMessage(result.success ?? "Removed.");
    });
  }

  return (
    <div className="space-y-5">
      <form
        className="rounded-2xl border border-[#0d1b2a]/10 bg-white p-5 shadow-sm"
        onSubmit={handleAdd}
      >
        <h2 className="font-display text-lg font-semibold">Add tester</h2>
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
              {isPending ? "Adding…" : "Add invite"}
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
                    {invite.note || "—"} · added {new Date(invite.created_at).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <button
                  className="rounded-xl border border-[#0d1b2a]/15 px-3 py-1.5 text-xs font-semibold hover:bg-[#F7F4EC] disabled:opacity-40"
                  disabled={isPending}
                  onClick={() => handleRemove(invite.email)}
                  type="button"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
