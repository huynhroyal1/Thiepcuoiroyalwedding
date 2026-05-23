import type { Plan, TemplateRow, WeddingCard } from "@/types";

/** WeddingCard giả lập để render mẫu catalog trên /thiep/mau/[templateId]. */
export function buildTemplatePreviewCard(template: TemplateRow): WeddingCard {
  const plan = (template.plan_required ?? "basic") as Plan;
  const weddingDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `template-preview-${template.id}`,
    user_id: "",
    slug: `mau-${template.id}`,
    plan,
    status: "active",
    bride_name: "Cẩm Linh",
    bride_parents: "Ông Bà Nguyễn Văn A",
    groom_name: "Minh Quang",
    groom_parents: "Ông Bà Trần Văn B",
    wedding_date: weddingDate,
    ceremony_time: "09:00",
    reception_time: "18:00",
    venue_name: "Nhà hàng Tiệc cưới Hoàng Gia",
    venue_address: "123 Đường Hoa, Quận 1, TP. Hồ Chí Minh",
    venue_maps_url: "https://www.google.com/maps",
    love_story: "Chúng mình gặp nhau vào một ngày nắng đẹp…",
    hashtag: "#CamLinhMinhQuang",
    background_music_url: null,
    cover_image_url: template.thumbnail_url,
    template_id: template.id,
    primary_color: "#ea6c88",
    font_family: "'Playfair Display', serif",
    confetti_effect: "none",
    paid_at: new Date().toISOString(),
    payment_order_id: null,
    show_gift_box: true,
    gift_bank_name: "Vietcombank",
    gift_account_number: "0123456789",
    gift_account_name: "NGUYEN VAN A",
    gift_qr_url: null,
    remove_branding: plan === "vip",
    custom_domain: null,
    view_count: 0,
    show_in_showcase: false,
    content_json: template.content_json ?? null,
    created_at: template.created_at ?? new Date().toISOString(),
    updated_at: template.updated_at ?? template.created_at ?? new Date().toISOString(),
  };
}
