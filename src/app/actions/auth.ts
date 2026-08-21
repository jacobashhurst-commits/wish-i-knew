"use server";

import { redirect } from "next/navigation";
import { isEmailInvited } from "@/lib/launch/beta-invite";
import { isBetaInviteOnly } from "@/lib/launch/config";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AuthActionResult = {
  error?: string;
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

function isAlreadyRegistered(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("already") || lower.includes("registered") || lower.includes("exists");
}

function needsEmailConfirm(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("confirm") || lower.includes("not confirmed");
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const service = createServiceClient();
  // Paginate lightly — alpha lists are tiny.
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function confirmEmailIfNeeded(email: string): Promise<void> {
  const userId = await findAuthUserIdByEmail(email);
  if (!userId) return;
  const service = createServiceClient();
  await service.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
}

/**
 * Sign in with cookies set on this response, then hard-navigate home.
 * Never returns on success — redirect() throws.
 */
async function signInAndEnter(email: string, password: string): Promise<AuthActionResult> {
  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error && needsEmailConfirm(error.message)) {
    try {
      await confirmEmailIfNeeded(email);
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
    } catch (confirmError) {
      return {
        error:
          confirmError instanceof Error
            ? confirmError.message
            : "Could not confirm email for sign-in.",
      };
    }
  }

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

/** Alpha sign-in: email + password. */
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

  return signInAndEnter(trimmed, password);
}

/**
 * First-time alpha: create a confirmed account, then sign in immediately
 * (no refresh / second login step).
 */
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

  try {
    const service = createServiceClient();
    const { error: createError } = await service.auth.admin.createUser({
      email: trimmed,
      password,
      email_confirm: true,
    });

    if (createError && !isAlreadyRegistered(createError.message)) {
      return { error: createError.message };
    }

    // Existing account from a previous attempt: update password + confirm, then sign in.
    if (createError && isAlreadyRegistered(createError.message)) {
      const userId = await findAuthUserIdByEmail(trimmed);
      if (!userId) {
        return { error: "Account exists but could not be updated. Try Sign in instead." };
      }
      const { error: updateError } = await service.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updateError) return { error: updateError.message };
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create account (is SUPABASE_SERVICE_ROLE_KEY set?).",
    };
  }

  return signInAndEnter(trimmed, password);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
