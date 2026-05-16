import { Suspense } from "react";
import { ensureWeddingCard } from "@/app/actions/wedding-card";
import { getPlanPrices } from "@/lib/plans/get-plan-prices";
import { createClient } from "@/lib/supabase/server";
import { GoiDichVuClient } from "./GoiDichVuClient";

export default async function GoiDichVuPage() {
  const ensured = await ensureWeddingCard();
  if (!ensured.data) return <p className="text-red-600">{ensured.error}</p>;
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", ensured.data.user_id)
    .order("created_at", { ascending: false });
  const planPrices = await getPlanPrices();

  return (
    <Suspense fallback={null}>
      <GoiDichVuClient
        cardId={ensured.data.id}
        currentPlan={ensured.data.plan}
        paidAt={ensured.data.paid_at}
        orders={orders ?? []}
        planPrices={planPrices}
      />
    </Suspense>
  );
}
