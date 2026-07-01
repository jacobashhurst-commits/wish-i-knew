import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./config";

/**
 * Service-role client for trusted server jobs (cron). Never import from client code —
 * the service key bypasses RLS.
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createSupabaseClient(getSupabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
