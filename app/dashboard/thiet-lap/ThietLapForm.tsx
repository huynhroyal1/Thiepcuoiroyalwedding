"use client";

import { useCallback, useState, useTransition } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Switch from "@radix-ui/react-switch";
import { toast } from "sonner";
import type { WeddingCard, WeddingPhoto, TemplateRow, Plan } from "@/types";
import { updateWeddingCard, checkSlugAvailable, addWeddingPhoto, deleteWeddingPhoto, applyTemplateToCard } from "@/app/actions/wedding-card";
import { mapsUrlToEmbed } from "@/lib/utils";
import { PhotoUpload } from "@/components/ui/PhotoUpload";
import { MusicPresetPicker } from "@/components/dashboard/MusicPresetPicker";
import type { ConfettiEffect } from "@/types";
import { useRouter } from "next/navigation";
import { planMeetsRequirement } from "@/lib/plans/plan-access";
import { hasCardEditorContent } from "@/lib/editor/hasCardEditorContent";
import { getContentJsonKind } from "@/lib/editor/contentJsonKind";
import { toDatetimeLocalValue } from "@/lib/editor/cardFieldBinding";

const PLAN_LABEL: Record<string, string> = {
  basic: "BASIC",
  pro: "PRO",
  vip: "VIP",
};

const PLAN_COLOR: Record<string, string> = {
  basic: "bg-gray-100 text-gray-600",
  pro: "bg-blue-100 text-blue-700",
  vip: "bg-amber-100 text-amber-700",
};

const CONFETTI_OPTIONS: { value: ConfettiEffect; label: string }[] = [
  { value: "none", label: "Không hiệu ứng" },
  { value: "hearts", label: "Trái tim" },
  { value: "snow", label: "Tuyết rơi" },
  { value: "petals", label: "Cánh hoa" },
];

type Props = {
  card: WeddingCard;
  photos: WeddingPhoto[];
  templates?: TemplateRow[];
  initialTemplateFromQuery?: string;
};

export function ThietLapForm({
  card,
  photos: initialPhotos,
  templates = [],
  initialTemplateFromQuery,
}: Props) {
  const router = useRouter();

  const [pending, start] = useTransition();
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);
  const [photos, setPhotos] = useState(initialPhotos);
  const [form, setForm] = useState(() => ({
    bride_name: card.bride_name,
    bride_parents: card.bride_parents ?? "",
    groom_name: card.groom_name,
    groom_parents: card.groom_parents ?? "",
    wedding_date: toDatetimeLocalValue(card.wedding_date),
    ceremony_time: card.ceremony_time ?? "",
    reception_time: card.reception_time ?? "",
    venue_name: card.venue_name ?? "",
    venue_address: card.venue_address ?? "",
    venue_maps_url: card.venue_maps_url ?? "",
    hashtag: card.hashtag ?? "",
    love_story: card.love_story ?? "",
    cover_image_url: card.cover_image_url ?? "",
    background_music_url: card.background_music_url ?? "",
    confetti_effect: card.confetti_effect,
    show_gift_box: card.show_gift_box,
    gift_bank_name: card.gift_bank_name ?? "",
    gift_account_number: card.gift_account_number ?? "",
    gift_account_name: card.gift_account_name ?? "",
    gift_qr_url: card.gift_qr_url ?? "",
    slug: card.slug,
    status: card.status,
    template_id: initialTemplateFromQuery ?? card.template_id,
  }));

  const [slugOk, setSlugOk] = useState<boolean | null>(null);

  const save = (patch: Record<string, unknown>) => {
    start(async () => {
      const { error } = await updateWeddingCard(card.id, patch);
      if (error) toast.error(error);
      else {
        toast.success("Đã lưu");
        router.refresh();
      }
    });
  };

  const onSaveBasic = () => {
    const maps = form.venue_maps_url.trim() ? mapsUrlToEmbed(form.venue_maps_url) : null;
    save({
      bride_name: form.bride_name,
      bride_parents: form.bride_parents || null,
      groom_name: form.groom_name,
      groom_parents: form.groom_parents || null,
      wedding_date: new Date(form.wedding_date).toISOString(),
      ceremony_time: form.ceremony_time || null,
      reception_time: form.reception_time || null,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      venue_maps_url: maps,
      hashtag: form.hashtag || null,
    });
  };

  const onSaveStory = () => {
    save({
      love_story: form.love_story || null,
      cover_image_url: form.cover_image_url || null,
    });
  };

  const onSaveMusic = () => {
    save({
      background_music_url: form.background_music_url || null,
      confetti_effect: form.confetti_effect,
    });
  };

  const onSaveGift = () => {
    save({
      show_gift_box: form.show_gift_box,
      gift_bank_name: form.gift_bank_name || null,
      gift_account_number: form.gift_account_number || null,
      gift_account_name: form.gift_account_name || null,
      gift_qr_url: form.gift_qr_url || null,
    });
  };

  const onSaveUrl = async () => {
    const { available, error } = await checkSlugAvailable(form.slug, card.id);
    if (error) {
      toast.error(error);
      return;
    }
    if (!available) {
      toast.error("Slug đã được sử dụng");
      return;
    }
    save({
      slug: form.slug,
      status: form.status,
      template_id: form.template_id,
    });
  };

  const checkSlug = useCallback(async (slug: string) => {
    const { available } = await checkSlugAvailable(slug, card.id);
    setSlugOk(available);
  }, [card.id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Thiết lập thiệp</h1>
        <p className="text-sm text-neutral-600">Lưu từng tab sau khi chỉnh sửa.</p>
      </div>

      {!hasCardEditorContent(card.content_json) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {getContentJsonKind(card.content_json) === "raw-html" ? (
            <>
              Thiệp đang dùng <strong>mẫu HTML</strong> (xem thiệp bình thường). Để chỉnh sửa kéo-thả, chọn
              mẫu <strong>Craft</strong> bên dưới — nội dung HTML hiện tại sẽ được thay bằng mẫu mới.
            </>
          ) : (
            <>
              Bước đầu tiên: chọn một mẫu thiệp bên dưới. Sau khi áp dụng mẫu, bạn mới có thể mở trình chỉnh
              sửa.
            </>
          )}
        </div>
      )}

      <Tabs.Root defaultValue="template" className="w-full">
        <Tabs.List className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
          {[
            ["template", "🎨 Chọn mẫu"],
            ["basic", "Thông tin"],
            ["story", "Câu chuyện"],
            ["album", "Album"],
            ["music", "Nhạc & hiệu ứng"],
            ["gift", "Mừng cưới"],
            ["url", "URL"],
          ].map(([v, l]) => (
            <Tabs.Trigger
              key={v}
              value={v}
              className="rounded-full px-3 py-1.5 text-sm data-[state=active]:bg-rose-50 data-[state=active]:text-mewedding-rose"
            >
              {l}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ── Chọn mẫu thiệp ── */}
        <Tabs.Content value="template" className="mt-4">
          <TemplatePicker
            card={card}
            templates={templates}
            applying={applyingTemplate}
            onApply={(templateId) => {
              setApplyingTemplate(templateId);
              start(async () => {
                const result = await applyTemplateToCard(card.id, templateId);
                setApplyingTemplate(null);
                if (result.error) {
                  toast.error(result.error);
                } else {
                  toast.success("Đã chọn mẫu! Đang mở trình chỉnh sửa...");
                  router.push(`/dashboard/editor/${card.id}`);
                }
              });
            }}
          />
        </Tabs.Content>

        <Tabs.Content value="basic" className="mt-4 space-y-3 rounded-xl border border-neutral-100 bg-white p-4">
          <Field label="Tên cô dâu" value={form.bride_name} onChange={(v) => setForm((f) => ({ ...f, bride_name: v }))} />
          <Field
            label="Cha mẹ cô dâu"
            value={form.bride_parents}
            onChange={(v) => setForm((f) => ({ ...f, bride_parents: v }))}
          />
          <Field label="Tên chú rể" value={form.groom_name} onChange={(v) => setForm((f) => ({ ...f, groom_name: v }))} />
          <Field
            label="Cha mẹ chú rể"
            value={form.groom_parents}
            onChange={(v) => setForm((f) => ({ ...f, groom_parents: v }))}
          />
          <div>
            <label className="text-sm font-medium">Ngày giờ cưới</label>
            <input
              type="datetime-local"
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.wedding_date}
              onChange={(e) => setForm((f) => ({ ...f, wedding_date: e.target.value }))}
            />
          </div>
          <Field
            label="Giờ lễ"
            value={form.ceremony_time}
            onChange={(v) => setForm((f) => ({ ...f, ceremony_time: v }))}
          />
          <Field
            label="Giờ tiệc"
            value={form.reception_time}
            onChange={(v) => setForm((f) => ({ ...f, reception_time: v }))}
          />
          <Field label="Tên địa điểm" value={form.venue_name} onChange={(v) => setForm((f) => ({ ...f, venue_name: v }))} />
          <Field
            label="Địa chỉ"
            value={form.venue_address}
            onChange={(v) => setForm((f) => ({ ...f, venue_address: v }))}
          />
          <Field
            label="Google Maps (URL)"
            value={form.venue_maps_url}
            onChange={(v) => setForm((f) => ({ ...f, venue_maps_url: v }))}
          />
          <Field label="Hashtag" value={form.hashtag} onChange={(v) => setForm((f) => ({ ...f, hashtag: v }))} />
          <button
            type="button"
            disabled={pending}
            onClick={onSaveBasic}
            className="rounded-lg bg-mewedding-rose px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Lưu thay đổi
          </button>
        </Tabs.Content>

        <Tabs.Content value="story" className="mt-4 space-y-3 rounded-xl border border-neutral-100 bg-white p-4">
          <div>
            <label className="text-sm font-medium">Câu chuyện tình yêu</label>
            <textarea
              rows={8}
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.love_story}
              onChange={(e) => setForm((f) => ({ ...f, love_story: e.target.value }))}
            />
          </div>
          <p className="text-sm font-medium">Ảnh đại diện</p>
          <PhotoUpload
            cardId={card.id}
            plan={card.plan}
            currentCount={form.cover_image_url ? 1 : 0}
            maxTotal={1}
            bucket="wedding-photos"
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            maxFiles={1}
            label="Tải ảnh đại diện cặp đôi"
            onUploaded={(url) => {
              setForm((f) => ({ ...f, cover_image_url: url }));
              void (async () => {
                const { error } = await updateWeddingCard(card.id, { cover_image_url: url });
                if (error) toast.error(error);
                else toast.success("Đã cập nhật ảnh đại diện");
              })();
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onSaveStory}
            className="rounded-lg bg-mewedding-rose px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Lưu thay đổi
          </button>
        </Tabs.Content>

        <Tabs.Content value="album" className="mt-4 space-y-4 rounded-xl border border-neutral-100 bg-white p-4">
          <PhotoUpload
            cardId={card.id}
            plan={card.plan}
            currentCount={photos.length}
            bucket="wedding-photos"
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            onUploaded={async (url) => {
              const { error } = await addWeddingPhoto(card.id, url);
              if (error) toast.error(error);
              else {
                toast.success("Đã thêm ảnh");
                router.refresh();
              }
            }}
          />
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/50 px-1 text-xs text-white"
                  onClick={async () => {
                    const { error } = await deleteWeddingPhoto(p.id);
                    if (error) toast.error(error);
                    else {
                      setPhotos((prev) => prev.filter((x) => x.id !== p.id));
                      toast.success("Đã xóa");
                    }
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Tabs.Content>

        <Tabs.Content value="music" className="mt-4 space-y-5 rounded-xl border border-neutral-100 bg-white p-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Nhạc tự phát khi mở thiệp (đĩa nhạc góc phải — nhấn để tắt/bật). Trang tự cuộn chậm;
            từng phần tử có hiệu ứng xuất hiện khi lướt tới. Confetti hiển thị toàn trang.
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-neutral-800">Nhạc nền</h3>
            <MusicPresetPicker
              selectedUrl={form.background_music_url || null}
              disabled={pending}
              onSelect={(url) => {
                setForm((f) => ({ ...f, background_music_url: url }));
                start(async () => {
                  const { error } = await updateWeddingCard(card.id, {
                    background_music_url: url,
                  });
                  if (error) toast.error(error);
                  else toast.success("Đã chọn nhạc mẫu");
                });
              }}
              onClear={() => {
                setForm((f) => ({ ...f, background_music_url: "" }));
                start(async () => {
                  const { error } = await updateWeddingCard(card.id, {
                    background_music_url: null,
                  });
                  if (error) toast.error(error);
                  else toast.success("Đã xóa nhạc nền");
                });
              }}
            />
            <p className="text-xs text-neutral-500">Hoặc tải file MP3 của bạn (tối đa 1 file):</p>
            <PhotoUpload
              cardId={card.id}
              plan={card.plan}
              currentCount={form.background_music_url ? 1 : 0}
              maxTotal={1}
              bucket="wedding-music"
              accept={{ "audio/mpeg": [".mp3"] }}
              maxFiles={1}
              label="Upload nhạc MP3"
              onUploaded={async (url) => {
                setForm((f) => ({ ...f, background_music_url: url }));
                const { error } = await updateWeddingCard(card.id, { background_music_url: url });
                if (error) toast.error(error);
                else toast.success("Đã lưu nhạc nền");
              }}
            />
          </section>

          <section className="space-y-3 border-t border-neutral-100 pt-4">
            <h3 className="text-sm font-semibold text-neutral-800">Hiệu ứng confetti</h3>
            <p className="text-xs text-neutral-500">
              Gói Pro trở lên mới bật được hiệu ứng (không phải &quot;Không hiệu ứng&quot;).
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CONFETTI_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, confetti_effect: opt.value }))
                  }
                  className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                    form.confetti_effect === opt.value
                      ? "border-rose-400 bg-rose-50 font-semibold text-rose-600"
                      : "border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <button
            type="button"
            disabled={pending}
            onClick={onSaveMusic}
            className="rounded-lg bg-mewedding-rose px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Lưu thay đổi
          </button>
        </Tabs.Content>

        <Tabs.Content value="gift" className="mt-4 space-y-3 rounded-xl border border-neutral-100 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bật hộp mừng cưới</span>
            <Switch.Root
              checked={form.show_gift_box}
              onCheckedChange={(v) => setForm((f) => ({ ...f, show_gift_box: v }))}
              className="h-6 w-11 rounded-full bg-neutral-200 data-[state=checked]:bg-mewedding-rose"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-5" />
            </Switch.Root>
          </div>
          <Field label="Ngân hàng" value={form.gift_bank_name} onChange={(v) => setForm((f) => ({ ...f, gift_bank_name: v }))} />
          <Field
            label="Số tài khoản"
            value={form.gift_account_number}
            onChange={(v) => setForm((f) => ({ ...f, gift_account_number: v }))}
          />
          <Field
            label="Tên chủ TK"
            value={form.gift_account_name}
            onChange={(v) => setForm((f) => ({ ...f, gift_account_name: v }))}
          />
          <PhotoUpload
            cardId={card.id}
            plan={card.plan}
            currentCount={form.gift_qr_url ? 1 : 0}
            maxTotal={1}
            bucket="wedding-photos"
            accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
            maxFiles={1}
            label="Upload ảnh QR"
            onUploaded={async (url) => {
              setForm((f) => ({ ...f, gift_qr_url: url }));
              const { error } = await updateWeddingCard(card.id, { gift_qr_url: url });
              if (error) toast.error(error);
              else toast.success("Đã lưu QR");
            }}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onSaveGift}
            className="rounded-lg bg-mewedding-rose px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Lưu thay đổi
          </button>
        </Tabs.Content>

        <Tabs.Content value="url" className="mt-4 space-y-3 rounded-xl border border-neutral-100 bg-white p-4">
          <div>
            <label className="text-sm font-medium">Slug URL</label>
            <input
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.slug}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, slug: v }));
                void checkSlug(v);
              }}
            />
            {slugOk === false && <p className="mt-1 text-xs text-red-600">Slug đã tồn tại</p>}
            {slugOk === true && <p className="mt-1 text-xs text-green-600">Slug khả dụng</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Trạng thái</label>
            <select
              className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as WeddingCard["status"] }))
              }
            >
              <option value="draft">Nháp</option>
              <option value="active">Công khai</option>
              <option value="expired">Hết hạn</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Mẫu thiệp đang dùng</label>
            <p className="mt-1 text-sm text-neutral-500">
              ID: <code className="bg-neutral-100 px-1 rounded text-xs">{form.template_id}</code>
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Để đổi mẫu, chuyển sang tab <strong>🎨 Chọn mẫu</strong>.
            </p>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={onSaveUrl}
            className="rounded-lg bg-mewedding-rose px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Lưu thay đổi
          </button>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

// ─── Template Picker ──────────────────────────────────────────────────────────

function TemplatePicker({
  card,
  templates,
  applying,
  onApply,
}: {
  card: WeddingCard;
  templates: TemplateRow[];
  applying: string | null;
  onApply: (templateId: string) => void;
}) {
  const userPlan = card.plan as Plan;

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-100 bg-white p-8 text-center">
        <div className="text-4xl mb-3">🎨</div>
        <p className="text-neutral-500 text-sm">Chưa có mẫu thiệp nào được kích hoạt.</p>
        <p className="text-neutral-400 text-xs mt-1">Admin cần thêm mẫu từ trang quản trị.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-100 bg-white p-4">
        <h2 className="text-base font-semibold text-neutral-800 mb-1">Chọn mẫu thiệp</h2>
        <p className="text-sm text-neutral-500">
          Chọn mẫu phù hợp với gói <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${PLAN_COLOR[userPlan] ?? "bg-gray-100 text-gray-600"}`}>{PLAN_LABEL[userPlan] ?? userPlan.toUpperCase()}</span> của bạn.
          {" "}Mẫu bị khoá yêu cầu nâng cấp gói.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {templates.map((t) => {
          const accessible = planMeetsRequirement(userPlan, t.plan_required as Plan);
          const isApplying = applying === t.id;
          const isActive = card.template_id === t.id;

          return (
            <div
              key={t.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all ${
                isActive
                  ? "border-rose-400 shadow-md"
                  : accessible
                  ? "border-neutral-200 hover:border-indigo-300 hover:shadow-sm cursor-pointer"
                  : "border-neutral-100 opacity-60"
              }`}
              onClick={() => accessible && !isApplying && onApply(t.id)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-[3/4] bg-gradient-to-br from-neutral-100 to-neutral-200">
                {t.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.thumbnail_url}
                    alt={t.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-300 gap-1">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">Xem trước</span>
                  </div>
                )}

                {/* Loading overlay */}
                {isApplying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}

                {/* Lock overlay for inaccessible */}
                {!accessible && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white gap-1">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs font-semibold">Nâng cấp gói</span>
                  </div>
                )}

                {/* Active badge */}
                {isActive && (
                  <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold shadow">
                    Đang dùng
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-white flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">{t.name}</p>
                </div>
                <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-bold ${PLAN_COLOR[t.plan_required] ?? "bg-gray-100 text-gray-600"}`}>
                  {PLAN_LABEL[t.plan_required] ?? t.plan_required.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {hasCardEditorContent(card.content_json) && (
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Thiệp đã được thiết kế</p>
            <p className="text-xs text-indigo-600 mt-0.5">Bạn có thể tiếp tục chỉnh sửa thiệp hiện tại.</p>
          </div>
          <a
            href={`/dashboard/editor/${card.id}`}
            className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Mở editor →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Field input ──────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
