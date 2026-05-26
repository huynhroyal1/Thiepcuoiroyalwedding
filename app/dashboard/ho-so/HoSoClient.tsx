"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { updateWeddingCard } from "@/app/actions/wedding-card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { BrideGroomProfile } from "@/types";

type CardSnippet = {
  id: string;
  bride_name: string;
  groom_name: string;
  wedding_date: string | null;
  venue_name: string | null;
  love_story: string | null;
  hashtag: string | null;
} | null;

type Props = {
  card: CardSnippet;
  profiles: BrideGroomProfile[];
};

type Tab = "groom" | "bride" | "other";

const emptyProfile = (role: "bride" | "groom"): Partial<BrideGroomProfile> => ({
  role,
  full_name: "",
  email: "",
  phone: "",
  birthday: "",
  hometown: "",
  maps_url: "",
  description: "",
  avatar_url: null,
});

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200"
      />
    </div>
  );
}

/** Must live outside HoSoClient — inline component remounts on every keystroke and kills focus. */
function ProfileForm({
  role,
  form,
  setForm,
  avatarRef,
  uploading,
  saving,
  onSave,
  onAvatarChange,
}: {
  role: "bride" | "groom";
  form: Partial<BrideGroomProfile>;
  setForm: React.Dispatch<React.SetStateAction<Partial<BrideGroomProfile>>>;
  avatarRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  saving: boolean;
  onSave: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-rose-200 bg-rose-50">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl text-rose-300">
              {role === "groom" ? "🤵" : "👰"}
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          >
            {uploading ? "Đang tải..." : "Tải ảnh lên"}
          </button>
          <p className="mt-1 text-xs text-neutral-400">JPG, PNG, tối đa 2MB</p>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onAvatarChange}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Họ và tên"
          value={form.full_name ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
        />
        <Field
          label="Email"
          type="email"
          value={form.email ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        />
        <Field
          label="Số điện thoại"
          value={form.phone ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <Field
          label="Ngày sinh"
          type="date"
          value={form.birthday ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, birthday: v }))}
        />
        <Field
          label="Quê quán"
          value={form.hometown ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, hometown: v }))}
        />
        <Field
          label="Liên kết Google Maps"
          value={form.maps_url ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, maps_url: v }))}
          placeholder="https://maps.google.com/..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Giới thiệu</label>
        <textarea
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200"
          rows={4}
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Vài dòng giới thiệu..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || uploading}
          className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu hồ sơ"}
        </button>
      </div>
    </div>
  );
}

export default function HoSoClient({ card, profiles: initialProfiles }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<Tab>("groom");
  const [profiles, setProfiles] = useState<BrideGroomProfile[]>(initialProfiles);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const groomData = profiles.find((p) => p.role === "groom") ?? null;
  const brideData = profiles.find((p) => p.role === "bride") ?? null;

  const [groomForm, setGroomForm] = useState<Partial<BrideGroomProfile>>(
    groomData ?? emptyProfile("groom")
  );
  const [brideForm, setBrideForm] = useState<Partial<BrideGroomProfile>>(
    brideData ?? emptyProfile("bride")
  );
  const [otherForm, setOtherForm] = useState({
    wedding_date: toDateInputValue(card?.wedding_date),
    venue_name: card?.venue_name ?? "",
    love_story: card?.love_story ?? "",
    hashtag: card?.hashtag ?? "",
  });

  const groomAvatarRef = useRef<HTMLInputElement>(null);
  const brideAvatarRef = useRef<HTMLInputElement>(null);
  const profilesSyncedRef = useRef(false);

  useEffect(() => {
    if (profilesSyncedRef.current) return;
    const g = profiles.find((p) => p.role === "groom");
    const b = profiles.find((p) => p.role === "bride");
    if (g) setGroomForm(g);
    if (b) setBrideForm(b);
    profilesSyncedRef.current = true;
  }, [profiles]);

  if (!card) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Hồ sơ thiệp cưới</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Điều này giúp khách mời hiểu rõ hơn về bạn và gửi lời chúc hoặc quà tặng.
          </p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-6 text-center text-rose-700">
          Bạn chưa có thiệp cưới. Vui lòng tạo thiệp cưới trước.
        </div>
      </div>
    );
  }

  const uploadAvatar = async (file: File, role: "bride" | "groom") => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${card.id}/${role}.${ext}`;
    const { error } = await supabase.storage.from("wedding-assets").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (error) {
      toast.error("Lỗi tải ảnh: " + error.message);
      setUploading(false);
      return null;
    }
    const { data } = supabase.storage.from("wedding-assets").getPublicUrl(path);
    setUploading(false);
    return data.publicUrl;
  };

  const saveProfile = async (role: "bride" | "groom") => {
    const form = role === "groom" ? groomForm : brideForm;
    setSaving(true);
    const { data, error } = await supabase
      .from("bride_groom_profiles")
      .upsert(
        {
          card_id: card.id,
          role,
          full_name: form.full_name ?? null,
          email: form.email ?? null,
          phone: form.phone ?? null,
          birthday: form.birthday || null,
          hometown: form.hometown ?? null,
          maps_url: form.maps_url ?? null,
          description: form.description ?? null,
          avatar_url: form.avatar_url ?? null,
        },
        { onConflict: "card_id,role" }
      )
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error("Lỗi lưu: " + error.message);
    } else {
      toast.success("Đã lưu hồ sơ");
      setProfiles((prev) => {
        const next = prev.filter((p) => p.role !== role);
        return [...next, data as BrideGroomProfile];
      });
    }
  };

  const saveOther = async () => {
    setSaving(true);
    const weddingIso = otherForm.wedding_date
      ? new Date(`${otherForm.wedding_date}T12:00:00`).toISOString()
      : null;
    const { error } = await updateWeddingCard(card.id, {
      wedding_date: weddingIso,
      venue_name: otherForm.venue_name || null,
      love_story: otherForm.love_story || null,
      hashtag: otherForm.hashtag || null,
    });
    setSaving(false);
    if (error) toast.error(error);
    else toast.success("Đã lưu thông tin");
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    role: "bride" | "groom"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadAvatar(file, role);
    if (!url) return;
    if (role === "groom") setGroomForm((f) => ({ ...f, avatar_url: url }));
    else setBrideForm((f) => ({ ...f, avatar_url: url }));
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "groom", label: "Chú Rể" },
    { id: "bride", label: "Cô Dâu" },
    { id: "other", label: "Chi Tiết Khác" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hồ sơ thiệp cưới</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Điều này giúp khách mời hiểu rõ hơn về bạn và gửi lời chúc hoặc quà tặng.
        </p>
      </div>

      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === t.id ? "bg-white text-rose-600 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-100 bg-white p-6 shadow-sm">
        {tab === "groom" && (
          <ProfileForm
            role="groom"
            form={groomForm}
            setForm={setGroomForm}
            avatarRef={groomAvatarRef}
            uploading={uploading}
            saving={saving}
            onSave={() => void saveProfile("groom")}
            onAvatarChange={(e) => void handleAvatarChange(e, "groom")}
          />
        )}
        {tab === "bride" && (
          <ProfileForm
            role="bride"
            form={brideForm}
            setForm={setBrideForm}
            avatarRef={brideAvatarRef}
            uploading={uploading}
            saving={saving}
            onSave={() => void saveProfile("bride")}
            onAvatarChange={(e) => void handleAvatarChange(e, "bride")}
          />
        )}
        {tab === "other" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Ngày cưới"
                type="date"
                value={otherForm.wedding_date}
                onChange={(v) => setOtherForm((f) => ({ ...f, wedding_date: v }))}
              />
              <Field
                label="Tên địa điểm"
                value={otherForm.venue_name}
                onChange={(v) => setOtherForm((f) => ({ ...f, venue_name: v }))}
                placeholder="Nhà hàng / Trung tâm tiệc cưới..."
              />
              <Field
                label="Hashtag"
                value={otherForm.hashtag}
                onChange={(v) => setOtherForm((f) => ({ ...f, hashtag: v }))}
                placeholder="#TenCacBan2026"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Câu chuyện tình yêu
              </label>
              <textarea
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-200"
                rows={6}
                value={otherForm.love_story}
                onChange={(e) => setOtherForm((f) => ({ ...f, love_story: e.target.value }))}
                placeholder="Kể về hành trình tình yêu của bạn..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void saveOther()}
                disabled={saving}
                className="rounded-lg bg-rose-500 px-5 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
