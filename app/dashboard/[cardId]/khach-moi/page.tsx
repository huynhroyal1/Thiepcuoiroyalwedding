import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import KhachMoiClient from "@/app/dashboard/khach-moi/KhachMoiClient";
import type { GuestExtended, RsvpRow } from "@/types";

export const metadata = { title: "Quản lý khách mời" };

export default async function KhachMoiPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("wedding_cards")
    .select("id, plan, slug")
    .eq("id", cardId)
    .maybeSingle();

  if (!card) notFound();

  const [{ data: guests }, { data: groups }, { data: rsvpRows }] = await Promise.all([
    supabase.from("guests").select("*").eq("card_id", cardId).order("created_at"),
    supabase.from("guest_groups").select("*").eq("card_id", cardId).order("created_at"),
    supabase.from("rsvp").select("*").eq("card_id", cardId).order("created_at", { ascending: false }),
  ]);

  const guestsById = new Map<string, GuestExtended>();
  (guests ?? []).forEach((guest) => {
    guestsById.set(guest.id, guest as GuestExtended);
  });

  const syntheticGuests: GuestExtended[] = [];
  (rsvpRows ?? []).forEach((row) => {
    const rsvp = row as RsvpRow;

    if (rsvp.guest_id && guestsById.has(rsvp.guest_id)) {
      const existing = guestsById.get(rsvp.guest_id)!;
      guestsById.set(rsvp.guest_id, {
        ...existing,
        attending: rsvp.attending,
        num_guests: rsvp.guest_count,
        name: rsvp.guest_name || existing.name,
      });
      return;
    }

    const normalizedName = rsvp.guest_name.trim().toLocaleLowerCase();
    const matchedGuest = Array.from(guestsById.values()).find(
      (guest) => guest.name.trim().toLocaleLowerCase() === normalizedName
    );

    if (matchedGuest) {
      guestsById.set(matchedGuest.id, {
        ...matchedGuest,
        attending: rsvp.attending,
        num_guests: rsvp.guest_count,
        name: rsvp.guest_name || matchedGuest.name,
      });
      return;
    }

    syntheticGuests.push({
      id: `rsvp-${rsvp.id}`,
      card_id: rsvp.card_id,
      name: rsvp.guest_name,
      phone: null,
      email: null,
      group_label: "RSVP từ thiệp",
      token: "",
      avatar_url: null,
      is_vip: false,
      created_at: rsvp.created_at,
      group_id: null,
      gift_type: null,
      gift_amount: null,
      invite_sent: true,
      attending: rsvp.attending,
      num_guests: rsvp.guest_count,
    });
  });

  const mergedGuests = [...guestsById.values(), ...syntheticGuests].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <KhachMoiClient
      card={card}
      initialGuests={mergedGuests}
      initialGroups={groups ?? []}
    />
  );
}
