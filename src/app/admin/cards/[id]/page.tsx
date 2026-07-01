import { notFound } from "next/navigation";
import { CardEditor } from "@/components/admin/card-editor";
import { fetchAdminCard } from "@/lib/data/admin";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await fetchAdminCard(id);

  if (!card) {
    notFound();
  }

  return (
    <section>
      <h1 className="font-display mb-5 text-2xl font-semibold">Edit: {card.title}</h1>
      <CardEditor card={card} key={card.id} />
    </section>
  );
}
