"use server";

import { revalidatePath } from "next/cache";
import { getCardEntitlements, hasEntitlement } from "@/lib/features/get-card-entitlements";
import { hasActiveSubscription, planMeetsRequirement } from "@/lib/plans/plan-access";
import { requireCardSubscription } from "@/lib/subscription/require-card-subscription";
import { getPlanConfig } from "@/lib/plans/plan-config";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_BACKGROUND_MUSIC_URL } from "@/lib/data/invitation-music-presets";
import {
  extractCardFieldsFromContent,
  patchNeedsCardFieldSync,
  syncCardFieldsInContent,
} from "@/lib/editor/cardFieldBinding";
import { prepareContentForSave } from "@/lib/editor/prepareContentForSave";
import { isCraftContentJson } from "@/lib/editor/sanitizeCraftContent";
import { slugify } from "@/lib/utils";
import type { Plan, WeddingCard, WeddingPhoto } from "@/types";

export async function ensureWeddingCard(): Promise<{ data: WeddingCard | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  // Check if user is admin — admins always get VIP plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

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
    // If admin but card is not VIP yet, upgrade it automatically
    if (isAdmin && (existing.plan !== "vip" || !existing.paid_at)) {
      await supabase
        .from("wedding_cards")
        .update({ plan: "vip", paid_at: new Date().toISOString() })
        .eq("id", existing.id);
      return { data: { ...existing, plan: "vip", paid_at: new Date().toISOString() } as WeddingCard, error: null };
    }
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
      plan: isAdmin ? "vip" : "basic",
      status: "draft",
      paid_at: isAdmin ? new Date().toISOString() : null,
      bride_name: "Cô dâu",
      groom_name: "Chú rể",
      wedding_date: new Date().toISOString(),
      background_music_url: DEFAULT_BACKGROUND_MUSIC_URL,
    })
    .select("*")
    .single();

  if (insErr || !created) {
    return { data: null, error: insErr?.message ?? "Không tạo được thiệp" };
  }

  revalidatePath("/dashboard");
  return { data: created as WeddingCard, error: null };
}

/** Tạo thêm một thiệp cưới mới — kiểm tra giới hạn max_cards của gói. */
export async function createWeddingCard(): Promise<{ data: WeddingCard | null; error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  // Determine current plan from first card (highest plan)
  const { data: existingCards } = await supabase
    .from("wedding_cards")
    .select("id, plan")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const currentCount = existingCards?.length ?? 0;
  const currentPlan = (existingCards?.[0]?.plan ?? "basic") as Plan;

  if (!isAdmin) {
    const planConfig = await getPlanConfig();
    const maxCards = planConfig[currentPlan]?.max_cards ?? 1;
    if (currentCount >= maxCards) {
      return {
        data: null,
        error: `Gói ${currentPlan.toUpperCase()} chỉ cho phép tối đa ${maxCards} thiệp. Vui lòng nâng cấp gói để tạo thêm.`,
      };
    }
  }

  const rnd = Math.random().toString(36).slice(2, 8);
  const base = slugify(`thiep-${user.id.replace(/-/g, "").slice(0, 6)}`) || "thiep";
  const slug = `${base}-${rnd}`;

  const { data: created, error: insErr } = await supabase
    .from("wedding_cards")
    .insert({
      user_id: user.id,
      slug,
      plan: isAdmin ? "vip" : "basic",
      status: "draft",
      paid_at: isAdmin ? new Date().toISOString() : null,
      bride_name: "Cô dâu",
      groom_name: "Chú rể",
      wedding_date: new Date().toISOString(),
      background_music_url: DEFAULT_BACKGROUND_MUSIC_URL,
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

  const { data: card, error: cardErr } = await supabase
    .from("wedding_cards")
    .select("plan, paid_at")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (cardErr || !card) {
    return { error: cardErr?.message ?? "Không tìm thấy thiệp" };
  }

  const planConfig = await getPlanConfig();
  const subscription = hasActiveSubscription(
    { plan: card.plan as Plan, paid_at: card.paid_at },
    planConfig
  );

  if (!subscription) {
    return { error: "Vui lòng mua gói dịch vụ trước khi chỉnh sửa thiệp" };
  }

  const confetti = patch.confetti_effect;
  if (typeof confetti === "string" && confetti !== "none") {
    const entitlements = await getCardEntitlements(cardId);
    if (
      !hasEntitlement(
        entitlements,
        "custom_confetti",
        card.plan as Plan,
        planConfig,
        { plan: card.plan as Plan, paid_at: card.paid_at }
      )
    ) {
      return { error: "Hiệu ứng confetti nâng cao thuộc gói Pro trở lên" };
    }
  }

  const templateId = patch.template_id;
  if (typeof templateId === "string" && templateId.length > 0) {
    const { data: template } = await supabase
      .from("templates")
      .select("plan_required")
      .eq("id", templateId)
      .maybeSingle();

    const required = (template?.plan_required ?? "basic") as Plan;
    if (!planMeetsRequirement(card.plan as Plan, required)) {
      return {
        error: `Mẫu này yêu cầu gói ${required.toUpperCase()} trở lên. Vui lòng nâng cấp gói.`,
      };
    }
  }

  let finalPatch = { ...patch };
  let invitationSlug: string | undefined;

  if (patchNeedsCardFieldSync(patch)) {
    const { data: row } = await supabase
      .from("wedding_cards")
      .select(
        "content_json, wedding_date, bride_name, groom_name, venue_name, venue_address, slug"
      )
      .eq("id", cardId)
      .eq("user_id", user.id)
      .maybeSingle();

    invitationSlug = row?.slug;

    const cj = row?.content_json as Record<string, unknown> | null;
    if (row && cj && isCraftContentJson(cj)) {
      const merged = {
        wedding_date: (patch.wedding_date as string | undefined) ?? row.wedding_date,
        bride_name: (patch.bride_name as string | undefined) ?? row.bride_name,
        groom_name: (patch.groom_name as string | undefined) ?? row.groom_name,
        venue_name: (patch.venue_name as string | undefined) ?? row.venue_name,
        venue_address: (patch.venue_address as string | undefined) ?? row.venue_address,
      };
      finalPatch = {
        ...finalPatch,
        content_json: syncCardFieldsInContent(cj, merged),
      };
    }
  }

  const { error } = await supabase
    .from("wedding_cards")
    .update(finalPatch)
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/thiet-lap");
  const slug = invitationSlug ?? (finalPatch.slug as string | undefined) ?? (patch.slug as string | undefined);
  if (slug) revalidatePath(`/thiep/${slug}`);
  if (
    "status" in patch ||
    "show_in_showcase" in patch ||
    "cover_image_url" in patch ||
    "bride_name" in patch ||
    "groom_name" in patch
  ) {
    revalidatePath("/cac-cap-doi");
    revalidatePath("/");
  }
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

export async function addWeddingPhoto(
  cardId: string,
  url: string
): Promise<{ error: string | null; photo?: WeddingPhoto }> {
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

  const { data: card } = await supabase
    .from("wedding_cards")
    .select("plan, paid_at")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .single();
  if (!card) return { error: "Không tìm thấy thiệp" };

  const planConfig = await getPlanConfig();
  if (!hasActiveSubscription({ plan: card.plan as Plan, paid_at: card.paid_at }, planConfig)) {
    return { error: "Vui lòng mua gói dịch vụ trước khi tải ảnh" };
  }

  const plan = card.plan as Plan;
  const limit = planConfig[plan].max_photos;
  if ((count ?? 0) >= limit) {
    return { error: "Đã đạt giới hạn ảnh" };
  }

  const { data: photo, error } = await supabase
    .from("wedding_photos")
    .insert({
      card_id: cardId,
      url,
      sort_order: (count ?? 0) + 1,
    })
    .select("*")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/dashboard/thiet-lap");
  revalidatePath("/dashboard/photobook");
  return { error: null, photo: photo as WeddingPhoto };
}

export async function deleteWeddingPhoto(photoId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: photo } = await supabase.from("wedding_photos").select("card_id").eq("id", photoId).maybeSingle();
  if (!photo?.card_id) return { error: "Không tìm thấy ảnh" };
  const gate = await requireCardSubscription(supabase, photo.card_id);
  if (!gate.ok) return { error: gate.error };
  const { error } = await supabase.from("wedding_photos").delete().eq("id", photoId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/thiet-lap");
  revalidatePath("/dashboard/photobook");
  return { error: null };
}

export async function updateWeddingPhotoCaption(
  photoId: string,
  caption: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: photo } = await supabase.from("wedding_photos").select("card_id").eq("id", photoId).maybeSingle();
  if (!photo?.card_id) return { error: "Không tìm thấy ảnh" };
  const gate = await requireCardSubscription(supabase, photo.card_id);
  if (!gate.ok) return { error: gate.error };
  const { error } = await supabase.from("wedding_photos").update({ caption }).eq("id", photoId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/photobook");
  return { error: null };
}

export async function updatePhotoOrder(
  cardId: string,
  orderedIds: string[]
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const gate = await requireCardSubscription(supabase, cardId);
  if (!gate.ok) return { error: gate.error };
  let sort = 0;
  for (const id of orderedIds) {
    const { error } = await supabase.from("wedding_photos").update({ sort_order: sort }).eq("id", id).eq("card_id", cardId);
    if (error) return { error: error.message };
    sort += 1;
  }
  revalidatePath("/dashboard/thiet-lap");
  return { error: null };
}

// ─── Visual Editor Actions ────────────────────────────────────────────────────

export async function saveCardContentJson(
  cardId: string,
  contentJson: Record<string, unknown>
): Promise<{
  error: string | null;
  updatedAt?: string;
  savedContent?: Record<string, unknown>;
  fieldPatch?: Partial<
    Pick<WeddingCard, "wedding_date" | "bride_name" | "groom_name" | "venue_name" | "venue_address">
  >;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const gate = await requireCardSubscription(supabase, cardId);
  if (!gate.ok) return { error: gate.error };

  const { data: card, error: fetchErr } = await supabase
    .from("wedding_cards")
    .select(
      "slug, wedding_date, bride_name, groom_name, venue_name, venue_address"
    )
    .eq("id", cardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr || !card) return { error: "Không tìm thấy thiệp" };

  // Preserve exactly what the editor has — do NOT sync cardField values back from DB,
  // that would silently overwrite the user's just-made edits.
  const prepared = prepareContentForSave(contentJson);
  // Extract bound field values from the editor JSON to keep DB columns in sync.
  const fieldPatch = extractCardFieldsFromContent(prepared);
  const updatedAt = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("wedding_cards")
    .update({
      content_json: prepared,
      updated_at: updatedAt,
      ...fieldPatch,
    })
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select("id, updated_at, content_json")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) {
    return { error: "Không lưu được thiệp. Kiểm tra gói dịch vụ đã thanh toán." };
  }

  revalidatePath(`/dashboard/editor/${cardId}`);
  revalidatePath(`/dashboard/${cardId}`);
  revalidatePath(`/dashboard/cai-dat-thiep`);
  revalidatePath("/dashboard");
  if (card.slug) {
    revalidatePath(`/thiep/${card.slug}`);
    revalidatePath(`/thiep/${card.slug}`, "layout");
  }
  return {
    error: null,
    updatedAt: updated.updated_at as string,
    savedContent: (updated.content_json as Record<string, unknown>) ?? prepared,
    fieldPatch: Object.keys(fieldPatch).length > 0 ? fieldPatch : undefined,
  };
}

export async function applyTemplateToCard(
  cardId: string,
  templateId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const gate = await requireCardSubscription(supabase, cardId);
  if (!gate.ok) return { error: gate.error };

  const { data: template, error: tplErr } = await supabase
    .from("templates")
    .select("content_json, plan_required")
    .eq("id", templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (tplErr || !template) return { error: "Không tìm thấy mẫu thiệp" };

  const { data: card } = await supabase
    .from("wedding_cards")
    .select("plan, wedding_date, bride_name, groom_name, venue_name, venue_address")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!card) return { error: "Không tìm thấy thiệp" };

  if (!planMeetsRequirement(card.plan as Plan, template.plan_required as Plan)) {
    return { error: `Mẫu này yêu cầu gói ${template.plan_required.toUpperCase()}` };
  }

  const tplJson = template.content_json as Record<string, unknown>;
  const contentJson = isCraftContentJson(tplJson)
    ? syncCardFieldsInContent(tplJson, card)
    : template.content_json;

  const { data: updated, error } = await supabase
    .from("wedding_cards")
    .update({
      template_id: templateId,
      content_json: contentJson,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!updated) return { error: "Không áp dụng được mẫu. Kiểm tra gói dịch vụ đã thanh toán." };
  revalidatePath(`/dashboard/editor/${cardId}`);
  revalidatePath(`/dashboard/cai-dat-thiep`);
  return { error: null };
}
