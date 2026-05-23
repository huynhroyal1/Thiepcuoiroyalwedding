"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { createClient } from "@/lib/supabase/client";
import type { Plan, TemplateRow } from "@/types";

type Props = { templates: TemplateRow[] };

const EMPTY_FORM = {
  id: "",
  name: "",
  description: "",
  thumbnail_url: "",
  preview_url: "",
  plan_required: "basic" as Plan,
  style_tags: "",
  sort_order: 0,
  is_active: true,
};

export default function TemplatesAdminClient({ templates: initial }: Props) {
  const confirmDialog = useConfirm();
  const [templates, setTemplates] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (t: TemplateRow) => {
    setEditing(t);
    setForm({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      thumbnail_url: t.thumbnail_url ?? "",
      preview_url: t.preview_url ?? "",
      plan_required: t.plan_required,
      style_tags: (t.style_tags ?? []).join(", "),
      sort_order: t.sort_order,
      is_active: t.is_active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.id.trim() || !form.name.trim()) {
      toast.error("ID và Tên không được để trống");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description || null,
      thumbnail_url: form.thumbnail_url || null,
      preview_url: form.preview_url || null,
      plan_required: form.plan_required,
      style_tags: form.style_tags ? form.style_tags.split(",").map((s) => s.trim()).filter(Boolean) : null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("templates").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setTemplates((prev) => prev.map((t) => t.id === editing.id ? { ...t, ...payload } : t));
      toast.success("Đã cập nhật template");
    } else {
      const { data, error } = await supabase.from("templates").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setTemplates((prev) => [...prev, data]);
      toast.success("Đã thêm template");
    }

    setSaving(false);
    setModalOpen(false);
  };

  const del = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa template",
      message: `Xóa template "${id}"? Thao tác không thể hoàn tác.`,
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    const supabase = createClient();
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Đã xóa");
    }
  };

  const toggleActive = async (t: TemplateRow) => {
    const supabase = createClient();
    await supabase.from("templates").update({ is_active: !t.is_active }).eq("id", t.id);
    setTemplates((prev) => prev.map((x) => x.id === t.id ? { ...x, is_active: !t.is_active } : x));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates</h1>
          <p className="text-sm text-neutral-500">{templates.length} mẫu thiệp</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
          <Plus className="h-4 w-4" />
          Thêm template
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            {t.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={t.thumbnail_url} alt={t.name} className="mb-3 h-36 w-full rounded-xl object-cover bg-neutral-100" />
            )}
            {!t.thumbnail_url && (
              <div className="mb-3 flex h-36 items-center justify-center rounded-xl bg-neutral-100 text-2xl">🎨</div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-neutral-500 font-mono">{t.id}</p>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 hover:bg-neutral-100">
                  <Pencil className="h-4 w-4 text-neutral-500" />
                </button>
                <button onClick={() => del(t.id)} className="rounded-lg p-1.5 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.plan_required === "vip" ? "bg-amber-100 text-amber-700" : t.plan_required === "pro" ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-600"}`}>
                {t.plan_required}
              </span>
              <button
                onClick={() => toggleActive(t)}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}
              >
                {t.is_active ? "Active" : "Inactive"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Chỉnh sửa" : "Thêm"} Template</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="h-5 w-5 text-neutral-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-700">ID <span className="text-red-500">*</span></span>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!!editing} placeholder="classic-white" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-700">Tên <span className="text-red-500">*</span></span>
                  <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Mô tả</span>
                <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Thumbnail URL</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-700">Plan yêu cầu</span>
                  <select className="w-full rounded-lg border bg-white px-3 py-2 text-sm" value={form.plan_required} onChange={(e) => setForm({ ...form, plan_required: e.target.value as Plan })}>
                    <option value="basic">basic</option>
                    <option value="pro">pro</option>
                    <option value="vip">vip</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-neutral-700">Sort order</span>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Style tags (ngăn cách bằng dấu phẩy)</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.style_tags} onChange={(e) => setForm({ ...form, style_tags: e.target.value })} placeholder="tối giản, Vintage" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-rose-500" />
                Kích hoạt
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50">Hủy</button>
              <button onClick={save} disabled={saving} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
