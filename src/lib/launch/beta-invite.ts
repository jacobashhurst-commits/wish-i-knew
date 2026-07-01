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
  const { data, error } = await supabase
    .from("beta_invites")
    .select("email")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not verify beta invite: ${error.message}`);
  }

  return Boolean(data);
}
