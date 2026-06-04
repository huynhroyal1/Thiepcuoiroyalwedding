import type { Metadata } from "next";
import { getFaqItems } from "@/lib/data/faq-items";
import { getPlanPrices } from "@/lib/plans/get-plan-prices";
import { BangGiaClient } from "./BangGiaClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bảng giá — Royal Wedding",
  description:
    "So sánh gói Basic, Pro và VIP: thiệp cưới online, album ảnh, thời gian công khai, RSVP và nâng cấp linh hoạt.",
};

export default async function BangGiaPage() {
  const [faqItems, planPrices] = await Promise.all([getFaqItems(), getPlanPrices()]);
  return <BangGiaClient faqItems={faqItems} planPrices={planPrices} />;
}
