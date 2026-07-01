"use server";

import { revalidatePath } from "next/cache";
import { getAdminProfile, fetchAdminCard } from "@/lib/data/admin";
import { validateCardForPublish } from "@/lib/content/validation";
import { createClient } from "@/lib/supabase/server";
import type { AdminCardInput } from "@/types/admin";
import type { CardStatus } from "@/types/content";

export type AdminActionResult = {
  error?: string;
  errors?: string[];
  cardId?: string;
};

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function saveCard(
  input: AdminCardInput,
  cardId?: string | null,
): Promise<AdminActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin access required." };

  if (!input.title.trim()) return { error: "Title is required." };
  if (!input.slug.trim()) return { error: "Slug is required." };

  const supabase = await createClient();
  const payload = {
    ...input,
    slug: input.slug.trim(),
    title: input.title.trim(),
    updated_by: admin.id,
  };

  if (cardId) {
    const { error } = await supabase.from("timeline_cards").update(payload).eq("id", cardId);

    if (error) return { error: error.message };

    revalidateAdmin();
    return { cardId };
  }

  const { data, error } = await supabase
    .from("timeline_cards")
    .insert({ ...payload, created_by: admin.id, status: "draft" })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not create card." };

  revalidateAdmin();
  return { cardId: data.id };
}

export async function changeCardStatus(
  cardId: string,
  status: CardStatus,
): Promise<AdminActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin access required." };

  const card = await fetchAdminCard(cardId);
  if (!card) return { error: "Card not found." };

  if (status === "published") {
    const errors = validateCardForPublish(card);
    if (errors.length > 0) {
      return { error: "This card is not ready to publish yet.", errors };
    }
  }

  const supabase = await createClient();
  const patch: Record<string, unknown> = { status, updated_by: admin.id };

  if (status === "published") patch.published_at = new Date().toISOString();
  if (status === "archived") patch.archived_at = new Date().toISOString();
  if (card.status === "archived" && status !== "archived") patch.archived_at = null;

  const { error } = await supabase.from("timeline_cards").update(patch).eq("id", cardId);

  if (error) return { error: error.message };

  revalidateAdmin();
  return { cardId };
}

export async function duplicateCard(cardId: string): Promise<AdminActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin access required." };

  const card = await fetchAdminCard(cardId);
  if (!card) return { error: "Card not found." };

  const copy: Record<string, unknown> = { ...card };
  for (const key of ["id", "version", "created_at", "updated_at", "published_at", "archived_at"]) {
    delete copy[key];
  }

  const supabase = await createClient();
  const suffix = Date.now().toString(36).slice(-4);
  const { data, error } = await supabase
    .from("timeline_cards")
    .insert({
      ...copy,
      slug: `${card.slug}-copy-${suffix}`,
      title: `${card.title} (copy)`,
      status: "draft",
      created_by: admin.id,
      updated_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not duplicate card." };

  revalidateAdmin();
  return { cardId: data.id };
}

export async function uploadCardImage(formData: FormData): Promise<AdminActionResult> {
  const admin = await getAdminProfile();
  if (!admin) return { error: "Admin access required." };

  const cardId = formData.get("cardId");
  const file = formData.get("file");

  if (typeof cardId !== "string" || !cardId) return { error: "Missing card id." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file first." };
  if (file.size > 5 * 1024 * 1024) return { error: "Images need to be under 5MB." };

  const card = await fetchAdminCard(cardId);
  if (!card) return { error: "Card not found." };

  const extension = (file.name.split(".").pop() || "png").toLowerCase();
  if (!["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(extension)) {
    return { error: "Use a png, jpg, webp, gif or svg image." };
  }

  const supabase = await createClient();
  const path = `${card.slug}-${Date.now().toString(36)}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("card-images")
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("card-images").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("timeline_cards")
    .update({ image_url: publicUrl, image_status: "uploaded", updated_by: admin.id })
    .eq("id", cardId);

  if (updateError) return { error: updateError.message };

  revalidateAdmin();
  return { cardId };
}
