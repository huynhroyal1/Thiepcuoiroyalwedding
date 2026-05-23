import { MehappyCloneHome } from "@/components/landing/MehappyCloneHome";
import { getFaqItems } from "@/lib/data/faq-items";
import { getMarketingTemplates } from "@/lib/marketing/get-marketing-templates";
import { getPublicShowcaseCards } from "@/lib/marketing/get-public-showcase-cards";
import { templateToShowcaseItem } from "@/lib/marketing/template-showcase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MarketingHomePage() {
  const [templates, couples, faqItems] = await Promise.all([
    getMarketingTemplates(),
    getPublicShowcaseCards(6),
    getFaqItems(),
  ]);

  const showcaseTemplates = templates.slice(0, 8).map((t, i) => templateToShowcaseItem(t, i));

  return (
    <MehappyCloneHome
      showcaseTemplates={showcaseTemplates}
      couplesPreview={couples}
      faqItems={faqItems}
    />
  );
}
