import Link from "next/link";
import { fetchAdminCards } from "@/lib/data/admin";
import { validateCardForPublish } from "@/lib/content/validation";
import { cardStatuses, cardTypes, lifeStages } from "@/types/admin";

const statusTone: Record<string, string> = {
  published: "bg-[#E4F5EC] text-[#1B7A4B]",
  approved: "bg-[#E7F1FB] text-[#1D5C9F]",
  in_review: "bg-[#FFF3DB] text-[#9A6B15]",
  draft: "bg-[#F0EEE9] text-[#5B5851]",
  idea: "bg-[#F0EEE9] text-[#5B5851]",
  needs_review: "bg-[#FDEAEA] text-[#B4423C]",
  archived: "bg-[#EDEDED] text-[#77746E]",
};

function formatWindow(card: {
  start_age_days: number | null;
  end_age_days: number | null;
  pregnancy_week_start: number | null;
  pregnancy_week_end: number | null;
  card_type: string;
}): string {
  if (card.card_type === "quiet_week") return "Quiet week (fallback)";
  if (card.start_age_days !== null && card.end_age_days !== null) {
    return `Day ${card.start_age_days}–${card.end_age_days}`;
  }
  if (card.pregnancy_week_start !== null && card.pregnancy_week_end !== null) {
    return `Week ${card.pregnancy_week_start}–${card.pregnancy_week_end}`;
  }
  return "No window";
}

export default async function AdminCardsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const lifeStage = typeof params.life_stage === "string" ? params.life_stage : "";
  const cardType = typeof params.card_type === "string" ? params.card_type : "";
  const search = typeof params.q === "string" ? params.q : "";

  const cards = await fetchAdminCards({ status, lifeStage, cardType, search });

  return (
    <section>
      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#0d1b2a]/10 bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="font-semibold">Search</span>
          <input
            className="mt-1 block w-48 rounded-xl border border-[#0d1b2a]/15 px-3 py-2"
            defaultValue={search}
            name="q"
            placeholder="Title or slug"
          />
        </label>
        <label className="text-sm">
          <span className="font-semibold">Status</span>
          <select
            className="mt-1 block rounded-xl border border-[#0d1b2a]/15 px-3 py-2"
            defaultValue={status}
            name="status"
          >
            <option value="">All</option>
            {cardStatuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold">Life stage</span>
          <select
            className="mt-1 block rounded-xl border border-[#0d1b2a]/15 px-3 py-2"
            defaultValue={lifeStage}
            name="life_stage"
          >
            <option value="">All</option>
            {lifeStages.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="font-semibold">Card type</span>
          <select
            className="mt-1 block rounded-xl border border-[#0d1b2a]/15 px-3 py-2"
            defaultValue={cardType}
            name="card_type"
          >
            <option value="">All</option>
            {cardTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-xl bg-[#0d1b2a] px-4 py-2 text-sm font-semibold text-white"
          type="submit"
        >
          Filter
        </button>
        <Link className="text-sm font-semibold text-[#1D809F] underline" href="/admin">
          Clear
        </Link>
      </form>

      <p className="mt-4 text-sm text-[#172033]/70">
        {cards.length} card{cards.length === 1 ? "" : "s"}
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[#0d1b2a]/10 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F7F4EC] text-xs uppercase tracking-wide text-[#172033]/60">
            <tr>
              <th className="px-4 py-3">Card</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Publish check</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => {
              const errors = validateCardForPublish(card);

              return (
                <tr className="border-t border-[#0d1b2a]/5 hover:bg-[#FFFDF7]" key={card.id}>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-[#1D809F] hover:underline" href={`/admin/cards/${card.id}`}>
                      {card.title}
                    </Link>
                    <p className="text-xs text-[#172033]/50">{card.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {card.card_type}
                    {card.time_critical ? (
                      <span className="ml-2 rounded-full bg-[#FDEAEA] px-2 py-0.5 text-xs font-semibold text-[#B4423C]">
                        time-critical
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[#172033]/70">{formatWindow(card)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[card.status] ?? "bg-[#F0EEE9]"}`}
                    >
                      {card.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {errors.length === 0 ? (
                      <span className="font-semibold text-[#1B7A4B]">Ready</span>
                    ) : (
                      <span className="text-[#B4423C]">
                        {errors.length} issue{errors.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {cards.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-[#172033]/50" colSpan={5}>
                  No cards match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
