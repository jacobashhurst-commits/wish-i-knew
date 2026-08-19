import { WeekPreview } from "@/components/admin/week-preview";
import { fetchAdminCards } from "@/lib/data/admin";

export default async function AdminWeeksPage() {
  const cards = await fetchAdminCards({});

  return (
    <section>
      <h1 className="font-display mb-1 text-2xl font-semibold">Week preview</h1>
      <p className="mb-5 text-sm text-[#172033]/70">
        Cycle through pregnancy or baby weeks to see what lands in the timeline and what would go
        out in the weekly email. Highlighted cards appear in the digest.
      </p>
      <WeekPreview cards={cards} />
    </section>
  );
}
