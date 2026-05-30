"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateWeddingCard, applyTemplateToCard } from "@/app/actions/wedding-card";
import { canOpenVisualEditor, getContentJsonKind } from "@/lib/editor/contentJsonKind";
import { createClient } from "@/lib/supabase/client";
import { compressImage, formatFileSize } from "@/lib/utils/compress-image";
import type { WeddingCard, CardStatus, TemplateRow } from "@/types";

type Props = {
  card: WeddingCard | null;
  allCards?: WeddingCard[];
  templates?: TemplateRow[];
};

type SectionKey = "cover" | "status" | "slug" | "content" | "design";

const STATUS_OPTIONS: { value: CardStatus; label: string; desc: string }[] = [
  { value: "draft", label: "Nháp", desc: "Chỉ bạn thấy, khách chưa truy cập được" },
  { value: "active", label: "Công khai", desc: "Thiệp hiển thị với tất cả mọi người" },
  { value: "expired", label: "Đã hết hạn", desc: "Tắt thiệp, khách không truy cập được" },
];

const SLUG_REGEX = /^[a-z0-9-]+$/;

function SectionCard({
  title,
  description,
  sectionKey,
  open,
  onToggle,
  children,
}: {
  title: string;
  description?: string;
  sectionKey: SectionKey;
  open: boolean;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left"
        onClick={() => onToggle(sectionKey)}
      >
        <div>
          <h2 className="text-base font-semibold text-neutral-800">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
          )}
        </div>
        <span
          className={`text-neutral-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-neutral-100 px-6 py-5">{children}</div>}
    </div>
  );
}

// ─── Template Picker Modal ────────────────────────────────────────────────────
function TemplatePicker({
  cardId,
  templates,
  onClose,
  onApplied,
}: {
  cardId: string;
  templates: TemplateRow[];
  onClose: () => void;
  onApplied: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = (templateId: string) => {
    setApplying(templateId);
    startTransition(async () => {
      const result = await applyTemplateToCard(cardId, templateId);
      if (result.error) {
        toast.error(result.error);
        setApplying(null);
      } else {
        toast.success("Đã áp dụng mẫu thiệp!");
        onApplied();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Chọn mẫu thiệp</h2>
            <p className="text-xs text-gray-500 mt-0.5">Chọn mẫu để bắt đầu chỉnh sửa</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {templates.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Chưa có mẫu thiệp nào được kích hoạt</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleApply(t.id)}
                  disabled={isPending}
                  className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-left disabled:opacity-60"
                >
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {t.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                        Xem trước
                      </div>
                    )}
                    {applying === t.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">{t.name}</p>
                    <span className="text-xs text-gray-400 uppercase">{t.plan_required}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CaiDatThiepClient({
  card: initialCard,
  allCards = [],
  templates = [],
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [card, setCard] = useState<WeddingCard | null>(initialCard);
  const [openSection, setOpenSection] = useState<SectionKey>("cover");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  const toggleSection = (key: SectionKey) => {
    setOpenSection((prev) => (prev === key ? ("" as SectionKey) : key));
  };

  // ── Cover image ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverMsg, setCoverMsg] = useState("");

  const uploadCover = async (file: File) => {
    if (!card) return;
    setCoverUploading(true);
    setCoverMsg("");
    
    try {
      // Nén ảnh bìa
      let processedFile = file;
      try {
        const originalSize = formatFileSize(file.size);
        processedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
        });
        const compressedSize = formatFileSize(processedFile.size);
        console.log(`Ảnh bìa nén: ${originalSize} → ${compressedSize}`);
      } catch (err) {
        console.warn("Không thể nén ảnh bìa, sử dụng ảnh gốc:", err);
      }

      const ext = processedFile.type === "image/webp" ? "webp" : (file.name.split(".").pop() ?? "jpg");
      const path = `covers/${card.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("wedding-photos")
        .upload(path, processedFile, { upsert: true });
      if (upErr) {
        setCoverMsg(`Lỗi upload: ${upErr.message}`);
        setCoverUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("wedding-photos")
        .getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { error: updateErr } = await updateWeddingCard(card.id, { cover_image_url: publicUrl });
      if (updateErr) {
        setCoverMsg(`Lỗi cập nhật: ${updateErr}`);
      } else {
        setCard((prev) => (prev ? { ...prev, cover_image_url: publicUrl } : prev));
        setCoverMsg("Đã cập nhật ảnh bìa!");
      }
    } finally {
      setCoverUploading(false);
    }
  };

  // ── Display status ───────────────────────────────────────────────────────
  const [statusValue, setStatusValue] = useState<CardStatus>(
    initialCard?.status ?? "draft"
  );
  const [showInShowcase, setShowInShowcase] = useState(
    initialCard?.show_in_showcase ?? false
  );
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const saveStatus = async () => {
    if (!card) return;
    setStatusSaving(true);
    setStatusMsg("");
    const patch: Record<string, unknown> = { status: statusValue };
    if (statusValue === "active") {
      patch.show_in_showcase = showInShowcase;
    } else {
      patch.show_in_showcase = false;
    }
    const { error } = await updateWeddingCard(card.id, patch);
    setStatusSaving(false);
    if (error) {
      setStatusMsg(`Lỗi: ${error}`);
    } else {
      setCard((prev) =>
        prev
          ? {
              ...prev,
              status: statusValue,
              show_in_showcase: statusValue === "active" ? showInShowcase : false,
            }
          : prev
      );
      if (statusValue !== "active") setShowInShowcase(false);
      setStatusMsg("Đã lưu chế độ hiển thị!");
    }
  };

  // ── Slug ─────────────────────────────────────────────────────────────────
  const [slugValue, setSlugValue] = useState(initialCard?.slug ?? "");
  const [slugError, setSlugError] = useState("");
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugMsg, setSlugMsg] = useState("");

  const saveSlug = async () => {
    if (!card) return;
    setSlugError("");
    setSlugMsg("");
    if (!slugValue.trim()) {
      setSlugError("Slug không được để trống");
      return;
    }
    if (!SLUG_REGEX.test(slugValue)) {
      setSlugError("Chỉ dùng chữ thường, số và dấu gạch ngang (-)");
      return;
    }
    setSlugSaving(true);
    const { error } = await updateWeddingCard(card.id, { slug: slugValue });
    setSlugSaving(false);
    if (error) {
      setSlugError(
        error.includes("unique") || error.includes("duplicate")
          ? "Slug này đã được dùng, vui lòng chọn slug khác"
          : error
      );
    } else {
      setCard((prev) => (prev ? { ...prev, slug: slugValue } : prev));
      setSlugMsg("Đã lưu slug!");
    }
  };

  const cardUrl =
    typeof window !== "undefined" && card
      ? `${window.location.origin}/thiep/${slugValue}`
      : card
      ? `/thiep/${slugValue}`
      : "";

  // ── Content toggles ──────────────────────────────────────────────────────
  const [showGiftBox, setShowGiftBox] = useState(initialCard?.show_gift_box ?? false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentMsg, setContentMsg] = useState("");

  const saveContent = async () => {
    if (!card) return;
    setContentSaving(true);
    setContentMsg("");
    const { error } = await updateWeddingCard(card.id, {
      show_gift_box: showGiftBox,
    });
    setContentSaving(false);
    if (error) {
      setContentMsg(`Lỗi: ${error}`);
    } else {
      setCard((prev) =>
        prev ? { ...prev, show_gift_box: showGiftBox } : prev
      );
      setContentMsg("Đã lưu nội dung hiển thị!");
    }
  };

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="text-5xl">💌</div>
        <h2 className="text-xl font-semibold text-neutral-700">Bạn chưa có thiệp cưới</h2>
        <p className="max-w-sm text-sm text-neutral-500">
          Tạo thiệp cưới để bắt đầu chia sẻ với khách mời của bạn
        </p>
        <Link
          href="/dashboard/thiet-lap"
          className="rounded-xl bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-rose-600"
        >
          Tạo thiệp ngay
        </Link>
      </div>
    );
  }

  const handleOpenEditor = () => {
    if (!card) return;
    if (canOpenVisualEditor(card.content_json)) {
      router.push(`/dashboard/editor/${card.id}`);
      return;
    }
    const qs =
      getContentJsonKind(card.content_json) === "raw-html"
        ? "?needTemplate=1&source=html"
        : "?needTemplate=1";
    router.push(`/dashboard/${card.id}/thiet-lap${qs}`);
  };

  return (
    <>
      {showTemplatePicker && card && (
        <TemplatePicker
          cardId={card.id}
          templates={templates}
          onClose={() => setShowTemplatePicker(false)}
          onApplied={() => {
            router.push(`/dashboard/editor/${card.id}`);
          }}
        />
      )}

      <div className="mx-auto max-w-2xl space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Cài đặt thiệp cưới</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Quản lý hiển thị và cấu hình thiệp cưới của bạn
          </p>
          {allCards.length > 1 && (
            <div className="mt-4">
              <label htmlFor="card-select" className="mb-1.5 block text-xs font-medium text-neutral-500">
                Chọn thiệp
              </label>
              <select
                id="card-select"
                value={card.id}
                onChange={(e) => router.push(`/dashboard/${e.target.value}/cai-dat-thiep`)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-800 shadow-sm focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
              >
                {allCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.groom_name} & {c.bride_name} — /thiep/{c.slug}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Visual Editor CTA ── */}
        {card && card.paid_at && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-indigo-800">
                🎨 Trình chỉnh sửa thiệp
              </h3>
              <p className="text-sm text-indigo-600 mt-0.5">
                {canOpenVisualEditor(card.content_json)
                  ? "Thiệp Craft — nhấn để tiếp tục chỉnh sửa kéo-thả."
                  : getContentJsonKind(card.content_json) === "raw-html"
                    ? "Thiệp mẫu HTML — chọn mẫu Craft để dùng trình chỉnh sửa trực quan."
                    : "Chọn mẫu thiệp và tùy chỉnh nội dung, hình ảnh, màu sắc theo ý muốn."}
              </p>
            </div>
            <button
              onClick={handleOpenEditor}
              className="shrink-0 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {canOpenVisualEditor(card.content_json)
                ? "Mở trình chỉnh sửa"
                : "Chọn mẫu Craft & chỉnh sửa"}
            </button>
          </div>
        )}

      {/* 1. Ảnh bìa */}
      <SectionCard
        title="Ảnh bìa"
        description="Ảnh chính hiển thị trên thiệp cưới"
        sectionKey="cover"
        open={openSection === "cover"}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {card.cover_image_url ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.cover_image_url}
                alt="Ảnh bìa thiệp"
                className="h-48 w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-36 items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-400">Chưa có ảnh bìa</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              {coverUploading ? "Đang tải lên..." : "Chọn ảnh mới"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadCover(f);
                }}
              />
            </label>
            {coverMsg && (
              <p
                className={`text-sm ${
                  coverMsg.startsWith("Lỗi") ? "text-red-500" : "text-green-600"
                }`}
              >
                {coverMsg}
              </p>
            )}
          </div>
          <p className="text-xs text-neutral-400">
            Định dạng: JPG, PNG, WebP. Kích thước tối đa 5MB.
          </p>
        </div>
      </SectionCard>

      {/* 2. Chế độ hiển thị */}
      <SectionCard
        title="Chế độ hiển thị"
        description="Kiểm soát ai có thể xem thiệp của bạn"
        sectionKey="status"
        open={openSection === "status"}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          {STATUS_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                statusValue === opt.value
                  ? "border-rose-400 bg-rose-50"
                  : "border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <input
                type="radio"
                name="card-status"
                value={opt.value}
                checked={statusValue === opt.value}
                onChange={() => setStatusValue(opt.value)}
                className="mt-0.5 accent-rose-500"
              />
              <div>
                <p className="text-sm font-semibold text-neutral-800">{opt.label}</p>
                <p className="text-xs text-neutral-500">{opt.desc}</p>
              </div>
            </label>
          ))}
          {statusValue === "active" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
              <input
                type="checkbox"
                checked={showInShowcase}
                onChange={(e) => setShowInShowcase(e.target.checked)}
                className="mt-0.5 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  Hiển thị trên trang Các cặp đôi
                </p>
                <p className="text-xs text-indigo-700/80">
                  Thiệp thật của bạn sẽ xuất hiện trong thư viện cộng đồng tại{" "}
                  <span className="font-medium">/cac-cap-doi</span>. Chỉ bật khi bạn muốn chia sẻ
                  công khai với mọi người.
                </p>
                {!card.paid_at && (
                  <p className="mt-1 text-xs text-amber-700">
                    Cần kích hoạt gói dịch vụ trước khi thiệp được hiển thị trên trang cộng đồng.
                  </p>
                )}
                {card.paid_at && !canOpenVisualEditor(card.content_json) && (
                  <p className="mt-1 text-xs text-amber-700">
                    Thiệp cần có nội dung Craft (chọn mẫu và chỉnh sửa) trước khi hiển thị trên trang
                    cộng đồng.
                  </p>
                )}
                {card.groom_name === "Chú rể" && card.bride_name === "Cô dâu" && (
                  <p className="mt-1 text-xs text-neutral-500">
                    Gợi ý: cập nhật tên thật trong{" "}
                    <Link href={`/dashboard/${card.id}/thiet-lap`} className="font-medium text-indigo-700 underline">
                      Thiết lập
                    </Link>{" "}
                    để thiệp hiển thị đẹp hơn trên trang cộng đồng.
                  </p>
                )}
              </div>
            </label>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={statusSaving}
              onClick={() => void saveStatus()}
              className="rounded-xl bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {statusSaving ? "Đang lưu..." : "Lưu"}
            </button>
            {statusMsg && (
              <p className={`text-sm ${statusMsg.startsWith("Lỗi") ? "text-red-500" : "text-green-600"}`}>
                {statusMsg}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 3. Slug tùy chỉnh */}
      <SectionCard
        title="Slug tùy chỉnh"
        description="Địa chỉ URL riêng của thiệp cưới"
        sectionKey="slug"
        open={openSection === "slug"}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-600">
              Slug
            </label>
            <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-neutral-200 focus-within:border-rose-400">
              <span className="border-r border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400">
                /thiep/
              </span>
              <input
                className="flex-1 px-3 py-2 text-sm outline-none"
                placeholder="ten-co-dau-chu-re"
                value={slugValue}
                onChange={(e) => {
                  setSlugValue(e.target.value.toLowerCase());
                  setSlugError("");
                  setSlugMsg("");
                }}
              />
            </div>
            {slugError && <p className="mt-1 text-xs text-red-500">{slugError}</p>}
          </div>
          {slugValue && (
            <div className="rounded-lg bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Xem trước URL:</p>
              <a
                href={cardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 break-all text-sm font-medium text-rose-500 hover:underline"
              >
                {cardUrl}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={slugSaving}
              onClick={() => void saveSlug()}
              className="rounded-xl bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {slugSaving ? "Đang lưu..." : "Lưu slug"}
            </button>
            {slugMsg && <p className="text-sm text-green-600">{slugMsg}</p>}
          </div>
          <p className="text-xs text-neutral-400">
            Chỉ dùng chữ thường (a–z), số (0–9) và dấu gạch ngang (-). Không dùng dấu tiếng Việt.
          </p>
        </div>
      </SectionCard>

      {/* 4. Nội dung hiển thị */}
      <SectionCard
        title="Nội dung hiển thị"
        description="Bật/tắt các thành phần trên thiệp"
        sectionKey="content"
        open={openSection === "content"}
        onToggle={toggleSection}
      >
        <div className="space-y-5">
          {/* Show gift box toggle */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-neutral-800">Hộp quà / Tài khoản nhận quà</p>
              <p className="text-xs text-neutral-500">Hiện thông tin tài khoản ngân hàng để khách gửi quà</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showGiftBox}
              onClick={() => setShowGiftBox((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showGiftBox ? "bg-rose-500" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  showGiftBox ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <p className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
            Nhạc nền và hiệu ứng confetti: chỉnh trong{" "}
            <Link href={card ? `/dashboard/${card.id}/thiet-lap` : "/dashboard"} className="font-medium text-rose-600 hover:underline">
              Thiết lập → tab Nhạc &amp; hiệu ứng
              </Link>
            .
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={contentSaving}
              onClick={() => void saveContent()}
              className="rounded-xl bg-rose-500 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {contentSaving ? "Đang lưu..." : "Lưu cài đặt"}
            </button>
            {contentMsg && (
              <p className={`text-sm ${contentMsg.startsWith("Lỗi") ? "text-red-500" : "text-green-600"}`}>
                {contentMsg}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* 5. Thiết lập giao diện */}
        <SectionCard
          title="Thiết lập giao diện"
          description="Chọn template, màu sắc và font chữ"
          sectionKey="design"
          open={openSection === "design"}
          onToggle={toggleSection}
        >
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-neutral-600">
              Tùy chỉnh giao diện thiệp cưới chi tiết trong trang Thiết lập.
            </p>
            <Link
              href={card ? `/dashboard/${card.id}/thiet-lap` : "/dashboard"}
              className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-rose-600"
            >
              Đến trang Thiết lập giao diện →
            </Link>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
