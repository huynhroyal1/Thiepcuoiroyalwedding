import { ensureWeddingCard } from "@/app/actions/wedding-card";
import { DashboardHomeClient, type DashboardStats } from "@/components/dashboard/DashboardHomeClient";
import { getCardEntitlements, hasEntitlement } from "@/lib/features/get-card-entitlements";
import { getPlanConfig } from "@/lib/plans/plan-config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const ensured = await ensureWeddingCard();
  const card = ensured.data;

  const { data: cards } = await supabase
    .from("wedding_cards")
    .select("id, status, view_count")
    .eq("user_id", user.id);

  const cardList = cards ?? [];
  const cardIds = cardList.map((c) => c.id);

  let guestCount = 0;
  let wishCount = 0;

  if (cardIds.length > 0) {
    const [{ count: guests }, { count: wishes }] = await Promise.all([
      supabase.from("guests").select("*", { count: "exact", head: true }).in("card_id", cardIds),
      supabase.from("wishes").select("*", { count: "exact", head: true }).in("card_id", cardIds),
    ]);
    guestCount = guests ?? 0;
    wishCount = wishes ?? 0;
  }

  const stats: DashboardStats = {
    totalCards: cardList.length,
    publicCards: cardList.filter((c) => c.status === "active").length,
    activeCards: cardList.filter((c) => c.status === "active").length,
    totalViews: cardList.reduce((sum, c) => sum + (c.view_count ?? 0), 0),
    guestCount,
    wishCount,
  };

  const plan = card?.plan ?? "basic";
  const planConfig = await getPlanConfig();
  const entitlements = card ? await getCardEntitlements(card.id) : [];
  const hasStats = hasEntitlement(entitlements, "stats", plan, planConfig, card ?? undefined);

  if (!card) {
    return (
      <DashboardHomeClient
        plan={plan}
        hasStats={false}
        stats={{
          totalCards: 0,
          publicCards: 0,
          activeCards: 0,
          totalViews: 0,
          guestCount: 0,
          wishCount: 0,
        }}
      />
    );
  }

  return <DashboardHomeClient plan={plan} stats={stats} hasStats={hasStats} />;
}
