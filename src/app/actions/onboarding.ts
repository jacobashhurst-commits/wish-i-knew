"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OnboardingState } from "@/types/app";

export type ActionResult = {
  error?: string;
  childId?: string;
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

  if (error) {
    return { profileId: "", error: error.message };
  }

  if (profile) {
    return { profileId: profile.id };
  }

  // Fallback if the auth trigger has not been applied yet.
  const { data: created, error: createError } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: user.id,
      email: user.email ?? "",
      role: "user",
    })
    .select("id")
    .single();

  if (createError || !created) {
    return { profileId: "", error: createError?.message ?? "Could not create profile." };
  }

  return { profileId: created.id };
}

export async function saveOnboarding(form: OnboardingState, childId?: string | null): Promise<ActionResult> {
  const { profileId, error: profileError } = await requireProfileId();

  if (profileError || !profileId) {
    return { error: profileError ?? "Not signed in." };
  }

  if (!form.childName.trim()) {
    return { error: "Add a child nickname." };
  }

  if (form.isBorn && !form.birthDate) {
    return { error: "Add a birth date." };
  }

  if (!form.isBorn && !form.dueDate) {
    return { error: "Add a due date." };
  }

  const supabase = await createClient();

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ state: form.state })
    .eq("id", profileId);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  const childPayload = {
    user_id: profileId,
    nickname: form.childName.trim(),
    is_born: form.isBorn,
    birth_date: form.isBorn ? form.birthDate : null,
    due_date: form.isBorn ? form.dueDate || null : form.dueDate,
    state: form.state,
    first_child: form.firstChild,
    childcare_intention: form.childcareIntention,
  };

  let savedChildId = childId ?? null;

  if (savedChildId) {
    const { error } = await supabase.from("children").update(childPayload).eq("id", savedChildId);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { data, error } = await supabase.from("children").insert(childPayload).select("id").single();

    if (error || !data) {
      return { error: error?.message ?? "Could not save child." };
    }

    savedChildId = data.id;
  }

  const { error: prefError } = await supabase.from("weekly_lookahead_preferences").upsert(
    {
      user_id: profileId,
      child_id: savedChildId,
      day_of_week: form.lookaheadDay,
      time_of_day: `${form.lookaheadTime}:00`,
      timezone: "Australia/Sydney",
      delivery_channel: "in_app",
      enabled: true,
    },
    { onConflict: "user_id,child_id" },
  );

  if (prefError) {
    return { error: prefError.message };
  }

  revalidatePath("/");

  return { childId: savedChildId ?? undefined };
}
