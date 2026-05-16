import { PayOS } from "@payos/node";

let payosSingleton: PayOS | null = null;

export function getPayOS(): PayOS {
  if (!payosSingleton) {
    payosSingleton = new PayOS();
  }
  return payosSingleton;
}

export const PLANS = {
  basic: {
    name: "Gói Basic",
    price: 198_000,
    description: "Gói Basic",
  },
  pro: {
    name: "Gói Pro",
    price: 199_000,
    /** Short default; admin may override — PayOS caps at PAYOS_DESCRIPTION_MAX_LENGTH */
    description: "Gói Pro — nâng cấp",
  },
  vip: {
    name: "Gói VIP",
    price: 399_000,
    description: "Gói VIP — nâng cấp",
  },
} as const;

export type PayablePlan = keyof typeof PLANS;

export function generatePayOSOrderCode(): number {
  const seconds = Math.floor(Date.now() / 1000);
  return seconds * 1000 + Math.floor(Math.random() * 1000);
}

/** PayOS: "Mô tả tối đa 25 kí tự" (error code 20). */
export const PAYOS_DESCRIPTION_MAX_LENGTH = 25;

/** Truncate / normalize text for `paymentRequests.create({ description })`. */
export function payosPaymentDescription(input: string | null | undefined): string {
  const normalized = (input ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  const fallback = "Thanh toan";
  const base = normalized || fallback;
  if (base.length <= PAYOS_DESCRIPTION_MAX_LENGTH) return base;
  return base.slice(0, PAYOS_DESCRIPTION_MAX_LENGTH);
}
