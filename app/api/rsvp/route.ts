import { NextResponse } from "next/server";
import { createPublicSupabase } from "@/lib/supabase/public";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { rsvpSchema } from "@/lib/validations/api";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = rsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const supabase = createPublicSupabase();
  const { data: card, error: cardErr } = await supabase
    .from("wedding_cards")
    .select("id, status")
    .eq("id", parsed.data.cardId)
    .maybeSingle();

  if (cardErr || !card || card.status !== "active") {
    return NextResponse.json({ error: "Thiệp không khả dụng" }, { status: 400 });
  }

  if (parsed.data.guestId) {
    const { data: guest, error: gErr } = await supabase
      .from("guests")
      .select("id, card_id")
      .eq("id", parsed.data.guestId)
      .maybeSingle();
    if (gErr || !guest || guest.card_id !== parsed.data.cardId) {
      return NextResponse.json({ error: "Khách mời không hợp lệ" }, { status: 400 });
    }
  }

  const guestCount = parsed.data.guestCount ?? 1;
  const normalizedGuestName = parsed.data.guestName.trim();

  const { error } = await supabase.from("rsvp").insert({
    card_id: parsed.data.cardId,
    guest_id: parsed.data.guestId ?? null,
    guest_name: normalizedGuestName,
    attending: parsed.data.attending,
    guest_count: guestCount,
    note: parsed.data.note ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    const admin = createServiceRoleClient();

    if (parsed.data.guestId) {
      const { error: guestUpdateError } = await admin
        .from("guests")
        .update({
          attending: parsed.data.attending,
          num_guests: guestCount,
          name: normalizedGuestName,
        })
        .eq("id", parsed.data.guestId)
        .eq("card_id", parsed.data.cardId);

      if (guestUpdateError) {
        console.error("Failed to sync guest RSVP:", guestUpdateError.message);
      }
    } else {
      const { data: matchedGuests, error: matchError } = await admin
        .from("guests")
        .select("id, name")
        .eq("card_id", parsed.data.cardId)
        .ilike("name", normalizedGuestName);

      if (matchError) {
        console.error("Failed to match guest by name:", matchError.message);
      } else if (matchedGuests && matchedGuests.length === 1) {
        const matchedGuest = matchedGuests[0];
        const { error: guestUpdateError } = await admin
          .from("guests")
          .update({
            attending: parsed.data.attending,
            num_guests: guestCount,
            name: normalizedGuestName,
          })
          .eq("id", matchedGuest.id)
          .eq("card_id", parsed.data.cardId);

        if (guestUpdateError) {
          console.error("Failed to sync matched guest RSVP:", guestUpdateError.message);
        }
      } else if ((matchedGuests?.length ?? 0) > 1) {
        console.warn("Multiple guests matched RSVP name; skipping guest sync", {
          cardId: parsed.data.cardId,
          guestName: normalizedGuestName,
          matches: matchedGuests?.map((guest) => guest.id),
        });
      }
    }
  } catch (syncError) {
    console.error("Guest RSVP sync error:", syncError);
  }

  return NextResponse.json({ success: true, message: "Đã xác nhận tham dự" });
}
