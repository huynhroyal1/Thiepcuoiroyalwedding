import { Suspense } from "react";
import { ensureWeddingCard } from "@/app/actions/wedding-card";
import { isCardSubscriptionActive } from "@/lib/plans/is-card-subscription-active";
import { getPlanConfig } from "@/lib/plans/plan-config";
import { getPlanPrices } from "@/lib/plans/get-plan-prices";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/types";
import { GoiDichVuClient } from "./GoiDichVuClient";

export const dynamic = "force-dynamic";

export default async function GoiDichVuPage() {
  const ensured = await ensureWeddingCard();
  if (!ensured.data) return <p className="text-red-600">{ensured.error}</p>;
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", ensured.data.user_id)
    .order("created_at", { ascending: false });
  const [planPrices, planConfig] = await Promise.all([getPlanPrices(), getPlanConfig()]);
  const subscriptionActive = isCardSubscriptionActive(
    { plan: ensured.data.plan as Plan, paid_at: ensured.data.paid_at },
    planConfig
  );

  return (
    <Suspense fallback={null}>
      <GoiDichVuClient
        cardId={ensured.data.id}
        currentPlan={ensured.data.plan}
        paidAt={ensured.data.paid_at}
        subscriptionActive={subscriptionActive}
        orders={orders ?? []}
        planPrices={planPrices}
      />
    </Suspense>
  );
}
