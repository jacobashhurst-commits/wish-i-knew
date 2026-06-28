"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ChildJourneyStatus } from "@/types/content";

export type ActionResult = {
  error?: string;
};

async function requireProfileId(): Promise<{ profileId: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { profileId: "", error: "You need to sign in first." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { profileId: "", error: error?.message ?? "Profile not found." };
  }

  return { profileId: profile.id };
}

export async function updateChildJourneyStatus(
  childId: string,
  status: ChildJourneyStatus,
): Promise<ActionResult> {
  const { profileId, error: profileError } = await requireProfileId();

  if (profileError || !profileId) {
    return { error: profileError ?? "Not signed in." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const patch: {
    status: ChildJourneyStatus;
    paused_at: string | null;
    ended_at: string | null;
  } = {
    status,
    paused_at: status === "paused" ? now : null,
    ended_at: status === "ended" ? now : null,
  };

  if (status === "active") {
    patch.paused_at = null;
    patch.ended_at = null;
  }

  const { error } = await supabase
    .from("children")
    .update(patch)
    .eq("id", childId)
    .eq("user_id", profileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");

  return {};
}
