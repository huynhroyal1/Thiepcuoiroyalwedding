"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { AdminFilterSelect, AdminListControls } from "@/components/admin/AdminListControls";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/admin/useAdminPagination";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import type { CardStatus, Plan } from "@/types";

type CardRow = {
  id: string;
  user_id: string;
  slug: string;
  plan: Plan;
  status: CardStatus;
  view_count: number;
  bride_name: string;
  groom_name: string;
  wedding_date: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

type Props = { cards: CardRow[] };

export default function CardsAdminClient({ cards: initial }: Props) {
  const confirmDialog = useConfirm();
  const [cards, setCards] = useState(initial);
  const [q, setQ] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | Plan>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CardStatus>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cards.filter((c) => {
      if (planFilter !== "all" && c.plan !== planFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        c.slug.toLowerCase().includes(needle) ||
        c.bride_name.toLowerCase().includes(needle) ||
        c.groom_name.toLowerCase().includes(needle) ||
        (c.profiles?.full_name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [cards, q, planFilter, statusFilter]);

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
  } = useAdminPagination(filtered, [q, planFilter, statusFilter]);

  const updateCard = async (id: string, field: string, value: string) => {
    setLoading(id + field);
    const res = await fetch("/api/admin/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Lỗi");
    else {
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
      toast.success("Đã cập nhật");
    }
    setLoading(null);
  };

  const deleteCard = async (id: string, slug: string) => {
    const ok = await confirmDialog({
      title: "Xóa thiệp",
      message: `Xóa thiệp /${slug}? Thao tác không thể hoàn tác.`,
      confirmLabel: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    setLoading(id + "del");
    const res = await fetch(`/api/admin/cards?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Lỗi");
    else {
      setCards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Đã xóa thiệp");
    }
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wedding Cards</h1>
        <p className="text-sm text-neutral-500">{cards.length} thiệp cưới</p>
      </div>

      <AdminListControls
        query={q}
        onQueryChange={setQ}
        placeholder="Tìm theo slug, tên, user..."
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      >
        <AdminFilterSelect value={planFilter} onChange={(v) => setPlanFilter(v as "all" | Plan)}>
          <option value="all">Tất cả plan</option>
          <option value="basic">basic</option>
          <option value="pro">pro</option>
          <option value="vip">vip</option>
        </AdminFilterSelect>
        <AdminFilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as "all" | CardStatus)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="expired">expired</option>
        </AdminFilterSelect>
      </AdminListControls>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left">Thiệp</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Views</th>
                <th className="px-4 py-3 text-left">Ngày cưới</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {paginated.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{c.bride_name} & {c.groom_name}</p>
                      <p className="text-xs text-neutral-400">/{c.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {c.profiles?.full_name || c.user_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.plan}
                      disabled={loading === c.id + "plan"}
                      onChange={(e) => updateCard(c.id, "plan", e.target.value)}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="basic">basic</option>
                      <option value="pro">pro</option>
                      <option value="vip">vip</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      disabled={loading === c.id + "status"}
                      onChange={(e) => updateCard(c.id, "status", e.target.value)}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs"
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="expired">expired</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.view_count}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {c.wedding_date ? new Date(c.wedding_date).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/thiep/${c.slug}`}
                        target="_blank"
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteCard(c.id, c.slug)}
                        disabled={loading === c.id + "del"}
                        className="text-neutral-400 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    {cards.length === 0 ? "Chưa có thiệp nào" : "Không có kết quả phù hợp bộ lọc"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <AdminPagination
          page={page}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          filteredCount={filteredCount}
          totalCount={cards.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
