import { formatVnd } from "@/lib/utils";

export type PlanPriceTierInput = {
  price: number;
  discount_percent: number;
};

export type PlanPriceDisplay = {
  label: string;
  listPrice: number | null;
  discountPercent: number | null;
  isFree: boolean;
};

export function computeListPrice(price: number, discountPercent: number): number | null {
  if (price <= 0 || discountPercent <= 0 || discountPercent >= 100) return null;
  return Math.round(price / (1 - discountPercent / 100));
}

export function formatPlanPriceDisplay(tier: PlanPriceTierInput): PlanPriceDisplay {
  if (tier.price <= 0) {
    return { label: "Miễn phí", listPrice: null, discountPercent: null, isFree: true };
  }
  const pct = Math.min(99, Math.max(0, Math.round(tier.discount_percent)));
  const listPrice = computeListPrice(tier.price, pct);
  return {
    label: formatVnd(tier.price),
    listPrice,
    discountPercent: listPrice ? pct : null,
    isFree: false,
  };
}
