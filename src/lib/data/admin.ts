import { createClient } from "@/lib/supabase/server";
import type { AdminCardRow, AdminSuggestionRow } from "@/types/admin";
import type { AustralianState } from "@/types/content";

export type AdminProfile = {
  id: string;
  email: string;
  role: string;
};

/** Returns the signed-in admin's profile, or null when not signed in / not admin. */
export async function getAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") return null;

  return profile;
}

function normalizeCardRow(row: Record<string, unknown>): AdminCardRow {
  return {
    ...(row as unknown as AdminCardRow),
    checklist_items: (row.checklist_items as string[]) ?? [],
    shopping_items: (row.shopping_items as string[]) ?? [],
    source_urls: (row.source_urls as string[]) ?? [],
    states: (row.states as AustralianState[]) ?? [],
    conditions: (row.conditions as Record<string, unknown>) ?? {},
  };
}

export type AdminCardFilters = {
  status?: string;
  lifeStage?: string;
  cardType?: string;
  search?: string;
};

export async function fetchAdminCards(filters: AdminCardFilters): Promise<AdminCardRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("timeline_cards")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.lifeStage) query = query.eq("life_stage", filters.lifeStage);
  if (filters.cardType) query = query.eq("card_type", filters.cardType);
  if (filters.search) {
    const term = filters.search.replaceAll("%", "").replaceAll(",", " ").trim();
    if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load cards: ${error.message}`);
  }

  return (data ?? []).map(normalizeCardRow);
}

export async function fetchAdminCard(id: string): Promise<AdminCardRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("timeline_cards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load card: ${error.message}`);
  }

  return data ? normalizeCardRow(data) : null;
}

export async function fetchSuggestions(): Promise<AdminSuggestionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("card_suggestions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load suggestions: ${error.message}`);
  }

  return data ?? [];
}
