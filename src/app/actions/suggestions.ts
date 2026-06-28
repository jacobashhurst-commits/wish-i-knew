"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function submitCardSuggestion(input: {
  title: string;
  body: string;
  suggestedTiming?: string;
}): Promise<ActionResult> {
  const title = input.title.trim();
  const body = input.body.trim();

  if (!title) {
    return { error: "Add a short title for your suggestion." };
  }

  if (!body) {
    return { error: "Tell us a little more about what you wish you'd known." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to submit a suggestion." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: profileError?.message ?? "Profile not found." };
  }

  const { error } = await supabase.from("card_suggestions").insert({
    user_id: profile.id,
    title,
    body,
    suggested_timing: input.suggestedTiming?.trim() || null,
    status: "new",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");

  return { success: true };
}
