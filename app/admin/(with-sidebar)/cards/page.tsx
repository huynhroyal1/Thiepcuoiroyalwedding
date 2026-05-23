import { createServiceRoleClient } from "@/lib/supabase/admin";
import CardsAdminClient from "./CardsAdminClient";

export const metadata = { title: "Admin — Wedding Cards" };

export default async function AdminCardsPage() {
  const supabase = createServiceRoleClient();

  const { data: cards } = await supabase
    .from("wedding_cards")
    .select("*, profiles:profiles(full_name)")
    .order("created_at", { ascending: false });

  return <CardsAdminClient cards={cards ?? []} />;
}
