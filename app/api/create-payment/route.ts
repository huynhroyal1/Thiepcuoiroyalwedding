import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { createPaymentSchema } from "@/lib/validations/api";
import { generatePayOSOrderCode, getPayOS, payosPaymentDescription } from "@/lib/payos";
import { getPlanPrices } from "@/lib/plans/get-plan-prices";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const planKey = parsed.data.plan;
  const planPrices = await getPlanPrices();
  const planInfo = planPrices[planKey];

  if (planInfo.price <= 0) {
    return NextResponse.json({ error: "Gói này đang miễn phí — không cần thanh toán" }, { status: 400 });
  }

  const { data: card, error: cardErr } = await supabase
    .from("wedding_cards")
    .select("id, user_id")
    .eq("id", parsed.data.cardId)
    .maybeSingle();

  if (cardErr || !card || card.user_id !== user.id) {
    return NextResponse.json({ error: "Không tìm thấy thiệp" }, { status: 404 });
  }

  const orderCode = generatePayOSOrderCode();
  const payosOrderId = String(orderCode);

  const { data: orderRow, error: orderInsErr } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      card_id: card.id,
      payos_order_id: payosOrderId,
      plan: planKey,
      amount: planInfo.price,
      status: "pending",
      order_type: "plan",
    })
    .select("id")
    .single();

  if (orderInsErr || !orderRow) {
    return NextResponse.json({ error: orderInsErr?.message ?? "Không tạo được đơn" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = `${appUrl}/dashboard/goi-dich-vu?success=true&orderId=${orderRow.id}`;
  const cancelUrl = `${appUrl}/dashboard/goi-dich-vu?cancelled=true`;

  try {
    const payos = getPayOS();
    const payment = await payos.paymentRequests.create({
      orderCode,
      amount: planInfo.price,
      description: payosPaymentDescription(planInfo.description || planInfo.name),
      returnUrl,
      cancelUrl,
    });

    return NextResponse.json({ checkoutUrl: payment.checkoutUrl, orderId: orderRow.id });
  } catch (e) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderRow.id);
    const message = e instanceof Error ? e.message : "PayOS error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
