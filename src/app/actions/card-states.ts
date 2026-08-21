"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserCardStatus } from "@/types/content";

export type ActionResult = {
  error?: string;
};

async function resolveProfileId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to sign in to save card actions." as const };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: profileError?.message ?? "Profile not found." };
  }

  return { supabase, profileId: profile.id as string };
}

export async function upsertCardState(input: {
  childId: string;
  cardId: string;
  status: UserCardStatus;
  snoozedUntil?: string | null;
}): Promise<ActionResult> {
  return upsertCardStates({
    childId: input.childId,
    updates: [
      {
        cardId: input.cardId,
        status: input.status,
        snoozedUntil: input.snoozedUntil,
      },
    ],
  });
}

export async function upsertCardStates(input: {
  childId: string;
  updates: Array<{
    cardId: string;
    status: UserCardStatus;
    snoozedUntil?: string | null;
  }>;
}): Promise<ActionResult> {
  if (!input.updates.length) return {};

  const resolved = await resolveProfileId();
  if ("error" in resolved) {
    return { error: resolved.error };
  }

  const { supabase, profileId } = resolved;

  const { error } = await supabase.from("user_card_states").upsert(
    input.updates.map((update) => ({
      user_id: profileId,
      child_id: input.childId,
      card_id: update.cardId,
      status: update.status,
      snoozed_until: update.status === "snoozed" ? (update.snoozedUntil ?? null) : null,
    })),
    { onConflict: "user_id,child_id,card_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");

  return {};
}
