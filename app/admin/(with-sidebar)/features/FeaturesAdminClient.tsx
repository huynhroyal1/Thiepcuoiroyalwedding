"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Plus,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { normalizeFeatureKey } from "@/lib/features/normalize-feature-key";
import type { FeatureCatalogItem } from "@/types";

type NewFeatureForm = {
  key: string;
  name: string;
  description: string;
  price: number;
  sort_order: number;
};

type StatusFilter = "all" | "active" | "inactive";
type SortBy = "sort_order" | "name" | "price" | "key";

const PAGE_SIZES = [10, 20, 50, 100] as const;

const EMPTY_NEW: NewFeatureForm = {
  key: "",
  name: "",
  description: "",
  price: 0,
  sort_order: 0,
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " đ";
}

function NewFeatureModal({
  existingKeys,
  onClose,
  onSave,
}: {
  existingKeys: Set<string>;
  onClose: () => void;
  onSave: (form: NewFeatureForm) => Promise<void>;
}) {
  const [form, setForm] = useState<NewFeatureForm>(EMPTY_NEW);
  const [saving, setSaving] = useState(false);

  const normalizedKey = normalizeFeatureKey(form.key);
  const keyTaken = normalizedKey.length > 0 && existingKeys.has(normalizedKey);

  const set = (key: keyof NewFeatureForm, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!normalizedKey || !form.name.trim()) {
      toast.error("Cần nhập key và tên");
      return;
    }
    if (keyTaken) {
      toast.error(`Key "${normalizedKey}" đã tồn tại. Hãy sửa dòng đó hoặc đổi key khác.`);
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi tạo tính năng");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Thêm tính năng mới</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Key <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.key}
                onChange={(e) => set("key", e.target.value)}
                placeholder="my_new_feature"
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  keyTaken ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
              />
              {normalizedKey && normalizedKey !== form.key.trim() && (
                <p className="mt-1 text-xs text-gray-500">
                  Key lưu: <span className="font-mono">{normalizedKey}</span>
                </p>
              )}
              {keyTaken && (
                <p className="mt-1 text-xs text-red-600">
                  Key này đã có trong catalog — dùng nút Sửa trên bảng hoặc đổi key mới.
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Giá (đ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tên tính năng <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Tên hiển thị"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sort order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || keyTaken || !normalizedKey}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditRow({
  feature,
  onSave,
  onCancel,
}: {
  feature: FeatureCatalogItem;
  onSave: (updated: Partial<FeatureCatalogItem>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: feature.name,
    description: feature.description ?? "",
    price: feature.price,
    sort_order: feature.sort_order,
    is_active: feature.is_active,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-blue-50">
      <td className="px-4 py-2 text-xs font-mono text-gray-500">{feature.key}</td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded-lg border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
        />
      </td>
      <td className="px-4 py-2">
        <input
          className="w-full rounded-lg border border-blue-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
      </td>
      <td className="px-4 py-2 text-right">
        <input
          type="number"
          className="w-28 rounded-lg border border-blue-300 px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.price}
          onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
        />
      </td>
      <td className="px-4 py-2 text-center">
        <input
          type="number"
          className="w-16 rounded-lg border border-blue-300 px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={form.sort_order}
          onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
        />
      </td>
      <td className="px-4 py-2 text-center">
        <button
          onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
          className="p-1 rounded"
        >
          {form.is_active ? (
            <ToggleRight size={22} className="text-green-500" />
          ) : (
            <ToggleLeft size={22} className="text-gray-400" />
          )}
        </button>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center justify-end gap-1.5">
          <button
            disabled={saving}
            onClick={handleSave}
            className="p-1.5 rounded-md text-green-600 hover:bg-green-50 disabled:opacity-50"
          >
            <Check size={15} />
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100"
          >
            <X size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function FeaturesAdminClient({
  initialFeatures,
}: {
  initialFeatures: FeatureCatalogItem[];
}) {
  const confirmDialog = useConfirm();
  const [features, setFeatures] = useState(initialFeatures);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("sort_order");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(20);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = features.filter((f) => {
      if (statusFilter === "active" && !f.is_active) return false;
      if (statusFilter === "inactive" && f.is_active) return false;
      if (!needle) return true;
      return (
        f.key.toLowerCase().includes(needle) ||
        f.name.toLowerCase().includes(needle) ||
        (f.description ?? "").toLowerCase().includes(needle)
      );
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "sort_order") return a.sort_order - b.sort_order;
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "name") return a.name.localeCompare(b.name, "vi");
      return a.key.localeCompare(b.key);
    });

    return list;
  }, [features, q, statusFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, sortBy, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const stats = useMemo(
    () => ({
      total: features.length,
      active: features.filter((f) => f.is_active).length,
      inactive: features.filter((f) => !f.is_active).length,
    }),
    [features]
  );

  const handleSaveEdit = async (key: string, updated: Partial<FeatureCatalogItem>) => {
    const res = await fetch("/api/admin/features", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, ...updated }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error("Lỗi: " + (data.error ?? "Cập nhật thất bại"));
      return;
    }
    setFeatures((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...updated } : f))
    );
    toast.success("Đã cập nhật");
    setEditingKey(null);
  };

  const handleToggleActive = (key: string, current: boolean) => {
    startTransition(async () => {
      const res = await fetch("/api/admin/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, is_active: !current }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Lỗi: " + (data.error ?? "Cập nhật thất bại"));
        return;
      }
      setFeatures((prev) =>
        prev.map((f) => (f.key === key ? { ...f, is_active: !current } : f))
      );
    });
  };

  const handleDelete = async (key: string, name: string) => {
    const ok = await confirmDialog({
      title: "Xóa tính năng",
      message: `Xóa tính năng "${name}" (${key})?\n\nNếu đã có khách mua, hệ thống sẽ từ chối xóa — hãy tắt Active.`,
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    setDeletingKey(key);
    const res = await fetch(
      `/api/admin/features?key=${encodeURIComponent(key)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    setDeletingKey(null);
    if (!res.ok) {
      toast.error(data.error ?? "Không thể xóa");
      return;
    }
    setFeatures((prev) => prev.filter((f) => f.key !== key));
    toast.success("Đã xóa tính năng");
    if (editingKey === key) setEditingKey(null);
  };

  const existingKeys = new Set(features.map((f) => f.key));

  const handleCreate = async (form: NewFeatureForm) => {
    const key = normalizeFeatureKey(form.key);
    const res = await fetch("/api/admin/features", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        name: form.name.trim(),
        description: form.description,
        price: form.price,
        sort_order: form.sort_order,
        is_active: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Tạo thất bại");
    setFeatures((prev) => [...prev, data as FeatureCatalogItem].sort((a, b) => a.sort_order - b.sort_order));
    toast.success("Đã tạo tính năng mới");
  };

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filtered.length);

  return (
    <>
      {showModal && (
        <NewFeatureModal
          existingKeys={existingKeys}
          onClose={() => setShowModal(false)}
          onSave={handleCreate}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-100 px-2.5 py-1">Tổng: {stats.total}</span>
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700">
            Đang bật: {stats.active}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1">Tắt: {stats.inactive}</span>
          {q || statusFilter !== "all" ? (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
              Lọc: {filtered.length} kết quả
            </span>
          ) : null}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          <Plus size={16} />
          Thêm tính năng
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo key, tên, mô tả..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang bật</option>
          <option value="inactive">Đã tắt</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          <option value="sort_order">Sắp xếp: Thứ tự hiển thị</option>
          <option value="name">Sắp xếp: Tên A→Z</option>
          <option value="price">Sắp xếp: Giá cao→thấp</option>
          <option value="key">Sắp xếp: Key</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} / trang
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Key</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-[180px]">Tên</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 min-w-[240px]">Mô tả</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Giá</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Sort</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Active</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 min-w-[88px]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.map((f) =>
                editingKey === f.key ? (
                  <EditRow
                    key={f.key}
                    feature={f}
                    onSave={(updated) => handleSaveEdit(f.key, updated)}
                    onCancel={() => setEditingKey(null)}
                  />
                ) : (
                  <tr
                    key={f.key}
                    className={`hover:bg-gray-50 transition-colors ${!f.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {f.key}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{f.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={f.description ?? ""}>
                      {f.description ?? <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {fmt(f.price)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{f.sort_order}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(f.key, f.is_active)}
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                        title={f.is_active ? "Tắt" : "Bật"}
                      >
                        {f.is_active ? (
                          <ToggleRight size={22} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={22} className="text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditingKey(f.key)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => void handleDelete(f.key, f.name)}
                          disabled={deletingKey === f.key}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              {features.length === 0
                ? "Chưa có tính năng nào."
                : "Không có kết quả phù hợp bộ lọc."}
            </div>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Hiển thị {rangeStart}–{rangeEnd} / {filtered.length}
              {filtered.length !== features.length && ` (trong ${features.length} tổng)`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>
              <span className="text-xs text-gray-600 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
