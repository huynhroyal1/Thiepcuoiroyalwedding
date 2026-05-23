"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, LayoutTemplate } from "lucide-react";
import { AdminFilterSelect, AdminListControls } from "@/components/admin/AdminListControls";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/admin/useAdminPagination";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { createClient } from "@/lib/supabase/client";
import type { TemplateRow, Plan } from "@/types";

const PLAN_COLORS: Record<Plan, string> = {
  basic: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  vip: "bg-purple-100 text-purple-700",
};

type TemplateFormData = {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  preview_url: string;
  plan_required: Plan;
  style_tags: string;
  sort_order: number;
};

const EMPTY_FORM: TemplateFormData = {
  id: "",
  name: "",
  description: "",
  thumbnail_url: "",
  preview_url: "",
  plan_required: "basic",
  style_tags: "",
  sort_order: 0,
};

function TemplateModal({
  initial,
  onClose,
  onSave,
}: {
  initial: TemplateFormData | null;
  onClose: () => void;
  onSave: (data: TemplateFormData) => Promise<void>;
}) {
  const isEdit = initial !== null;
  const [form, setForm] = useState<TemplateFormData>(initial ?? EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof TemplateFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi lưu template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? "Sửa template" : "Thêm template mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ID (key) <span className="text-red-500">*</span>
              </label>
              <input
                required
                disabled={isEdit}
                value={form.id}
                onChange={(e) => set("id", e.target.value)}
                placeholder="classic-white"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Sort order
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tên template <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Classic White"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Mô tả
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Plan yêu cầu
            </label>
            <select
              value={form.plan_required}
              onChange={(e) => set("plan_required", e.target.value as Plan)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Thumbnail URL
            </label>
            <input
              value={form.thumbnail_url}
              onChange={(e) => set("thumbnail_url", e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Preview URL
            </label>
            <input
              value={form.preview_url}
              onChange={(e) => set("preview_url", e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Style tags (phân cách bởi dấu phẩy)
            </label>
            <input
              value={form.style_tags}
              onChange={(e) => set("style_tags", e.target.value)}
              placeholder="romantic, minimal, luxury"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesClient({
  initialTemplates,
}: {
  initialTemplates: TemplateRow[];
}) {
  const confirmDialog = useConfirm();
  const [templates, setTemplates] = useState(initialTemplates);
  const [modal, setModal] = useState<{
    open: boolean;
    data: TemplateFormData | null;
  }>({ open: false, data: null });
  const [pending, startTransition] = useTransition();
  const supabase = createClient();
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | Plan>("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter((t) => {
      if (planFilter !== "all" && t.plan_required !== planFilter) return false;
      if (activeFilter === "active" && !t.is_active) return false;
      if (activeFilter === "inactive" && t.is_active) return false;
      if (!needle) return true;
      return (
        t.id.toLowerCase().includes(needle) ||
        t.name.toLowerCase().includes(needle) ||
        (t.description ?? "").toLowerCase().includes(needle) ||
        (t.style_tags ?? []).some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [templates, q, planFilter, activeFilter]);

  const {
    paginated,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    rangeStart,
    rangeEnd,
    filteredCount,
  } = useAdminPagination(filtered, [q, planFilter, activeFilter]);

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      const { error } = await supabase
        .from("templates")
        .update({ is_active: !current })
        .eq("id", id);
      if (error) {
        toast.error("Lỗi: " + error.message);
        return;
      }
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !current } : t))
      );
    });
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDialog({
      title: "Xóa template",
      message: `Xóa template "${name}"? Thao tác không thể hoàn tác.`,
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) {
        toast.error("Lỗi xóa: " + error.message);
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Đã xóa template");
    });
  };

  const handleSave = async (form: TemplateFormData) => {
    const payload = {
      id: form.id,
      name: form.name,
      description: form.description || null,
      thumbnail_url: form.thumbnail_url || null,
      preview_url: form.preview_url || null,
      plan_required: form.plan_required,
      style_tags: form.style_tags
        ? form.style_tags.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      sort_order: form.sort_order,
    };

    const isEdit = modal.data !== null;
    if (isEdit) {
      const { data, error } = await supabase
        .from("templates")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setTemplates((prev) =>
        prev.map((t) => (t.id === form.id ? (data as TemplateRow) : t))
      );
      toast.success("Đã cập nhật template");
    } else {
      const { data, error } = await supabase
        .from("templates")
        .insert({ ...payload, is_active: true })
        .select()
        .single();
      if (error) throw new Error(error.message);
      setTemplates((prev) => [data as TemplateRow, ...prev]);
      toast.success("Đã thêm template");
    }
  };

  const openEdit = (t: TemplateRow) => {
    setModal({
      open: true,
      data: {
        id: t.id,
        name: t.name,
        description: t.description ?? "",
        thumbnail_url: t.thumbnail_url ?? "",
        preview_url: t.preview_url ?? "",
        plan_required: t.plan_required,
        style_tags: (t.style_tags ?? []).join(", "),
        sort_order: t.sort_order,
      },
    });
  };

  return (
    <>
      {modal.open && (
        <TemplateModal
          initial={modal.data}
          onClose={() => setModal({ open: false, data: null })}
          onSave={handleSave}
        />
      )}

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminListControls
          query={q}
          onQueryChange={setQ}
          placeholder="Tìm theo tên, ID, tag..."
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          className="flex-1 shadow-none border-0 p-0"
        >
          <AdminFilterSelect value={planFilter} onChange={(v) => setPlanFilter(v as "all" | Plan)}>
            <option value="all">Tất cả plan</option>
            <option value="basic">basic</option>
            <option value="pro">pro</option>
            <option value="vip">vip</option>
          </AdminFilterSelect>
          <AdminFilterSelect value={activeFilter} onChange={(v) => setActiveFilter(v as "all" | "active" | "inactive")}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hiện</option>
            <option value="inactive">Đã ẩn</option>
          </AdminFilterSelect>
        </AdminListControls>
        <button
          onClick={() => setModal({ open: true, data: null })}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          Thêm template
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginated.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-opacity ${
              t.is_active ? "border-gray-200" : "border-dashed border-gray-300 opacity-60"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[4/3] bg-gray-100">
              {t.thumbnail_url ? (
                <Image
                  src={t.thumbnail_url}
                  alt={t.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xs">
                  No image
                </div>
              )}
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{t.id}</p>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[t.plan_required]}`}
                >
                  {t.plan_required}
                </span>
              </div>

              {t.description && (
                <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
              )}

              <div className="flex items-center gap-1 flex-wrap">
                {(t.style_tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span>Sort: {t.sort_order}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    disabled={pending}
                    onClick={() => handleToggleActive(t.id, t.is_active)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                    title={t.is_active ? "Ẩn template" : "Hiện template"}
                  >
                    {t.is_active ? (
                      <ToggleRight size={18} className="text-green-500" />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                  <Link
                    href={`/admin/templates/${t.id}/editor`}
                    className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-500 transition-colors"
                    title="Mở trình chỉnh sửa"
                  >
                    <LayoutTemplate size={15} />
                  </Link>
                  <button
                    disabled={pending}
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                    title="Sửa thông tin"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => handleDelete(t.id, t.name)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-400 transition-colors disabled:opacity-50"
                    title="Xóa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-gray-400">
          {templates.length === 0
            ? "Chưa có template nào. Nhấn \"Thêm template\" để bắt đầu."
            : "Không có kết quả phù hợp bộ lọc."}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <AdminPagination
            page={page}
            totalPages={totalPages}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            filteredCount={filteredCount}
            totalCount={templates.length}
            onPageChange={setPage}
          />
        </div>
      )}
    </>
  );
}
