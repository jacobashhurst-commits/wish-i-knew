import { SuggestionQueue } from "@/components/admin/suggestion-queue";
import { fetchSuggestions } from "@/lib/data/admin";

export default async function SuggestionsPage() {
  const suggestions = await fetchSuggestions();

  return (
    <section>
      <h1 className="font-display mb-1 text-2xl font-semibold">Card suggestions</h1>
      <p className="mb-5 text-sm text-[#172033]/70">
        Ideas parents sent from the app. Promote the good ones straight into a draft card.
      </p>
      <SuggestionQueue suggestions={suggestions} />
    </section>
  );
}
