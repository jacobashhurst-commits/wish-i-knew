import { createServiceClient } from "@/lib/supabase/service";
import { isBetaInviteOnly } from "@/lib/launch/config";

export async function isEmailInvited(email: string): Promise<boolean> {
  if (!isBetaInviteOnly()) {
    return true;
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  const supabase = createServiceClient();
  // Alpha lists are tiny; scan so legacy rows with stray whitespace still match.
  const { data, error } = await supabase.from("beta_invites").select("email");

  if (error) {
    throw new Error(`Could not verify beta invite: ${error.message}`);
  }

  return (data ?? []).some((row) => row.email?.trim().toLowerCase() === normalized);
}
