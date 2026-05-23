"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminFilterSelect, AdminListControls } from "@/components/admin/AdminListControls";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/admin/useAdminPagination";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { createClient } from "@/lib/supabase/client";
import type { AffiliateProduct } from "@/types";

type Props = { products: AffiliateProduct[] };

const CATEGORIES = ["photography", "dress", "flowers", "jewelry", "transport", "beauty", "cake", "stationery", "other"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  photography: "Nhiếp ảnh", dress: "Trang phục", flowers: "Hoa cưới", jewelry: "Trang sức",
  transport: "Xe cưới", beauty: "Làm đẹp", cake: "Bánh cưới", stationery: "Thiệp & In ấn", other: "Khác",
};

const EMPTY_FORM = { name: "", description: "", category: "other", price: 0, link_url: "", thumbnail_url: "", sort_order: 0, is_active: true };

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

export default function ProductsAdminClient({ products: initial }: Props) {
  const confirmDialog = useConfirm();
  const [products, setProducts] = useState(initial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (activeFilter === "active" && !p.is_active) return false;
      if (activeFilter === "inactive" && p.is_active) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [products, q, categoryFilter, activeFilter]);

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
  } = useAdminPagination(filtered, [q, categoryFilter, activeFilter]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p: AffiliateProduct) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", category: p.category, price: p.price, link_url: p.link_url ?? "", thumbnail_url: p.thumbnail_url ?? "", sort_order: p.sort_order, is_active: p.is_active });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Cần nhập tên sản phẩm"); return; }
    setSaving(true);
    const supabase = createClient();
    const payload = { ...form, name: form.name.trim(), price: Number(form.price) };

    if (editing) {
      const { error } = await supabase.from("affiliate_products").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      setProducts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...payload } : p));
      toast.success("Đã cập nhật sản phẩm");
    } else {
      const { data, error } = await supabase.from("affiliate_products").insert(payload).select().single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      setProducts((prev) => [...prev, data]);
      toast.success("Đã thêm sản phẩm");
    }
    setSaving(false);
    setModalOpen(false);
  };

  const del = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa sản phẩm",
      message: "Bạn có chắc muốn xóa sản phẩm này? Thao tác không thể hoàn tác.",
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("affiliate_products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Đã xóa");
  };

  const toggleActive = async (p: AffiliateProduct) => {
    const supabase = createClient();
    await supabase.from("affiliate_products").update({ is_active: !p.is_active }).eq("id", p.id);
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sản phẩm liên kết</h1>
        <p className="text-sm text-neutral-500">{products.length} sản phẩm</p>
      </div>

      <AdminListControls
        query={q}
        onQueryChange={setQ}
        placeholder="Tìm theo tên, danh mục..."
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      >
        <AdminFilterSelect value={categoryFilter} onChange={setCategoryFilter}>
          <option value="all">Tất cả danh mục</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect value={activeFilter} onChange={(v) => setActiveFilter(v as "all" | "active" | "inactive")}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </AdminFilterSelect>
      </AdminListControls>

      <div className="flex justify-end">
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
          <Plus className="h-4 w-4" /> Thêm
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left">Sản phẩm</th>
              <th className="px-4 py-3 text-left">Danh mục</th>
              <th className="px-4 py-3 text-left">Giá</th>
              <th className="px-4 py-3 text-left">Link</th>
              <th className="px-4 py-3 text-left">Trạng thái</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {paginated.map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.thumbnail_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-neutral-100" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-lg">🛍️</div>
                    )}
                    <div>
                      <p className="font-medium">{p.name}</p>
                      {p.description && <p className="text-xs text-neutral-400 truncate max-w-40">{p.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-rose-600">{fmt(Number(p.price))}</td>
                <td className="px-4 py-3">
                  {p.link_url ? (
                    <a href={p.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-600 hover:underline">Xem →</a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(p)} className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"}`}>
                    {p.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 hover:bg-neutral-100">
                      <Pencil className="h-4 w-4 text-neutral-500" />
                    </button>
                    <button onClick={() => del(p.id)} className="rounded-lg p-1.5 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-neutral-400">{products.length === 0 ? "Chưa có sản phẩm" : "Không có kết quả phù hợp bộ lọc"}</td></tr>
            )}
          </tbody>
        </table>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          filteredCount={filteredCount}
          totalCount={products.length}
          onPageChange={setPage}
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Chỉnh sửa" : "Thêm"} sản phẩm</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              <label className="block"><span className="mb-1 block text-xs font-medium">Tên sản phẩm *</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="block"><span className="mb-1 block text-xs font-medium">Mô tả</span>
                <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs font-medium">Danh mục</span>
                  <select className="w-full rounded-lg border bg-white px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </label>
                <label className="block"><span className="mb-1 block text-xs font-medium">Giá (VND)</span>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
                </label>
              </div>
              <label className="block"><span className="mb-1 block text-xs font-medium">Link sản phẩm</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="https://..." />
              </label>
              <label className="block"><span className="mb-1 block text-xs font-medium">Thumbnail URL</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://..." />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs font-medium">Sort order</span>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </label>
                <label className="flex items-center gap-2 pt-5 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-rose-500" />
                  Kích hoạt
                </label>
              </div>
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
