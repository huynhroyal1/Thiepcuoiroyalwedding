import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS } from "@/lib/payos";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PLAN_CONFIG,
  finalizePlanConfig,
  mergeLegacyPlanPrices,
  parsePlanConfig,
  type PlanConfigMap,
} from "@/lib/plans/plan-config-shared";

export type { PlanConfigMap, PlanFeatureKey, PlanTierConfig } from "@/lib/plans/plan-config-shared";
export {
  DEFAULT_PLAN_CONFIG,
  PLAN_FEATURE_KEYS,
  PLAN_FEATURE_LABELS,
  planHasFeature,
} from "@/lib/plans/plan-config-shared";

export async function getPlanConfigWithClient(supabase: SupabaseClient): Promise<PlanConfigMap> {
  const { data: configRow } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", "plan_config")
    .maybeSingle();

  const parsed = parsePlanConfig(configRow?.value);
  let config = parsed ?? { ...DEFAULT_PLAN_CONFIG };

  if (!parsed) {
    const { data: pricesRow } = await supabase
      .from("website_settings")
      .select("value")
      .eq("key", "plan_prices")
      .maybeSingle();
    if (pricesRow?.value && typeof pricesRow.value === "object") {
      const pp = pricesRow.value as Record<string, { name?: string; price?: number; description?: string }>;
      if (pp.pro && pp.vip) {
        config = mergeLegacyPlanPrices(config, {
          pro: {
            name: String(pp.pro.name ?? PLANS.pro.name),
            price: Number(pp.pro.price) || PLANS.pro.price,
            description: String(pp.pro.description ?? PLANS.pro.description),
          },
          vip: {
            name: String(pp.vip.name ?? PLANS.vip.name),
            price: Number(pp.vip.price) || PLANS.vip.price,
            description: String(pp.vip.description ?? PLANS.vip.description),
          },
        });
      }
    }
  }

  return finalizePlanConfig(config);
}

export async function getPlanConfig(serviceRole = false): Promise<PlanConfigMap> {
  const supabase = serviceRole ? createServiceRoleClient() : await createClient();
  return getPlanConfigWithClient(supabase);
}
