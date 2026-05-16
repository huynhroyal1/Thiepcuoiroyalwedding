import type { SupabaseClient } from "@supabase/supabase-js";

type OrderRow = {
  id: string;
  card_id: string | null;
  plan: string | null;
  status: string;
  order_type: string | null;
  feature_keys: unknown;
  payos_order_id: string | null;
  video_order_id: string | null;
};

export async function fulfillPaidOrder(
  supabase: SupabaseClient,
  orderId: string,
  payosOrderId?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const { data: order, error: findErr } = await supabase
    .from("orders")
    .select("id, card_id, plan, status, order_type, feature_keys, payos_order_id, video_order_id")
    .eq("id", orderId)
    .maybeSingle();

  if (findErr || !order) {
    return { ok: false, error: findErr?.message ?? "Order not found" };
  }

  if (order.status === "paid") {
    return { ok: true };
  }

  const now = new Date().toISOString();
  const paymentRef = payosOrderId ?? order.payos_order_id;

  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: now })
    .eq("id", order.id);

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }

  if (!order.card_id) {
    return { ok: true };
  }

  const typed = order as OrderRow;

  if (typed.order_type === "features") {
    const featureKeys = Array.isArray(typed.feature_keys)
      ? (typed.feature_keys as string[])
      : [];

    if (featureKeys.length > 0) {
      const { data: card } = await supabase
        .from("wedding_cards")
        .select("user_id")
        .eq("id", typed.card_id)
        .maybeSingle();

      const userId = card?.user_id;
      if (userId) {
        await supabase.from("wedding_card_feature_entitlements").upsert(
          featureKeys.map((feature_key) => ({
            user_id: userId,
            card_id: typed.card_id,
            feature_key,
            purchased_at: now,
          })),
          { onConflict: "card_id,feature_key" }
        );
      }

      if (featureKeys.includes("remove_branding")) {
        await supabase
          .from("wedding_cards")
          .update({ remove_branding: true })
          .eq("id", typed.card_id);
      }
    }
  } else if (typed.order_type === "video" && typed.video_order_id) {
    await supabase
      .from("video_orders")
      .update({ status: "paid" })
      .eq("id", typed.video_order_id);
  } else {
    const plan = typed.plan as "basic" | "pro" | "vip";
    if (plan === "basic" || plan === "pro" || plan === "vip") {
      await supabase
        .from("wedding_cards")
        .update({
          plan,
          paid_at: now,
          status: "active",
          payment_order_id: paymentRef,
          remove_branding: plan === "vip",
        })
        .eq("id", typed.card_id);
    }
  }

  return { ok: true };
}
