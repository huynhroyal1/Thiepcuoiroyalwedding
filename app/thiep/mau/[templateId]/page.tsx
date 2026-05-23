import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { TemplatePreviewBanner } from "@/components/invitation/TemplatePreviewBanner";
import { buildTemplatePreviewCard } from "@/lib/invitation/buildTemplatePreviewCard";
import { fetchTemplateForPreview } from "@/lib/marketing/fetch-template-for-preview";
import { hasPublishedInvitationDesign } from "@/lib/editor/contentJsonKind";
import type { WeddingCard } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ v?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { templateId } = await params;
  const template = await fetchTemplateForPreview(templateId);
  if (!template) return { title: "Xem trước mẫu thiệp" };
  return {
    title: `[Mẫu] ${template.name}`,
    description: template.description ?? "Xem trước mẫu thiệp cưới trên Royal Wedding.",
    robots: { index: true, follow: true },
    openGraph: template.thumbnail_url
      ? { images: [{ url: template.thumbnail_url }] }
      : undefined,
  };
}

export default async function TemplatePreviewPage({ params, searchParams }: Props) {
  noStore();

  const { templateId } = await params;
  const { v: renderVersion } = await searchParams;
  const template = await fetchTemplateForPreview(templateId);
  if (!template) notFound();

  if (!hasPublishedInvitationDesign(template.content_json)) {
    notFound();
  }

  const card = buildTemplatePreviewCard(template);

  return (
    <>
      <TemplatePreviewBanner templateName={template.name} />
      <InvitationRenderer
        card={card as WeddingCard}
        photos={[]}
        guest={null}
        renderVersion={renderVersion ?? template.updated_at ?? undefined}
      />
    </>
  );
}
