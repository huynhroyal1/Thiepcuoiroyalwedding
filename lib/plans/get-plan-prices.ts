import { getPlanConfig } from "@/lib/plans/plan-config";
import type { PlanConfigMap, PlanTierConfig } from "@/lib/plans/plan-config-shared";
import type { Plan } from "@/types";

export type PlanPriceInfo = Pick<PlanTierConfig, "name" | "price" | "discount_percent" | "description">;

export type PlanPricesMap = Record<Plan, PlanPriceInfo>;

export function planConfigToPricesMap(config: PlanConfigMap): PlanPricesMap {
  const tiers: Plan[] = ["basic", "pro", "vip"];
  return Object.fromEntries(
    tiers.map((tier) => [
      tier,
      {
        name: config[tier].name,
        price: config[tier].price,
        discount_percent: config[tier].discount_percent,
        description: config[tier].description,
      },
    ])
  ) as PlanPricesMap;
}

export async function getPlanPrices(serviceRole = false): Promise<PlanPricesMap> {
  const config = await getPlanConfig(serviceRole);
  return planConfigToPricesMap(config);
}
