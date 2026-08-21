"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfile } from "@/lib/data/admin";
import { sendEmail } from "@/lib/email/resend";
import { createServiceClient } from "@/lib/supabase/service";
import { getSiteUrl } from "@/lib/supabase/config";

export type InviteActionResult = { error?: string; success?: string };

export type AlphaInvite = {
  email: string;
  note: string | null;
  invited_at: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInviteEmail(input: { email: string; siteUrl: string }): {
  subject: string;
  html: string;
  text: string;
} {
  const loginUrl = `${input.siteUrl.replace(/\/$/, "")}/login`;
  const subject = "You're invited to Wish I Knew (friends & family alpha)";
  const html = `<!doctype html>
<html lang="en-AU">
<body style="margin:0;padding:24px;background:#FFF6E6;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#172033;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:18px;border:1px solid #E8E4DA;">
    <tr><td style="padding:28px 24px;">
      <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#1D809F;font-weight:800;">Wish I Knew</p>
      <h1 style="margin:12px 0 0 0;font-size:24px;line-height:1.25;font-family:Georgia,'Times New Roman',serif;color:#0D1B2A;">You're on the alpha list</h1>
      <p style="margin:14px 0 0 0;font-size:15px;line-height:1.65;">
        Create your account with <strong>${escapeHtml(input.email)}</strong> (same email as this invite).
      </p>
      <p style="margin:12px 0 0 0;font-size:15px;line-height:1.65;">
        1. Open the link below<br/>
        2. Tap <strong>Create a password</strong><br/>
        3. Use this email + a password you choose<br/>
        4. Finish the short onboarding (due date / birth date, etc.)
      </p>
      <p style="margin:22px 0 0 0;">
        <a href="${loginUrl}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#FFC857;color:#0D1B2A;font-weight:800;text-decoration:none;">Open Wish I Knew</a>
      </p>
      <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:#697386;">
        Or paste this link: ${loginUrl}
      </p>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [
    "Wish I Knew: you're on the alpha list",
    "",
    `Create your account with ${input.email}.`,
    "1. Open the link",
    "2. Tap Create a password",
    "3. Use this email + a password you choose",
    "4. Finish onboarding",
    "",
    loginUrl,
  ].join("\n");

  return { subject, html, text };
}

async function sendInviteEmail(email: string): Promise<string | null> {
  const siteUrl = getSiteUrl();
  const message = renderInviteEmail({ email, siteUrl });
  const result = await sendEmail({
    to: email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  return result.error ?? null;
}

/** Alpha lists are tiny; paginate a few pages of Auth Admin users. */
async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const service = createServiceClient();
  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.trim().toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function addAlphaInvite(
  email: string,
  note?: string,
): Promise<InviteActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin sign-in required." };

  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return { error: "Enter a valid email." };

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("beta_invites").upsert(
      {
        email: normalized,
        note: note?.trim() || "Alpha tester",
        invited_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    if (error) return { error: error.message };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not write invite (is SUPABASE_SERVICE_ROLE_KEY set?).",
    };
  }

  const sendError = await sendInviteEmail(normalized);
  revalidatePath("/admin/invites");

  if (sendError) {
    return {
      success: `Saved ${normalized} to the invite list, but the invite email failed: ${sendError}`,
    };
  }

  return { success: `Invited ${normalized} and emailed them the signup link.` };
}

export async function resendAlphaInvite(email: string): Promise<InviteActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin sign-in required." };

  const normalized = email.trim().toLowerCase();
  const sendError = await sendInviteEmail(normalized);
  if (sendError) return { error: sendError };
  return { success: `Resent invite email to ${normalized}.` };
}

/**
 * Alpha reset: remove invite AND fully wipe that person's account + app data.
 * Deleting auth.users cascades to profiles, then to children, card states,
 * lookahead prefs, reminders, suggestions, digest sends, entitlements.
 */
export async function removeAlphaInvite(email: string): Promise<InviteActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin sign-in required." };

  const normalized = email.trim().toLowerCase();
  if (admin.email?.trim().toLowerCase() === normalized) {
    return { error: "You can't remove your own admin account from here." };
  }

  try {
    const supabase = createServiceClient();

    // Match by trimmed email — legacy invite rows may have trailing whitespace,
    // and `.eq("email", normalized)` would silently delete 0 rows.
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, auth_user_id, role, email");

    if (profileError) return { error: profileError.message };

    const profile =
      profiles?.find((row) => row.email?.trim().toLowerCase() === normalized) ?? null;

    if (profile?.role === "admin") {
      return { error: "Refusing to delete an admin account via invite remove." };
    }

    let authUserId = profile?.auth_user_id ?? null;
    if (!authUserId) {
      authUserId = await findAuthUserIdByEmail(normalized);
    }

    if (authUserId) {
      // Revokes sessions and cascades: auth.users → profiles → user-owned rows.
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUserId);
      if (deleteAuthError) return { error: deleteAuthError.message };
    }

    const { data: inviteRows, error: inviteListError } = await supabase
      .from("beta_invites")
      .select("email");
    if (inviteListError) return { error: inviteListError.message };

    const inviteEmails = (inviteRows ?? [])
      .map((row) => row.email)
      .filter((value): value is string => value.trim().toLowerCase() === normalized);

    if (inviteEmails.length > 0) {
      const { error } = await supabase.from("beta_invites").delete().in("email", inviteEmails);
      if (error) return { error: error.message };
    }

    revalidatePath("/admin/invites");
    return {
      success: authUserId
        ? `Removed ${normalized}, deleted their auth account, and wiped their app data.`
        : `Removed invite for ${normalized} (no account existed).`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not remove invite (is SUPABASE_SERVICE_ROLE_KEY set?).",
    };
  }
}

export async function listAlphaInvites(): Promise<AlphaInvite[]> {
  const admin = await getAdminProfile();
  if (!admin) return [];

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("beta_invites")
      .select("email, note, invited_at")
      .order("invited_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    return [];
  }
}
