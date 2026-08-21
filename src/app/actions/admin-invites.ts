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
    "Wish I Knew — you're on the alpha list",
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

export async function removeAlphaInvite(email: string): Promise<InviteActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin sign-in required." };

  const normalized = email.trim().toLowerCase();

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("beta_invites").delete().eq("email", normalized);
    if (error) return { error: error.message };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not remove invite (is SUPABASE_SERVICE_ROLE_KEY set?).",
    };
  }

  revalidatePath("/admin/invites");
  return { success: `Removed ${normalized}.` };
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
