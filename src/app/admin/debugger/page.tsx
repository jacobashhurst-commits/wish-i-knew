import { MatchDebugger } from "@/components/admin/match-debugger";
import { fetchAdminCards } from "@/lib/data/admin";

export default async function DebuggerPage() {
  const cards = await fetchAdminCards({});

  return (
    <section>
      <h1 className="font-display mb-1 text-2xl font-semibold">Match debugger</h1>
      <p className="mb-5 text-sm text-[#172033]/70">
        Run the timeline engine against a sample child profile and see which bucket each card lands
        in, with the engine&apos;s match reasons.
      </p>
      <MatchDebugger cards={cards} />
    </section>
  );
}
