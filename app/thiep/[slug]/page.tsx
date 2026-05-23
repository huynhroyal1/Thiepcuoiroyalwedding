import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { format } from "date-fns";
import { InvitationRenderer } from "@/components/invitation/InvitationRenderer";
import { InvitationPreviewBanner } from "@/components/invitation/InvitationPreviewBanner";
import { TrackView } from "@/components/invitation/TrackView";
import {
  fetchInvitationCard,
  fetchInvitationPhotos,
} from "@/lib/invitation/fetchInvitationCard";
import type { WeddingCard } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { slug: string };
  searchParams: { v?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await fetchInvitationCard(params.slug);
  if (!result) {
    return { title: "Thiệp cưới" };
  }
  const card = result.card;
  const dateStr = format(new Date(card.wedding_date), "dd/MM/yyyy");
  const og = card.cover_image_url ? { images: [{ url: card.cover_image_url }] } : undefined;
  const title = result.isOwnerPreview
    ? `[Xem trước] ${card.bride_name} & ${card.groom_name}`
    : `Thiệp cưới ${card.bride_name} & ${card.groom_name}`;
  return {
    title,
    description: `Trân trọng kính mời bạn đến dự lễ thành hôn của ${card.bride_name} & ${card.groom_name} vào ngày ${dateStr}`,
    robots: result.isOwnerPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: `Ngày ${dateStr}`,
      ...og,
    },
  };
}

export default async function PublicInvitationPage({ params, searchParams }: Props) {
  noStore();

  const result = await fetchInvitationCard(params.slug);
  if (!result) {
    notFound();
  }

  const { card, isOwnerPreview } = result;
  const photos = await fetchInvitationPhotos(card.id);
  const renderVersion = searchParams.v ?? card.updated_at;

  return (
    <>
      {isOwnerPreview && <InvitationPreviewBanner />}
      {!isOwnerPreview && <TrackView slug={params.slug} />}
      <InvitationRenderer
        card={card as WeddingCard}
        photos={photos}
        guest={null}
        renderVersion={renderVersion}
      />
    </>
  );
}
