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

async function assertInvited(email: string): Promise<AuthActionResult | null> {
  try {
    const invited = await isEmailInvited(email);
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
  return null;
}

/** Alpha sign-in: email + password (avoids magic-link expiry / rate limits). */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!password || password.length < 8) {
    return { error: "Enter your password (at least 8 characters)." };
  }

  const inviteError = await assertInvited(trimmed);
  if (inviteError) return inviteError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/** First-time alpha: create password account for an invited email. */
export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }
  if (!password || password.length < 8) {
    return { error: "Choose a password with at least 8 characters." };
  }

  const inviteError = await assertInvited(trimmed);
  if (inviteError) return inviteError;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: trimmed,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signInWithMagicLink(email: string): Promise<AuthActionResult> {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed || !trimmed.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const inviteError = await assertInvited(trimmed);
  if (inviteError) return inviteError;

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
