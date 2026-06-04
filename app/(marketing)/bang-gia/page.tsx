import type { Metadata } from "next";
import { getFaqItems } from "@/lib/data/faq-items";
import { getPlanPrices, getPlanConfigFull } from "@/lib/plans/get-plan-prices";
import type { PlanConfigMap } from "@/lib/plans/plan-config-shared";
import { BangGiaClient } from "./BangGiaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bảng giá — Royal Wedding",
  description:
    "So sánh gói Basic, Pro và VIP: thiệp cưới online, album ảnh, thời gian công khai, RSVP và nâng cấp linh hoạt.",
};

export default async function BangGiaPage() {
  const [faqItems, planPrices, planConfig] = await Promise.all([
    getFaqItems(),
    getPlanPrices(),
    getPlanConfigFull(),
  ]);
  console.log('[BangGiaPage] planConfig:', JSON.stringify(planConfig, null, 2));
  return <BangGiaClient faqItems={faqItems} planPrices={planPrices} planConfig={planConfig} />;
}
