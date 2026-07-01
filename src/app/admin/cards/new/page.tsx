import { CardEditor } from "@/components/admin/card-editor";

export default function NewCardPage() {
  return (
    <section>
      <h1 className="font-display mb-5 text-2xl font-semibold">New card</h1>
      <CardEditor card={null} />
    </section>
  );
}
