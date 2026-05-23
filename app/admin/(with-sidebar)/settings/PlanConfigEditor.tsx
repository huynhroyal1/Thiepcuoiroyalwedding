"use client";

import {
  PLAN_FEATURE_KEYS,
  PLAN_FEATURE_LABELS,
  type PlanConfigMap,
  type PlanFeatureKey,
} from "@/lib/plans/plan-config-shared";
import { computeListPrice } from "@/lib/plans/format-plan-price";
import { formatVnd } from "@/lib/utils";
import type { Plan } from "@/types";

type Props = {
  planConfig: PlanConfigMap;
  onChange: (next: PlanConfigMap) => void;
};

const TIERS: Plan[] = ["basic", "pro", "vip"];

export function PlanConfigEditor({ planConfig, onChange }: Props) {
  const setTier = (tier: Plan, patch: Partial<PlanConfigMap[Plan]>) => {
    onChange({ ...planConfig, [tier]: { ...planConfig[tier], ...patch } });
  };

  const setFeature = (tier: Plan, key: PlanFeatureKey, value: boolean) => {
    onChange({
      ...planConfig,
      [tier]: {
        ...planConfig[tier],
        features: { ...planConfig[tier].features, [key]: value },
      },
    });
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-neutral-600">
        Cấu hình giá bán, % khuyến mãi và quyền theo từng gói. Lưu vào{" "}
        <code className="rounded bg-neutral-100 px-1">plan_config</code>. Giá = 0 → miễn phí (bỏ
        paywall). Basic / Pro / VIP đều thanh toán qua PayOS khi giá &gt; 0.
      </p>
      {TIERS.map((tier) => {
        const t = planConfig[tier];
        const listPreview = computeListPrice(t.price, t.discount_percent);
        return (
          <div key={tier} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold uppercase tracking-wide text-rose-600">{tier}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Tên hiển thị</span>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={t.name}
                  onChange={(e) => setTier(tier, { name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Giá bán (VND)</span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={t.price}
                  onChange={(e) => setTier(tier, { price: Number(e.target.value) })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">% khuyến mãi (0–99)</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={t.discount_percent}
                  onChange={(e) =>
                    setTier(tier, {
                      discount_percent: Math.min(99, Math.max(0, Number(e.target.value))),
                    })
                  }
                />
                {listPreview != null && t.price > 0 && (
                  <span className="mt-1 block text-xs text-neutral-600">
                    Giá gốc hiển thị (gạch): <strong>{formatVnd(listPreview)}</strong> — bán{" "}
                    <strong>{formatVnd(t.price)}</strong>
                    {t.discount_percent > 0 ? ` (−${t.discount_percent}%)` : ""}
                  </span>
                )}
                {t.price <= 0 && (
                  <span className="mt-1 block text-xs text-emerald-700">Gói miễn phí — không qua PayOS</span>
                )}
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium">Mô tả (PayOS / marketing)</span>
                <textarea
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  rows={2}
                  value={t.description}
                  onChange={(e) => setTier(tier, { description: e.target.value })}
                />
                <span className="mt-1 block text-xs text-neutral-500">
                  PayOS giới hạn mô tả thanh toán tối đa 25 ký tự; hệ thống tự cắt nếu dài hơn.
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Số thiệp tối đa / user</span>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={t.max_cards}
                  onChange={(e) => setTier(tier, { max_cards: Number(e.target.value) })}
                />
                <span className="mt-1 text-xs text-amber-700">
                  Code hiện chỉ dùng 1 thiệp — cần dev thêm luồng đa thiệp.
                </span>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Giới hạn ảnh (album + photobook)</span>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={t.max_photos}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setTier(tier, { max_photos: n, max_photos_album: n });
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Thời gian công khai (tháng)</span>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Trống = trọn đời"
                  value={t.public_months ?? ""}
                  onChange={(e) =>
                    setTier(tier, {
                      public_months: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
                <span className="mt-1 text-xs text-amber-700">
                  Chưa có cron tự set expired — chỉ cấu hình ý định.
                </span>
              </label>
            </div>
            <div className="mt-6">
              <p className="mb-3 text-sm font-semibold text-neutral-800">Tính năng được phép</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PLAN_FEATURE_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-2 rounded-lg border border-neutral-100 p-3 hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={t.features[key]}
                      onChange={(e) => setFeature(tier, key, e.target.checked)}
                    />
                    <span className="text-sm text-neutral-700">{PLAN_FEATURE_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
