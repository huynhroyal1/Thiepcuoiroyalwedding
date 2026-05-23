"use client";

import type { CSSProperties } from "react";
import Image from "next/image";
import { ChevronDown, MapPin } from "lucide-react";
import type { Guest, WeddingCard, WeddingPhoto } from "@/types";
import { formatWeddingDateVi } from "@/lib/format-wedding";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { RsvpSection } from "@/components/invitation/RsvpSection";
import { WishesSection } from "@/components/invitation/WishesSection";

export type TemplateProps = {
  card: WeddingCard;
  photos: WeddingPhoto[];
  guest?: Guest | null;
  /** Cache-bust Craft preview after editor save (?v=). */
  renderVersion?: string | number | null;
};

const themes = {
  classic: {
    page: "bg-white text-neutral-900",
    heroSub: "text-neutral-500",
    names: "text-neutral-900",
    date: "text-neutral-600",
    countdownBg: "bg-rose-50/60",
    sectionMuted: "bg-neutral-50",
    card: "bg-white",
    footer: "text-neutral-500",
    accent: "text-mewedding-rose",
    giftBg: "bg-rose-50/50",
  },
  golden: {
    page: "bg-[#fdf8f0] text-[#3d2f24]",
    heroSub: "text-[#7a6654]",
    names: "text-[#2c2219]",
    date: "text-[#5c4d3d]",
    countdownBg: "bg-[#f3e6d6]",
    sectionMuted: "bg-[#faf3ea]",
    card: "border border-[#c8a97e]/40 bg-white/80 shadow-sm",
    footer: "text-[#7a6654]",
    accent: "text-[#a67c52]",
    giftBg: "bg-[#f3e6d6]",
  },
  minimal: {
    page: "bg-white text-neutral-900",
    heroSub: "text-neutral-400",
    names: "text-neutral-900",
    date: "text-neutral-500",
    countdownBg: "bg-neutral-50",
    sectionMuted: "bg-white",
    card: "border border-neutral-200 bg-white",
    footer: "text-neutral-400",
    accent: "text-[var(--accent)]",
    giftBg: "bg-neutral-50",
  },
} as const;

type ThemeKey = keyof typeof themes;

export function InvitationSections({ card, photos, guest, theme }: TemplateProps & { theme: ThemeKey }) {
  const t = themes[theme];
  const mapsEmbed = card.venue_maps_url?.includes("http")
    ? card.venue_maps_url
    : card.venue_address
      ? `https://www.google.com/maps?q=${encodeURIComponent(card.venue_address)}&output=embed`
      : null;

  const style: CSSProperties | undefined =
    theme === "minimal" ? { ["--accent" as string]: card.primary_color } : undefined;

  return (
    <div
      className={`relative min-h-screen w-full max-w-full overflow-x-clip font-sans ${t.page}`}
      style={style}
    >
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 pb-24 pt-16 text-center">
        <p className={`text-sm uppercase tracking-[0.2em] ${t.heroSub}`}>Trân trọng kính mời</p>
        {guest && (
          <p className={`mt-3 text-sm font-medium ${t.accent}`}>Kính mời {guest.name}</p>
        )}
        {guest?.is_vip && guest.avatar_url && (
          <div className="relative mt-4 h-20 w-20 overflow-hidden rounded-full ring-4 ring-amber-200">
            <Image src={guest.avatar_url} alt="" fill className="object-cover" />
          </div>
        )}
        <h1
          className={`mt-6 font-serif text-4xl font-semibold leading-tight sm:text-5xl ${t.names} ${
            theme === "golden" ? "tracking-wide" : ""
          }`}
        >
          {card.bride_name}
          <span className={`mx-2 ${t.accent}`}>&</span>
          {card.groom_name}
        </h1>
        <p className={`mt-6 font-serif text-lg ${t.date}`}>{formatWeddingDateVi(card.wedding_date)}</p>
        {card.cover_image_url && (
          <div className="relative mt-10 h-56 w-44 overflow-hidden rounded-2xl shadow-lg sm:h-64 sm:w-52">
            <Image src={card.cover_image_url} alt="" fill className="object-cover" sizes="200px" />
          </div>
        )}
        <button
          type="button"
          className={`absolute bottom-8 animate-bounce ${t.heroSub}`}
          aria-label="Scroll"
          onClick={() =>
            document.getElementById("countdown")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      <section id="countdown" className={`px-4 py-16 text-center ${t.countdownBg}`}>
        <h2 className="font-serif text-2xl">Chúng tôi sắp kết hôn!</h2>
        <div className="mt-6">
          <CountdownTimer
            targetDate={new Date(card.wedding_date)}
            showMarriedDays={card.plan === "vip"}
          />
        </div>
      </section>

      {card.love_story && (
        <section className="px-4 py-16">
          <h2 className="text-center font-serif text-2xl">Câu chuyện tình yêu</h2>
          <p className="mx-auto mt-6 max-w-md whitespace-pre-wrap text-center leading-relaxed text-neutral-700">
            {card.love_story}
          </p>
        </section>
      )}

      <section className={`px-4 py-16 ${t.sectionMuted}`}>
        <h2 className="text-center font-serif text-2xl">Thông tin lễ tiệc</h2>
        <div className="mx-auto mt-8 grid max-w-lg gap-4">
          {card.ceremony_time && (
            <div className={`rounded-2xl p-5 ${t.card}`}>
              <p className={`text-xs font-semibold uppercase ${t.accent}`}>Lễ thành hôn</p>
              <p className="mt-2 font-medium">{card.ceremony_time}</p>
              {card.venue_name && <p className="mt-1 text-sm opacity-80">{card.venue_name}</p>}
              {card.venue_address && (
                <p className="mt-1 flex items-start gap-2 text-sm opacity-80">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {card.venue_address}
                </p>
              )}
            </div>
          )}
          {card.reception_time && (
            <div className={`rounded-2xl p-5 ${t.card}`}>
              <p className={`text-xs font-semibold uppercase ${t.accent}`}>Tiệc cưới</p>
              <p className="mt-2 font-medium">{card.reception_time}</p>
            </div>
          )}
          {mapsEmbed && (
            <a
              href={
                card.venue_maps_url ??
                `https://maps.google.com/?q=${encodeURIComponent(card.venue_address ?? "")}`
              }
              target="_blank"
              rel="noreferrer"
              className={`block text-center text-sm font-medium underline ${t.accent}`}
            >
              Xem bản đồ
            </a>
          )}
        </div>
      </section>

      {photos.length > 0 && (
        <section className="px-2 py-16">
          <h2 className="mb-8 text-center font-serif text-2xl">Album ảnh</h2>
          <div className="columns-2 gap-2 sm:columns-3">
            {photos.map((p) => (
              <div key={p.id} className="mb-2 break-inside-avoid overflow-hidden rounded-lg">
                <Image src={p.url} alt="" width={400} height={500} className="h-auto w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      <RsvpSection cardId={card.id} defaultName={guest?.name} guestId={guest?.id} />
      <WishesSection cardId={card.id} />

      {card.show_gift_box && (card.gift_account_number || card.gift_qr_url) && (
        <section className={`px-4 py-16 text-center ${t.giftBg}`}>
          <h2 className="font-serif text-2xl">Hộp mừng cưới</h2>
          <div className={`mx-auto mt-6 max-w-sm rounded-2xl p-6 text-left text-sm ${t.card}`}>
            {card.gift_bank_name && <p>Ngân hàng: {card.gift_bank_name}</p>}
            {card.gift_account_number && (
              <p className="mt-2">
                Số TK: <strong>{card.gift_account_number}</strong>
              </p>
            )}
            {card.gift_account_name && <p className="mt-2">Chủ TK: {card.gift_account_name}</p>}
            {card.gift_qr_url && (
              <div className="relative mx-auto mt-4 h-44 w-44">
                <Image src={card.gift_qr_url} alt="QR" fill className="object-contain" />
              </div>
            )}
          </div>
        </section>
      )}

      <footer className={`px-4 py-10 text-center text-sm ${t.footer}`}>
        {card.hashtag && <p className={`font-medium ${t.accent}`}>{card.hashtag}</p>}
        {!card.remove_branding && <p className="mt-2">Thiệp được tạo bởi Royal Wedding</p>}
      </footer>
    </div>
  );
}
