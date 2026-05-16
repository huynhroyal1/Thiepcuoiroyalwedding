"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { WeddingCard } from "@/types";

export async function ensureWeddingCard(): Promise<{ data: WeddingCard | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: existing, error: exErr } = await supabase
    .from("wedding_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (exErr) {
    return { data: null, error: exErr.message };
  }
  if (existing) {
    return { data: existing as WeddingCard, error: null };
  }

  const rnd = Math.random().toString(36).slice(2, 8);
  const base = slugify(`doi-${user.id.replace(/-/g, "").slice(0, 8)}`) || "thiep";
  const slug = `${base}-${rnd}`;

  const { data: created, error: insErr } = await supabase
    .from("wedding_cards")
    .insert({
      user_id: user.id,
      slug,
      plan: "basic",
      status: "draft",
      paid_at: null,
      bride_name: "Cô dâu",
      groom_name: "Chú rể",
      wedding_date: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insErr || !created) {
    return { data: null, error: insErr?.message ?? "Không tạo được thiệp" };
  }

  revalidatePath("/dashboard");
  return { data: created as WeddingCard, error: null };
}

export async function updateWeddingCard(
  cardId: string,
  patch: Record<string, unknown>
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("wedding_cards")
    .update(patch)
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/thiet-lap");
  return { error: null };
}

export async function checkSlugAvailable(
  slug: string,
  excludeCardId?: string
): Promise<{ available: boolean; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("wedding_cards").select("id").eq("slug", slug).maybeSingle();
  if (error) {
    return { available: false, error: error.message };
  }
  if (!data) {
    return { available: true, error: null };
  }
  if (excludeCardId && data.id === excludeCardId) {
    return { available: true, error: null };
  }
  return { available: false, error: null };
}

export async function addWeddingPhoto(cardId: string, url: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { count, error: cErr } = await supabase
    .from("wedding_photos")
    .select("*", { count: "exact", head: true })
    .eq("card_id", cardId);
  if (cErr) return { error: cErr.message };

  const { data: card } = await supabase.from("wedding_cards").select("plan").eq("id", cardId).single();
  const plan = card?.plan ?? "basic";
  const limit = plan === "vip" ? 9999 : plan === "pro" ? 40 : 20;
  if ((count ?? 0) >= limit) {
    return { error: "Đã đạt giới hạn ảnh" };
  }

  const { error } = await supabase.from("wedding_photos").insert({
    card_id: cardId,
    url,
    sort_order: (count ?? 0) + 1,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/thiet-lap");
  return { error: null };
}

export async function deleteWeddingPhoto(photoId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("wedding_photos").delete().eq("id", photoId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/thiet-lap");
  return { error: null };
}

export async function updatePhotoOrder(
  cardId: string,
  orderedIds: string[]
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  let sort = 0;
  for (const id of orderedIds) {
    const { error } = await supabase.from("wedding_photos").update({ sort_order: sort }).eq("id", id).eq("card_id", cardId);
    if (error) return { error: error.message };
    sort += 1;
  }
  revalidatePath("/dashboard/thiet-lap");
  return { error: null };
}
