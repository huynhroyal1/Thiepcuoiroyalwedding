import type { Metadata } from "next";
import { getFaqItems } from "@/lib/data/faq-items";
import { getPublicShowcaseCards } from "@/lib/marketing/get-public-showcase-cards";
import { CacCapDoiClient } from "./CacCapDoiClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khám phá thiệp cưới tuyệt đẹp từ cộng đồng Royal Wedding",
  description:
    "Thư viện thiệp cưới từ cộng đồng — xem thiệp mẫu do các cặp đôi tạo trên Royal Wedding. Mỗi thẻ mở trang thiệp gốc trên nền tảng.",
};

export default async function CacCapDoiPage() {
  const [faqItems, couples] = await Promise.all([getFaqItems(), getPublicShowcaseCards(60)]);
  return <CacCapDoiClient couples={couples} faqItems={faqItems} />;
}
