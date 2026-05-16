"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatPlanPriceDisplay } from "@/lib/plans/format-plan-price";
import type { PlanPricesMap } from "@/lib/plans/get-plan-prices";
import { formatVnd } from "@/lib/utils";
import type { OrderRow, Plan } from "@/types";

type Props = {
  cardId: string;
  currentPlan: Plan;
  paidAt: string | null;
  orders: OrderRow[];
  planPrices: PlanPricesMap;
};

const PLAN_ORDER: Plan[] = ["basic", "pro", "vip"];

const PLAN_FEATURES: Record<Plan, string[]> = {
  basic: ["1 thiệp", "Không giới hạn khách", "Mẫu Classic", "6 tháng công khai"],
  pro: ["Mẫu Pro", "Album 40 ảnh", "Nhạc nền", "Hiệu ứng", "RSVP đầy đủ"],
  vip: ["Full tính năng", "Ảnh tối đa", "Bỏ branding", "Thiệp cá nhân hoá"],
};

export function GoiDichVuClient({
  cardId,
  currentPlan,
  paidAt,
  orders: initial,
  planPrices,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders] = useState(initial);

  const subscriptionActive = paidAt != null;

  useEffect(() => {
    if (searchParams.get("cancelled")) {
      toast.message("Đã hủy thanh toán");
      return;
    }

    if (!searchParams.get("success")) return;

    let cancelled = false;
    const orderId = searchParams.get("orderId");

    void (async () => {
      const res = await fetch("/api/payos/sync-after-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId ? { orderId } : {}),
      });
      const data = (await res.json()) as { ok?: boolean; fulfilled?: boolean; error?: string };
      if (cancelled) return;

      if (!res.ok) {
        toast.error(data.error ?? "Không đồng bộ được trạng thái thanh toán");
      } else if (data.fulfilled) {
        toast.success("Thanh toán thành công — gói đã được kích hoạt");
      } else {
        toast.message(
          "Đang chờ xác nhận thanh toán. Nếu đã chuyển khoản, thử tải lại trang sau vài giây.",
        );
      }
      router.refresh();
      router.replace("/dashboard/goi-dich-vu");
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, router]);

  const pay = async (plan: Plan) => {
    const tier = planPrices[plan];
    if (tier.price <= 0) {
      toast.message("Gói này đang miễn phí — liên hệ hỗ trợ để kích hoạt");
      return;
    }
    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, cardId }),
    });
    const json = (await res.json()) as { checkoutUrl?: string; error?: string };
    if (!res.ok || !json.checkoutUrl) {
      toast.error(json.error ?? "Không tạo được thanh toán");
      return;
    }
    window.location.href = json.checkoutUrl;
  };

  const showPaywall = searchParams.get("paywall") === "1" || !subscriptionActive;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Gói dịch vụ</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {subscriptionActive ? (
            <>
              Gói hiện tại: <strong className="text-mewedding-rose">{currentPlan.toUpperCase()}</strong>
            </>
          ) : (
            <>Chọn gói và thanh toán để bắt đầu sử dụng dashboard.</>
          )}
        </p>
      </div>

      {showPaywall && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p className="font-semibold">Bạn chưa kích hoạt gói dịch vụ</p>
          <p className="mt-1 text-amber-900/90">
            Vui lòng chọn <strong>Basic</strong>, <strong>Pro</strong> hoặc <strong>VIP</strong> và hoàn tất
            thanh toán. Bạn có thể nâng cấp thẳng Pro/VIP mà không cần mua Basic trước.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((plan) => {
          const tier = planPrices[plan];
          const display = formatPlanPriceDisplay(tier);
          const isCurrent = subscriptionActive && currentPlan === plan;
          const rank = (p: Plan) => ({ basic: 0, pro: 1, vip: 2 })[p];
          const isDowngrade =
            subscriptionActive && rank(plan) < rank(currentPlan);
          const isUpgrade =
            subscriptionActive && rank(plan) > rank(currentPlan);

          let cta = "Chọn gói";
          if (isCurrent) cta = "Gói hiện tại";
          else if (isDowngrade) cta = "—";
          else if (isUpgrade) cta = plan === "pro" ? "Nâng cấp Pro" : "Nâng cấp VIP";
          else if (plan === "basic") cta = "Mua gói Basic";

          const disabled = isCurrent || isDowngrade || tier.price <= 0;

          return (
            <PlanCard
              key={plan}
              name={tier.name}
              priceLabel={display.label}
              listPrice={display.listPrice}
              discountPercent={display.discountPercent}
              features={PLAN_FEATURES[plan]}
              highlight={plan === "pro"}
              cta={cta}
              disabled={disabled}
              isCurrent={isCurrent}
              onPay={() => void pay(plan)}
            />
          );
        })}
      </div>

      <div>
        <h2 className="font-medium">Lịch sử thanh toán</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {orders.map((o) => {
            const isFeatures = o.order_type === "features";
            const label = isFeatures
              ? `Tính năng (${Array.isArray(o.feature_keys) ? o.feature_keys.length : 0})`
              : (o.plan ?? "—").toUpperCase();

            return (
              <li key={o.id} className="flex justify-between rounded border bg-white px-3 py-2">
                <span>
                  {label} — {o.status}
                </span>
                <span>{formatVnd(o.amount)}</span>
              </li>
            );
          })}
          {orders.length === 0 && <li className="text-neutral-500">Chưa có giao dịch</li>}
        </ul>
      </div>
    </div>
  );
}

function PlanCard({
  name,
  priceLabel,
  listPrice,
  discountPercent,
  features,
  cta,
  onPay,
  disabled,
  highlight,
  isCurrent,
}: {
  name: string;
  priceLabel: string;
  listPrice: number | null;
  discountPercent: number | null;
  features: string[];
  cta: string;
  onPay: () => void;
  disabled?: boolean;
  highlight?: boolean;
  isCurrent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-sm ${
        highlight ? "border-2 border-pink-400 ring-2 ring-pink-100" : "border-neutral-100"
      } ${isCurrent ? "ring-2 ring-emerald-200" : ""}`}
    >
      {highlight && (
        <span className="mb-2 inline-block rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">
          Phổ biến nhất
        </span>
      )}
      {isCurrent && (
        <span className="mb-2 ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
          Gói hiện tại
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        {listPrice != null && (
          <span className="text-lg text-neutral-400 line-through">{formatVnd(listPrice)}</span>
        )}
        {discountPercent != null && discountPercent > 0 && (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
            −{discountPercent}%
          </span>
        )}
        <span className="text-2xl font-bold text-mewedding-rose">{priceLabel}</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-neutral-700">
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <button
        type="button"
        disabled={disabled}
        onClick={onPay}
        className="mt-6 w-full rounded-lg bg-mewedding-rose py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {cta}
      </button>
    </div>
  );
}
