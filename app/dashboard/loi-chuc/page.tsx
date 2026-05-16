import { ensureWeddingCard } from "@/app/actions/wedding-card";
import { getCardEntitlements, hasEntitlement } from "@/lib/features/get-card-entitlements";
import { getPlanConfig } from "@/lib/plans/plan-config";
import { createClient } from "@/lib/supabase/server";
import { LoiChucClient } from "./LoiChucClient";

export default async function LoiChucPage() {
  const ensured = await ensureWeddingCard();
  if (!ensured.data) return <p className="text-red-600">{ensured.error}</p>;
  const supabase = await createClient();
  const { data: wishes } = await supabase
    .from("wishes")
    .select("*")
    .eq("card_id", ensured.data.id)
    .order("created_at", { ascending: false });
  const planConfig = await getPlanConfig();
  const plan = ensured.data.plan ?? "basic";
  const entitlements = await getCardEntitlements(ensured.data.id);
  const hasAutoApprove = hasEntitlement(
    entitlements,
    "auto_approve_wishes",
    plan,
    planConfig,
    ensured.data
  );

  return <LoiChucClient wishes={wishes ?? []} plan={plan} showUpsell={!hasAutoApprove} />;
}
