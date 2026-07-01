"use server";

import { redirect } from "next/navigation";
import { isEmailInvited } from "@/lib/launch/beta-invite";
import { isBetaInviteOnly } from "@/lib/launch/config";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/config";

export type AuthActionResult = {
  error?: string;
  success?: boolean;
};

export async function signInWithMagicLink(email: string): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  try {
    const invited = await isEmailInvited(trimmed);

    if (!invited) {
      return {
        error: isBetaInviteOnly()
          ? "This beta is invite-only. Ask the Wish I Knew team to add your email first."
          : "Sign-up is not available for this email.",
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not verify beta access.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
