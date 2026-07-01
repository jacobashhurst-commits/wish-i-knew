"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfile } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";
import type { SuggestionStatus } from "@/types/content";

export type SuggestionActionResult = {
  error?: string;
  cardId?: string;
};

export async function setSuggestionStatus(
  suggestionId: string,
  status: SuggestionStatus,
): Promise<SuggestionActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("card_suggestions")
    .update({ status })
    .eq("id", suggestionId);

  if (error) return { error: error.message };

  revalidatePath("/admin/suggestions");
  return {};
}

/** Creates a draft card pre-filled from a suggestion and marks the suggestion accepted. */
export async function promoteSuggestionToCard(
  suggestionId: string,
): Promise<SuggestionActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin access required." };

  const supabase = await createClient();
  const { data: suggestion, error: loadError } = await supabase
    .from("card_suggestions")
    .select("*")
    .eq("id", suggestionId)
    .maybeSingle();

  if (loadError || !suggestion) return { error: loadError?.message ?? "Suggestion not found." };

  const slugBase = suggestion.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const slug = `${slugBase || "suggested-card"}-${Date.now().toString(36).slice(-4)}`;

  const timingNote = suggestion.suggested_timing
    ? `Suggested timing from the parent: ${suggestion.suggested_timing}.`
    : null;

  const { data: card, error: insertError } = await supabase
    .from("timeline_cards")
    .insert({
      slug,
      title: suggestion.title,
      card_type: "Heads Up",
      category: "From parent suggestions",
      life_stage: "Any",
      priority: 50,
      short_summary: suggestion.body.slice(0, 280),
      wish_i_knew: suggestion.body,
      source_notes: ["Promoted from a user suggestion.", timingNote].filter(Boolean).join(" "),
      status: "draft",
      created_by: admin.id,
      updated_by: admin.id,
    })
    .select("id")
    .single();

  if (insertError || !card) return { error: insertError?.message ?? "Could not create draft card." };

  const { error: statusError } = await supabase
    .from("card_suggestions")
    .update({ status: "accepted" })
    .eq("id", suggestionId);

  if (statusError) return { error: statusError.message };

  revalidatePath("/admin");
  revalidatePath("/admin/suggestions");
  return { cardId: card.id };
}
