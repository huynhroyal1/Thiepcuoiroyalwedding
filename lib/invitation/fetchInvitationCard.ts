import { unstable_noStore as noStore } from "next/cache";
import { createPublicSupabase } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { WeddingCard } from "@/types";

export type InvitationCardResult = {
  card: WeddingCard;
  /** True when owner/admin views draft or non-active card (not visible to public). */
  isOwnerPreview: boolean;
};

/**
 * Load a card for /thiep/[slug]:
 * - Public: only status = active (anon RLS).
 * - Logged-in owner or admin: draft/active for preview.
 */
export async function fetchInvitationCard(
  slug: string,
): Promise<InvitationCardResult | null> {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin") {
      const { data: adminCard } = await supabase
        .from("wedding_cards")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (adminCard) {
        return {
          card: adminCard as WeddingCard,
          isOwnerPreview: (adminCard as WeddingCard).status !== "active",
        };
      }
    } else {
      const { data: ownCard } = await supabase
        .from("wedding_cards")
        .select("*")
        .eq("slug", slug)
        .eq("user_id", user.id)
        .maybeSingle();

      if (ownCard) {
        return {
          card: ownCard as WeddingCard,
          isOwnerPreview: (ownCard as WeddingCard).status !== "active",
        };
      }
    }
  }

  const publicSupabase = createPublicSupabase();
  const { data: publicCard } = await publicSupabase
    .from("wedding_cards")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (publicCard) {
    return { card: publicCard as WeddingCard, isOwnerPreview: false };
  }

  return null;
}

export async function fetchInvitationPhotos(cardId: string) {
  const publicSupabase = createPublicSupabase();
  const { data: publicPhotos } = await publicSupabase
    .from("wedding_photos")
    .select("*")
    .eq("card_id", cardId)
    .order("sort_order", { ascending: true });

  if (publicPhotos && publicPhotos.length > 0) {
    return publicPhotos;
  }

  const supabase = await createClient();
  const { data: ownPhotos } = await supabase
    .from("wedding_photos")
    .select("*")
    .eq("card_id", cardId)
    .order("sort_order", { ascending: true });

  return ownPhotos ?? [];
}
