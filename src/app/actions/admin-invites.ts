"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfile } from "@/lib/data/admin";
import { createServiceClient } from "@/lib/supabase/service";

export type InviteActionResult = { error?: string; success?: string };

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

  revalidatePath("/admin/invites");
  return { success: `Invited ${normalized}.` };
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

export async function listAlphaInvites(): Promise<
  { email: string; note: string | null; created_at: string }[]
> {
  const admin = await getAdminProfile();
  if (!admin) return [];

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("beta_invites")
      .select("email, note, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  } catch {
    return [];
  }
}
