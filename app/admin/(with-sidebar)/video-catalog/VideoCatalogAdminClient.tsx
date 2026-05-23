"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Save, X } from "lucide-react";
import { AdminFilterSelect, AdminListControls } from "@/components/admin/AdminListControls";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/admin/useAdminPagination";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { createClient } from "@/lib/supabase/client";
import type { VideoCatalog, VideoOrder, VideoOrderStatus } from "@/types";

type VideoOrderWithProfile = VideoOrder & { profiles: { full_name: string | null } | null };
type Props = { catalog: VideoCatalog[]; orders: VideoOrderWithProfile[] };

const STATUS_LABELS: Record<VideoOrderStatus, string> = {
  created: "Mới tạo",
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  in_progress: "Đang thực hiện",
  delivered: "Đã giao",
  completed: "Hoàn thành",
  canceled: "Đã hủy",
};

const STATUS_COLORS: Record<VideoOrderStatus, string> = {
  created: "bg-neutral-100 text-neutral-600",
  pending_payment: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  delivered: "bg-purple-100 text-purple-700",
  completed: "bg-teal-100 text-teal-700",
  canceled: "bg-red-100 text-red-600",
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

export default function VideoCatalogAdminClient({ catalog: initialCatalog, orders: initialOrders }: Props) {
  const confirmDialog = useConfirm();
  const [catalog, setCatalog] = useState(initialCatalog);
  const [orders, setOrders] = useState(initialOrders);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderEdit, setOrderEdit] = useState<{ status: VideoOrderStatus; delivered_url: string }>({ status: "created", delivered_url: "" });
  const [tab, setTab] = useState<"catalog" | "orders">("orders");
  const [addOpen, setAddOpen] = useState(false);
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: "", description: "", price: 0, package: "basic" as VideoCatalog["package"], sort_order: 0, is_active: true });
  const [editForm, setEditForm] = useState({ name: "", description: "", price: 0, package: "basic" as VideoCatalog["package"], sort_order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredOrders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (packageFilter !== "all" && o.package !== packageFilter) return false;
      if (!needle) return true;
      return (
        (o.profiles?.full_name ?? "").toLowerCase().includes(needle) ||
        o.user_id.toLowerCase().includes(needle) ||
        o.title.toLowerCase().includes(needle) ||
        o.package.toLowerCase().includes(needle)
      );
    });
  }, [orders, q, statusFilter, packageFilter]);

  const filteredCatalog = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter((c) => {
      if (packageFilter !== "all" && c.package !== packageFilter) return false;
      if (activeFilter === "active" && !c.is_active) return false;
      if (activeFilter === "inactive" && c.is_active) return false;
      if (!needle) return true;
      return (
        c.name.toLowerCase().includes(needle) ||
        (c.description ?? "").toLowerCase().includes(needle) ||
        c.package.toLowerCase().includes(needle)
      );
    });
  }, [catalog, q, packageFilter, activeFilter]);

  const orderPagination = useAdminPagination(filteredOrders, [tab, q, statusFilter, packageFilter]);
  const catalogPagination = useAdminPagination(filteredCatalog, [tab, q, packageFilter, activeFilter]);

  const handleTabChange = (t: "catalog" | "orders") => {
    setTab(t);
    setQ("");
    setStatusFilter("all");
    setPackageFilter("all");
    setActiveFilter("all");
  };

  const startEditOrder = (o: VideoOrderWithProfile) => {
    setEditingOrderId(o.id);
    setOrderEdit({ status: o.status, delivered_url: o.delivered_url ?? "" });
  };

  const saveOrderEdit = async (id: string) => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("video_orders").update(orderEdit).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...orderEdit } : o));
      toast.success("Đã cập nhật đơn hàng video");
      setEditingOrderId(null);
    }
    setSaving(false);
  };

  const addCatalog = async () => {
    if (!addForm.name.trim()) { toast.error("Cần nhập tên"); return; }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("video_catalog").insert({ ...addForm, price: Number(addForm.price) }).select().single();
    if (error) toast.error(error.message);
    else { setCatalog((prev) => [...prev, data]); toast.success("Đã thêm"); setAddOpen(false); }
    setSaving(false);
  };

  const startEditCatalog = (c: VideoCatalog) => {
    setEditingCatalogId(c.id);
    setEditForm({
      name: c.name,
      description: c.description ?? "",
      price: Number(c.price),
      package: c.package,
      sort_order: c.sort_order ?? 0,
      is_active: c.is_active,
    });
  };

  const saveCatalogEdit = async (id: string) => {
    if (!editForm.name.trim()) {
      toast.error("Cần nhập tên");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = { ...editForm, price: Number(editForm.price) };
    const { data, error } = await supabase.from("video_catalog").update(payload).eq("id", id).select().single();
    if (error) toast.error(error.message);
    else {
      setCatalog((prev) => prev.map((c) => (c.id === id ? data : c)));
      toast.success("Đã cập nhật gói video");
      setEditingCatalogId(null);
    }
    setSaving(false);
  };

  const deleteCatalog = async (id: string) => {
    const ok = await confirmDialog({
      title: "Xóa gói video",
      message: "Bạn có chắc muốn xóa gói video này? Thao tác không thể hoàn tác.",
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("video_catalog").delete().eq("id", id);
    setCatalog((prev) => prev.filter((c) => c.id !== id));
    toast.success("Đã xóa");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Video Catalog & Orders</h1>

      <div className="flex gap-2 border-b border-neutral-200">
        {(["orders", "catalog"] as const).map((t) => (
          <button key={t} onClick={() => handleTabChange(t)} className={`pb-2 px-4 text-sm font-medium capitalize ${tab === t ? "border-b-2 border-rose-500 text-rose-600" : "text-neutral-500 hover:text-neutral-700"}`}>
            {t === "orders" ? "Video Orders" : "Catalog"}
          </button>
        ))}
      </div>

      <AdminListControls
        query={q}
        onQueryChange={setQ}
        placeholder={tab === "orders" ? "Tìm theo user, tiêu đề..." : "Tìm theo tên gói, mô tả..."}
        pageSize={tab === "orders" ? orderPagination.pageSize : catalogPagination.pageSize}
        onPageSizeChange={tab === "orders" ? orderPagination.setPageSize : catalogPagination.setPageSize}
      >
        {tab === "orders" && (
          <>
            <AdminFilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </AdminFilterSelect>
            <AdminFilterSelect value={packageFilter} onChange={setPackageFilter}>
              <option value="all">Tất cả gói</option>
              <option value="basic">basic</option>
              <option value="pro">pro</option>
              <option value="vip">vip</option>
            </AdminFilterSelect>
          </>
        )}
        {tab === "catalog" && (
          <>
            <AdminFilterSelect value={packageFilter} onChange={setPackageFilter}>
              <option value="all">Tất cả gói</option>
              <option value="basic">basic</option>
              <option value="pro">pro</option>
              <option value="vip">vip</option>
            </AdminFilterSelect>
            <AdminFilterSelect value={activeFilter} onChange={(v) => setActiveFilter(v as "all" | "active" | "inactive")}>
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Ẩn</option>
            </AdminFilterSelect>
          </>
        )}
      </AdminListControls>

      {tab === "catalog" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600">
              <Plus className="h-4 w-4" /> Thêm gói
            </button>
          </div>
          {filteredCatalog.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white py-12 text-center text-neutral-400">
              {catalog.length === 0 ? "Chưa có gói video" : "Không có kết quả phù hợp bộ lọc"}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {(catalogPagination.paginated as VideoCatalog[]).map((c) => (
              <div key={c.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-neutral-500">{c.description}</p>
                    <p className="mt-2 text-lg font-bold text-rose-600">{fmt(Number(c.price))}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => startEditCatalog(c)} className="rounded-lg p-1 hover:bg-neutral-100">
                      <Pencil className="h-4 w-4 text-neutral-500" />
                    </button>
                    <button type="button" onClick={() => void deleteCatalog(c.id)} className="rounded-lg p-1 text-neutral-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.package === "vip" ? "bg-amber-100 text-amber-700" : c.package === "pro" ? "bg-blue-100 text-blue-700" : "bg-neutral-100 text-neutral-600"}`}>
                    {c.package}
                  </span>
                  {!c.is_active && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">Ẩn</span>}
                </div>
              </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <AdminPagination
                  page={catalogPagination.page}
                  totalPages={catalogPagination.totalPages}
                  rangeStart={catalogPagination.rangeStart}
                  rangeEnd={catalogPagination.rangeEnd}
                  filteredCount={catalogPagination.filteredCount}
                  totalCount={catalog.length}
                  onPageChange={catalogPagination.setPage}
                />
              </div>
            </>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Delivered URL</th>
                <th className="px-4 py-3 text-left">Giá</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {orderPagination.paginated.map((o) =>
                editingOrderId === o.id ? (
                  <tr key={o.id} className="bg-rose-50">
                    <td className="px-4 py-2 text-xs">{o.profiles?.full_name || o.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-2 text-xs">{o.title}</td>
                    <td className="px-4 py-2 text-xs">{o.package}</td>
                    <td className="px-4 py-2">
                      <select className="rounded border bg-white px-2 py-1 text-xs" value={orderEdit.status} onChange={(e) => setOrderEdit({ ...orderEdit, status: e.target.value as VideoOrderStatus })}>
                        {Object.keys(STATUS_LABELS).map((s) => (
                          <option key={s} value={s}>{STATUS_LABELS[s as VideoOrderStatus]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input className="w-48 rounded border px-2 py-1 text-xs" value={orderEdit.delivered_url} onChange={(e) => setOrderEdit({ ...orderEdit, delivered_url: e.target.value })} placeholder="https://..." />
                    </td>
                    <td className="px-4 py-2 text-xs">{fmt(Number(o.price))}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => saveOrderEdit(o.id)} disabled={saving} className="rounded-lg bg-rose-500 p-1.5 text-white hover:bg-rose-600">
                          <Save className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingOrderId(null)} className="rounded-lg p-1.5 hover:bg-neutral-100">
                          <X className="h-3.5 w-3.5 text-neutral-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={o.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-xs">{o.profiles?.full_name || o.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{o.title}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{o.package}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {o.delivered_url ? <a href={o.delivered_url} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:underline">Xem video</a> : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-rose-600">{fmt(Number(o.price))}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button onClick={() => startEditOrder(o)} className="rounded-lg p-1.5 hover:bg-neutral-100">
                          <Pencil className="h-4 w-4 text-neutral-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">{orders.length === 0 ? "Chưa có đơn video nào" : "Không có kết quả phù hợp bộ lọc"}</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <AdminPagination
            page={orderPagination.page}
            totalPages={orderPagination.totalPages}
            rangeStart={orderPagination.rangeStart}
            rangeEnd={orderPagination.rangeEnd}
            filteredCount={orderPagination.filteredCount}
            totalCount={orders.length}
            onPageChange={orderPagination.setPage}
          />
        </div>
      )}

      {editingCatalogId && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingCatalogId(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Sửa gói video</h2>
              <button type="button" onClick={() => setEditingCatalogId(null)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="space-y-3">
              <label className="block"><span className="mb-1 block text-xs font-medium">Tên gói *</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </label>
              <label className="block"><span className="mb-1 block text-xs font-medium">Mô tả</span>
                <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs font-medium">Giá (VND)</span>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                </label>
                <label className="block"><span className="mb-1 block text-xs font-medium">Package</span>
                  <select className="w-full rounded-lg border bg-white px-3 py-2 text-sm" value={editForm.package} onChange={(e) => setEditForm({ ...editForm, package: e.target.value as VideoCatalog["package"] })}>
                    <option value="basic">basic</option>
                    <option value="pro">pro</option>
                    <option value="vip">vip</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
                Đang bán
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setEditingCatalogId(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50">Hủy</button>
              <button type="button" onClick={() => void saveCatalogEdit(editingCatalogId)} disabled={saving} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Thêm gói video</h2>
              <button onClick={() => setAddOpen(false)}><X className="h-5 w-5 text-neutral-400" /></button>
            </div>
            <div className="space-y-3">
              <label className="block"><span className="mb-1 block text-xs font-medium">Tên gói *</span>
                <input className="w-full rounded-lg border px-3 py-2 text-sm" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
              </label>
              <label className="block"><span className="mb-1 block text-xs font-medium">Mô tả</span>
                <textarea className="w-full rounded-lg border px-3 py-2 text-sm" rows={2} value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="mb-1 block text-xs font-medium">Giá (VND)</span>
                  <input type="number" className="w-full rounded-lg border px-3 py-2 text-sm" value={addForm.price} onChange={(e) => setAddForm({ ...addForm, price: Number(e.target.value) })} />
                </label>
                <label className="block"><span className="mb-1 block text-xs font-medium">Package</span>
                  <select className="w-full rounded-lg border bg-white px-3 py-2 text-sm" value={addForm.package} onChange={(e) => setAddForm({ ...addForm, package: e.target.value as VideoCatalog["package"] })}>
                    <option value="basic">basic</option>
                    <option value="pro">pro</option>
                    <option value="vip">vip</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setAddOpen(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50">Hủy</button>
              <button onClick={addCatalog} disabled={saving} className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-60">
                {saving ? "Đang thêm..." : "Thêm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
