import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getPlanConfig } from "@/lib/plans/plan-config";
import SettingsAdminClient, { type AffiliateSettings } from "./SettingsAdminClient";
import type { ContactSettings, FaqItem, SeoSettings, SocialSettings } from "@/types";

export const metadata = { title: "Admin — Settings" };

const DEFAULT_CONTACT: ContactSettings = {
  email: "hello@royalwedding.vn",
  phone: "0282 2222 886",
  address: "Tầng 5, 77 Nguyễn Huệ, Q.1, TP.HCM",
  tax_url: "",
  working_hours: "8:00 - 22:00, Thứ 2 - Chủ Nhật",
};
const DEFAULT_SOCIAL: SocialSettings = {
  facebook: "https://facebook.com/royalwedding",
  tiktok: "https://tiktok.com/@royalwedding",
  youtube: "https://youtube.com/@royalwedding",
  zalo: "https://zalo.me/royalwedding",
  instagram: "",
};
const DEFAULT_SEO: SeoSettings = {
  title: "Royal Wedding — Thiệp cưới online",
  description: "Tạo thiệp cưới online — Royal Wedding",
  og_image: "",
};
const DEFAULT_FAQ: FaqItem[] = [];

export default async function AdminSettingsPage() {
  const supabase = createServiceRoleClient();
  const { data: settings } = await supabase.from("website_settings").select("key, value");

  const get = <T,>(key: string, def: T): T => {
    const row = settings?.find((s) => s.key === key);
    return row ? ({ ...def, ...(row.value as Partial<T>) }) : def;
  };

  const planConfig = await getPlanConfig(true);
  const affiliateRaw = settings?.find((s) => s.key === "affiliate_settings")?.value as
    | Partial<AffiliateSettings>
    | undefined;
  const affiliateSettings: AffiliateSettings = {
    commission_rate_percent: Number(affiliateRaw?.commission_rate_percent) || 10,
    min_withdrawal_vnd: Number(affiliateRaw?.min_withdrawal_vnd) || 100_000,
  };

  return (
    <SettingsAdminClient
      contact={get("contact", DEFAULT_CONTACT)}
      social={get("social", DEFAULT_SOCIAL)}
      seo={get("seo", DEFAULT_SEO)}
      faq={Array.isArray(settings?.find((s) => s.key === "faq")?.value) ? (settings!.find((s) => s.key === "faq")!.value as FaqItem[]) : DEFAULT_FAQ}
      planConfig={planConfig}
      affiliateSettings={affiliateSettings}
    />
  );
}
