import { ensureWeddingCard } from "@/app/actions/wedding-card";
import { getCardEntitlements, hasEntitlement } from "@/lib/features/get-card-entitlements";
import { getPlanConfig } from "@/lib/plans/plan-config";
import { createClient } from "@/lib/supabase/server";
import { ThongKeClient } from "./ThongKeClient";

export const metadata = { title: "Thống kê thiệp cưới" };

export default async function ThongKePage() {
  const ensured = await ensureWeddingCard();
  if (!ensured.data) {
    return <p className="text-red-600">{ensured.error}</p>;
  }

  const card = ensured.data;
  const supabase = await createClient();

  const planConfig = await getPlanConfig();
  const entitlements = await getCardEntitlements(card.id);
  const plan = card.plan ?? "basic";
  const hasStats = hasEntitlement(entitlements, "stats", plan, planConfig, card);

  const [{ count: guestCount }, { count: wishCount }, { count: approvedWishes }] = await Promise.all([
    supabase.from("guests").select("*", { count: "exact", head: true }).eq("card_id", card.id),
    supabase.from("wishes").select("*", { count: "exact", head: true }).eq("card_id", card.id),
    supabase
      .from("wishes")
      .select("*", { count: "exact", head: true })
      .eq("card_id", card.id)
      .eq("is_approved", true),
  ]);

  const { data: recentWishes } = await supabase
    .from("wishes")
    .select("guest_name, message, is_approved, created_at")
    .eq("card_id", card.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <ThongKeClient
      hasStats={hasStats}
      plan={plan}
      stats={{
        viewCount: card.view_count ?? 0,
        guestCount: guestCount ?? 0,
        wishCount: wishCount ?? 0,
        approvedWishes: approvedWishes ?? 0,
        status: card.status,
        slug: card.slug,
      }}
      recentWishes={recentWishes ?? []}
    />
  );
}
