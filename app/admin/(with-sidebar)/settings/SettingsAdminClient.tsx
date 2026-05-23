"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { ContactSettings, FaqItem, SeoSettings, SocialSettings } from "@/types";
import type { PlanConfigMap } from "@/lib/plans/plan-config-shared";
import { PlanConfigEditor } from "./PlanConfigEditor";

export type AffiliateSettings = {
  commission_rate_percent: number;
  min_withdrawal_vnd: number;
};

type Props = {
  contact: ContactSettings;
  social: SocialSettings;
  seo: SeoSettings;
  faq: FaqItem[];
  planConfig: PlanConfigMap;
  affiliateSettings: AffiliateSettings;
};

export default function SettingsAdminClient({
  contact: initContact,
  social: initSocial,
  seo: initSeo,
  faq: initFaq,
  planConfig: initPlanConfig,
  affiliateSettings: initAffiliate,
}: Props) {
  const [tab, setTab] = useState<"contact" | "social" | "seo" | "faq" | "plans" | "affiliate">("contact");
  const [contact, setContact] = useState(initContact);
  const [social, setSocial] = useState(initSocial);
  const [seo, setSeo] = useState(initSeo);
  const [faq, setFaq] = useState(initFaq);
  const [planConfig, setPlanConfig] = useState(initPlanConfig);
  const [affiliateSettings, setAffiliateSettings] = useState(initAffiliate);
  const [saving, setSaving] = useState(false);

  const save = async (key: string, value: unknown) => {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Lỗi lưu");
    else toast.success("Đã lưu cài đặt");
    setSaving(false);
  };

  const TABS = [
    { key: "contact", label: "Liên hệ" },
    { key: "social", label: "Mạng xã hội" },
    { key: "plans", label: "Gói & quyền" },
    { key: "affiliate", label: "Affiliate" },
    { key: "seo", label: "SEO" },
    { key: "faq", label: "FAQ" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt Website</h1>
        <p className="text-sm text-neutral-500">Thay đổi ở đây sẽ cập nhật trang Liên hệ và footer ngay lập tức.</p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pb-2 px-4 text-sm font-medium ${tab === t.key ? "border-b-2 border-rose-500 text-rose-600" : "text-neutral-500 hover:text-neutral-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "contact" && (
        <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          {(["email", "phone", "address", "working_hours"] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-1 block text-sm font-medium capitalize text-neutral-700">{field === "working_hours" ? "Giờ làm việc" : field === "address" ? "Địa chỉ" : field === "phone" ? "Hotline" : "Email"}</span>
              {field === "address" ? (
                <textarea className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" rows={2} value={contact[field]} onChange={(e) => setContact({ ...contact, [field]: e.target.value })} />
              ) : (
                <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" value={contact[field]} onChange={(e) => setContact({ ...contact, [field]: e.target.value })} />
              )}
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Tax URL (link tra cứu MST)</span>
            <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" value={contact.tax_url} onChange={(e) => setContact({ ...contact, tax_url: e.target.value })} placeholder="https://masothue.com/..." />
          </label>
          <button onClick={() => save("contact", contact)} disabled={saving} className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {tab === "social" && (
        <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          {(["facebook", "tiktok", "youtube", "zalo", "instagram"] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-1 block text-sm font-medium capitalize text-neutral-700">{field}</span>
              <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" value={social[field]} onChange={(e) => setSocial({ ...social, [field]: e.target.value })} placeholder={`https://${field}.com/...`} />
            </label>
          ))}
          <button onClick={() => save("social", social)} disabled={saving} className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {tab === "plans" && (
        <div className="max-w-4xl space-y-4">
          <PlanConfigEditor planConfig={planConfig} onChange={setPlanConfig} />
          <button
            type="button"
            onClick={() => void save("plan_config", planConfig)}
            disabled={saving}
            className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình gói"}
          </button>
        </div>
      )}

      {tab === "affiliate" && (
        <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <p className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800">
            Tỷ lệ hoa hồng lưu tại đây. Hiện <strong>chưa có job tự tạo commission</strong> khi đơn PayOS thành công.
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Tỷ lệ hoa hồng (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={affiliateSettings.commission_rate_percent}
              onChange={(e) =>
                setAffiliateSettings((a) => ({
                  ...a,
                  commission_rate_percent: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Rút tối thiểu (VND)</span>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={affiliateSettings.min_withdrawal_vnd}
              onChange={(e) =>
                setAffiliateSettings((a) => ({
                  ...a,
                  min_withdrawal_vnd: Number(e.target.value),
                }))
              }
            />
          </label>
          <button
            type="button"
            onClick={() => void save("affiliate_settings", affiliateSettings)}
            disabled={saving}
            className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu affiliate"}
          </button>
        </div>
      )}

      {tab === "seo" && (
        <div className="max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Title</span>
            <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">Meta Description</span>
            <textarea className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" rows={3} value={seo.description} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-neutral-700">OG Image URL</span>
            <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" value={seo.og_image} onChange={(e) => setSeo({ ...seo, og_image: e.target.value })} placeholder="https://..." />
          </label>
          <button onClick={() => save("seo", seo)} disabled={saving} className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      )}

      {tab === "faq" && (
        <div className="max-w-2xl space-y-4">
          {faq.map((item, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-neutral-500">Câu hỏi</span>
                    <input className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" value={item.q} onChange={(e) => setFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, q: e.target.value } : f))} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-neutral-500">Trả lời</span>
                    <textarea className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-rose-300" rows={2} value={item.a} onChange={(e) => setFaq((prev) => prev.map((f, idx) => idx === i ? { ...f, a: e.target.value } : f))} />
                  </label>
                </div>
                <button onClick={() => setFaq((prev) => prev.filter((_, idx) => idx !== i))} className="mt-1 rounded-lg p-1.5 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setFaq((prev) => [...prev, { q: "", a: "" }])} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 px-4 py-2.5 text-sm text-neutral-600 hover:border-rose-300 hover:text-rose-600">
            <Plus className="h-4 w-4" />
            Thêm câu hỏi
          </button>
          <div>
            <button onClick={() => save("faq", faq)} disabled={saving} className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
