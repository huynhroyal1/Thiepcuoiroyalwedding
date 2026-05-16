import { PLANS, type PayablePlan } from "@/lib/payos";
import type { Plan } from "@/types";

/** Feature keys used for gating + admin toggles (per plan tier). */
export const PLAN_FEATURE_KEYS = [
  "stats",
  "auto_approve_wishes",
  "photobook",
  "remove_branding",
  "custom_confetti",
  "export_wishes",
  "guest_rsvp",
  "personalized_invite",
] as const;

export type PlanFeatureKey = (typeof PLAN_FEATURE_KEYS)[number];

export type PlanFeatureFlags = Record<PlanFeatureKey, boolean>;

export type PlanTierConfig = {
  name: string;
  price: number;
  /** 0–99: marketing strikethrough from computed list price */
  discount_percent: number;
  description: string;
  max_cards: number;
  max_photos_album: number;
  max_photos: number;
  public_months: number | null;
  features: PlanFeatureFlags;
};

export type PlanConfigMap = Record<Plan, PlanTierConfig>;

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  stats: "Thống kê thiệp (lượt xem, khách, lời chúc)",
  auto_approve_wishes: "Tự duyệt / quản lý lời chúc nâng cao",
  photobook: "Trang Photobook (quản lý album nâng cao)",
  remove_branding: "Ẩn branding meWedding",
  custom_confetti: "Tuỳ chỉnh hiệu ứng confetti",
  export_wishes: "Xuất CSV lời chúc",
  guest_rsvp: "RSVP & quản lý khách mời đầy đủ",
  personalized_invite: "Thiệp mời cá nhân hoá (link /guestToken)",
};

export const DEFAULT_PLAN_CONFIG: PlanConfigMap = {
  basic: {
    name: "Basic",
    price: 198_000,
    discount_percent: 49,
    description: "Gói Basic — thiệp cưới cơ bản",
    max_cards: 1,
    max_photos_album: 10,
    max_photos: 10,
    public_months: 6,
    features: {
      stats: false,
      auto_approve_wishes: false,
      photobook: false,
      remove_branding: false,
      custom_confetti: false,
      export_wishes: false,
      guest_rsvp: true,
      personalized_invite: false,
    },
  },
  pro: {
    name: PLANS.pro.name,
    price: PLANS.pro.price,
    discount_percent: 49,
    description: PLANS.pro.description,
    max_cards: 2,
    max_photos_album: 40,
    max_photos: 40,
    public_months: 24,
    features: {
      stats: true,
      auto_approve_wishes: true,
      photobook: true,
      remove_branding: true,
      custom_confetti: true,
      export_wishes: true,
      guest_rsvp: true,
      personalized_invite: false,
    },
  },
  vip: {
    name: PLANS.vip.name,
    price: PLANS.vip.price,
    discount_percent: 52,
    description: PLANS.vip.description,
    max_cards: 3,
    max_photos_album: 100,
    max_photos: 100,
    public_months: null,
    features: {
      stats: true,
      auto_approve_wishes: true,
      photobook: true,
      remove_branding: true,
      custom_confetti: true,
      export_wishes: true,
      guest_rsvp: true,
      personalized_invite: true,
    },
  },
};

function mergeTier(partial: Partial<PlanTierConfig> | undefined, fallback: PlanTierConfig): PlanTierConfig {
  if (!partial) return fallback;
  return {
    ...fallback,
    ...partial,
    features: { ...fallback.features, ...(partial.features ?? {}) },
  };
}

export function parsePlanConfig(value: unknown): PlanConfigMap | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const tiers: Plan[] = ["basic", "pro", "vip"];
  const out = {} as PlanConfigMap;
  for (const tier of tiers) {
    const raw = obj[tier];
    if (!raw || typeof raw !== "object") return null;
    const p = raw as Record<string, unknown>;
    const featuresRaw = p.features;
    const features = { ...DEFAULT_PLAN_CONFIG[tier].features };
    if (featuresRaw && typeof featuresRaw === "object") {
      for (const key of PLAN_FEATURE_KEYS) {
        if (typeof (featuresRaw as Record<string, unknown>)[key] === "boolean") {
          features[key] = (featuresRaw as Record<string, boolean>)[key];
        }
      }
    }
    const price = Number(p.price);
    const discountRaw = Number(p.discount_percent);
    const discount_percent = Number.isFinite(discountRaw)
      ? Math.min(99, Math.max(0, Math.round(discountRaw)))
      : DEFAULT_PLAN_CONFIG[tier].discount_percent;
    out[tier] = {
      name: String(p.name ?? DEFAULT_PLAN_CONFIG[tier].name),
      price: Number.isFinite(price) ? price : DEFAULT_PLAN_CONFIG[tier].price,
      discount_percent,
      description: String(p.description ?? DEFAULT_PLAN_CONFIG[tier].description),
      max_cards: Math.max(1, Number(p.max_cards) || DEFAULT_PLAN_CONFIG[tier].max_cards),
      max_photos_album: Math.max(
        0,
        Number(p.max_photos_album ?? p.max_photos) || DEFAULT_PLAN_CONFIG[tier].max_photos_album
      ),
      max_photos: Math.max(0, Number(p.max_photos) || DEFAULT_PLAN_CONFIG[tier].max_photos),
      public_months:
        p.public_months === null || p.public_months === "lifetime"
          ? null
          : Math.max(1, Number(p.public_months) || DEFAULT_PLAN_CONFIG[tier].public_months || 6),
      features,
    };
  }
  return out;
}

export function mergeLegacyPlanPrices(
  config: PlanConfigMap,
  planPrices: Partial<Record<PayablePlan, { name: string; price: number; description: string }>>
): PlanConfigMap {
  const next = { ...config };
  if (planPrices.pro) {
    next.pro = {
      ...config.pro,
      name: planPrices.pro.name,
      price: planPrices.pro.price,
      description: planPrices.pro.description,
    };
  }
  if (planPrices.vip) {
    next.vip = {
      ...config.vip,
      name: planPrices.vip.name,
      price: planPrices.vip.price,
      description: planPrices.vip.description,
    };
  }
  if (planPrices.basic) {
    next.basic = {
      ...config.basic,
      name: planPrices.basic.name,
      price: planPrices.basic.price,
      description: planPrices.basic.description,
    };
  }
  return next;
}

export function finalizePlanConfig(config: PlanConfigMap): PlanConfigMap {
  return {
    basic: mergeTier(config.basic, DEFAULT_PLAN_CONFIG.basic),
    pro: mergeTier(config.pro, DEFAULT_PLAN_CONFIG.pro),
    vip: mergeTier(config.vip, DEFAULT_PLAN_CONFIG.vip),
  };
}

export function planHasFeature(
  planConfig: PlanConfigMap,
  plan: Plan,
  feature: PlanFeatureKey
): boolean {
  return planConfig[plan]?.features[feature] ?? false;
}
