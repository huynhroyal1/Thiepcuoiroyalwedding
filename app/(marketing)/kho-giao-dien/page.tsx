import { redirect } from "next/navigation";
import { getFaqItems } from "@/lib/data/faq-items";
import { getMarketingTemplates } from "@/lib/marketing/get-marketing-templates";
import { KhoGiaoDienClient } from "./KhoGiaoDienClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { searchParams: Promise<{ template?: string }> };

export default async function KhoGiaoDienPage({ searchParams }: Props) {
  const { template: templateId } = await searchParams;
  if (templateId?.trim()) {
    redirect(`/thiep/mau/${encodeURIComponent(templateId.trim())}`);
  }

  const [templates, faqItems] = await Promise.all([getMarketingTemplates(), getFaqItems()]);
  return <KhoGiaoDienClient templates={templates} faqItems={faqItems} />;
}
