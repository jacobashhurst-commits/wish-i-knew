"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserCardStatus } from "@/types/content";

export type ActionResult = {
  error?: string;
};

export async function upsertCardState(input: {
  childId: string;
  cardId: string;
  status: UserCardStatus;
  snoozedUntil?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to save card actions." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: profileError?.message ?? "Profile not found." };
  }

  const { error } = await supabase.from("user_card_states").upsert(
    {
      user_id: profile.id,
      child_id: input.childId,
      card_id: input.cardId,
      status: input.status,
      snoozed_until: input.status === "snoozed" ? (input.snoozedUntil ?? null) : null,
    },
    { onConflict: "user_id,child_id,card_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");

  return {};
}
