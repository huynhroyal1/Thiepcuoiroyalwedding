"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminFilterSelect, AdminListControls } from "@/components/admin/AdminListControls";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/admin/useAdminPagination";
import { createClient } from "@/lib/supabase/client";
import type { Commission, WithdrawalRequest, WithdrawalStatus } from "@/types";

type RefCode = { id: string; user_id: string; code: string; created_at: string; profiles: { full_name: string | null } | null };
type ReferralRow = { id: string; referrer_id: string; referred_user_id: string; created_at: string; referrer: { full_name: string | null } | null; referred: { full_name: string | null } | null };
type WithdrawalWithProfile = WithdrawalRequest & { profiles: { full_name: string | null } | null };

type Props = {
  refCodes: RefCode[];
  referrals: ReferralRow[];
  commissions: Commission[];
  withdrawals: WithdrawalWithProfile[];
};

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

const WD_STATUS_COLORS: Record<WithdrawalStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

export default function ReferralsAdminClient({ refCodes, referrals, commissions, withdrawals: initialWithdrawals }: Props) {
  const [tab, setTab] = useState<"codes" | "referrals" | "commissions" | "withdrawals">("withdrawals");
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [loading, setLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; note: string } | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const updateWithdrawal = async (id: string, status: WithdrawalStatus, note?: string) => {
    setLoading(id);
    const supabase = createClient();
    const update: Record<string, unknown> = { status };
    if (note !== undefined) update.note = note;
    const { error } = await supabase.from("withdrawal_requests").update(update).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status, note: note ?? w.note } : w));
      toast.success("Đã cập nhật");
    }
    setLoading(null);
    setNoteModal(null);
  };

  const tabs = [
    { key: "withdrawals", label: "Yêu cầu rút tiền" },
    { key: "commissions", label: "Hoa hồng" },
    { key: "referrals", label: "Referrals" },
    { key: "codes", label: "Mã giới thiệu" },
  ] as const;

  const totalCount = useMemo(() => {
    switch (tab) {
      case "withdrawals": return withdrawals.length;
      case "commissions": return commissions.length;
      case "referrals": return referrals.length;
      case "codes": return refCodes.length;
    }
  }, [tab, withdrawals, commissions, referrals, refCodes]);

  const filtered = useMemo((): (RefCode | ReferralRow | Commission | WithdrawalWithProfile)[] => {
    const needle = q.trim().toLowerCase();
    switch (tab) {
      case "withdrawals":
        return withdrawals.filter((w) => {
          if (statusFilter !== "all" && w.status !== statusFilter) return false;
          if (!needle) return true;
          return (
            (w.profiles?.full_name ?? "").toLowerCase().includes(needle) ||
            w.user_id.toLowerCase().includes(needle) ||
            (w.bank_code ?? "").toLowerCase().includes(needle) ||
            (w.account_number ?? "").toLowerCase().includes(needle) ||
            (w.account_name ?? "").toLowerCase().includes(needle)
          );
        });
      case "commissions":
        return commissions.filter((c) => {
          if (statusFilter !== "all" && c.status !== statusFilter) return false;
          if (!needle) return true;
          return c.referral_id.toLowerCase().includes(needle) || c.id.toLowerCase().includes(needle);
        });
      case "referrals":
        return referrals.filter((r) => {
          if (!needle) return true;
          return (
            (r.referrer?.full_name ?? "").toLowerCase().includes(needle) ||
            (r.referred?.full_name ?? "").toLowerCase().includes(needle) ||
            r.referrer_id.toLowerCase().includes(needle) ||
            r.referred_user_id.toLowerCase().includes(needle)
          );
        });
      case "codes":
        return refCodes.filter((r) => {
          if (!needle) return true;
          return (
            r.code.toLowerCase().includes(needle) ||
            (r.profiles?.full_name ?? "").toLowerCase().includes(needle) ||
            r.user_id.toLowerCase().includes(needle)
          );
        });
    }
  }, [tab, q, statusFilter, withdrawals, commissions, referrals, refCodes]);

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
  } = useAdminPagination(filtered, [tab, q, statusFilter]);

  const handleTabChange = (key: typeof tab) => {
    setTab(key);
    setQ("");
    setStatusFilter("all");
  };

  const emptyMessage = totalCount === 0
    ? (tab === "withdrawals" ? "Chưa có yêu cầu rút tiền" : tab === "commissions" ? "Chưa có hoa hồng" : tab === "referrals" ? "Chưa có referral" : "Chưa có mã giới thiệu")
    : "Không có kết quả phù hợp bộ lọc";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Referrals & Hoa hồng</h1>

      <div className="flex gap-2 border-b border-neutral-200 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => handleTabChange(t.key)} className={`whitespace-nowrap pb-2 px-3 text-sm font-medium ${tab === t.key ? "border-b-2 border-rose-500 text-rose-600" : "text-neutral-500 hover:text-neutral-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AdminListControls
        query={q}
        onQueryChange={setQ}
        placeholder={
          tab === "codes" ? "Tìm theo mã, tên user..." :
          tab === "referrals" ? "Tìm theo tên người giới thiệu / được giới thiệu..." :
          tab === "commissions" ? "Tìm theo referral ID..." :
          "Tìm theo user, ngân hàng..."
        }
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      >
        {(tab === "withdrawals" || tab === "commissions") && (
          <AdminFilterSelect value={statusFilter} onChange={setStatusFilter}>
            <option value="all">Tất cả trạng thái</option>
            {tab === "withdrawals" ? (
              <>
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="paid">paid</option>
                <option value="rejected">rejected</option>
              </>
            ) : (
              <>
                <option value="available">available</option>
                <option value="paid">paid</option>
                <option value="pending">pending</option>
              </>
            )}
          </AdminFilterSelect>
        )}
      </AdminListControls>

      {tab === "withdrawals" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Số tiền</th>
                  <th className="px-4 py-3 text-left">Ngân hàng</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(paginated as WithdrawalWithProfile[]).map((w) => (
                  <tr key={w.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">{w.profiles?.full_name || w.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{fmt(Number(w.amount))}</td>
                    <td className="px-4 py-3 text-xs text-neutral-600">
                      <p>{w.bank_code} — {w.account_number}</p>
                      <p className="text-neutral-400">{w.account_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${WD_STATUS_COLORS[w.status]}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(w.created_at).toLocaleDateString("vi-VN")}</td>
                    <td className="px-4 py-3">
                      {w.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateWithdrawal(w.id, "approved")} disabled={loading === w.id} className="rounded-lg bg-blue-500 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50">
                            Duyệt
                          </button>
                          <button onClick={() => setNoteModal({ id: w.id, note: "" })} disabled={loading === w.id} className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                            Từ chối
                          </button>
                        </div>
                      )}
                      {w.status === "approved" && (
                        <button onClick={() => updateWithdrawal(w.id, "paid")} disabled={loading === w.id} className="rounded-lg bg-emerald-500 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50">
                          Đã chuyển khoản
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-neutral-400">{emptyMessage}</td></tr>
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
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {tab === "commissions" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Referral ID</th>
                  <th className="px-4 py-3 text-left">Số tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(paginated as Commission[]).map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-mono text-xs">{c.referral_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-semibold text-rose-600">{fmt(Number(c.amount))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "available" ? "bg-emerald-100 text-emerald-700" : c.status === "paid" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(c.created_at).toLocaleDateString("vi-VN")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="py-12 text-center text-neutral-400">{emptyMessage}</td></tr>
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
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {tab === "referrals" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Người giới thiệu</th>
                  <th className="px-4 py-3 text-left">Người được giới thiệu</th>
                  <th className="px-4 py-3 text-left">Ngày</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(paginated as ReferralRow[]).map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">{r.referrer?.full_name || r.referrer_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{r.referred?.full_name || r.referred_user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(r.created_at).toLocaleDateString("vi-VN")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-neutral-400">{emptyMessage}</td></tr>
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
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {tab === "codes" && (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Mã</th>
                  <th className="px-4 py-3 text-left">Ngày tạo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {(paginated as RefCode[]).map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">{r.profiles?.full_name || r.user_id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-600">{r.code}</td>
                    <td className="px-4 py-3 text-xs text-neutral-500">{new Date(r.created_at).toLocaleDateString("vi-VN")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={3} className="py-12 text-center text-neutral-400">{emptyMessage}</td></tr>
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
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>
      )}

      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-bold">Lý do từ chối</h2>
            <textarea
              className="w-full rounded-lg border px-3 py-2 text-sm"
              rows={3}
              placeholder="Nhập lý do từ chối..."
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setNoteModal(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50">Hủy</button>
              <button onClick={() => updateWithdrawal(noteModal.id, "rejected", noteModal.note)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
