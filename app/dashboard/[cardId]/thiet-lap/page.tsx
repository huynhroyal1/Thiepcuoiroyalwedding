import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ThietLapForm } from "@/app/dashboard/thiet-lap/ThietLapForm";
import type { TemplateRow, WeddingCard } from "@/types";

export const metadata = { title: "Thiết lập thiệp" };

export default async function ThietLapPage({
  params,
  searchParams,
}: {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{ template?: string; needTemplate?: string; source?: string }>;
}) {
  const { cardId } = await params;
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: card }, { data: photos }, { data: templates }] = await Promise.all([
    supabase.from("wedding_cards").select("*").eq("id", cardId).maybeSingle(),
    supabase
      .from("wedding_photos")
      .select("*")
      .eq("card_id", cardId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("templates")
      .select("id, name, thumbnail_url, plan_required, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (!card) notFound();

  return (
    <ThietLapForm
      card={card as WeddingCard}
      photos={photos ?? []}
      templates={(templates ?? []) as TemplateRow[]}
      initialTemplateFromQuery={sp.template}
    />
  );
}
