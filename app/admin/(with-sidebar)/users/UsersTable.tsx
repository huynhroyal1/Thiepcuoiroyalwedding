"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { AdminFilterSelect, AdminListControls } from "@/components/admin/AdminListControls";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { useAdminPagination } from "@/lib/admin/useAdminPagination";
import type { UserRole, Plan, CardStatus } from "@/types";

type CardInfo = {
  id: string;
  plan: Plan;
  status: CardStatus;
  slug: string;
  bride_name: string;
  groom_name: string;
};

export type UserRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  email: string;
  wedding_cards: CardInfo[];
};

const PLAN_COLORS: Record<Plan, string> = {
  basic: "bg-gray-100 text-gray-700",
  pro: "bg-blue-100 text-blue-700",
  vip: "bg-purple-100 text-purple-700",
};

const ROLE_COLORS: Record<UserRole, string> = {
  user: "bg-gray-100 text-gray-600",
  admin: "bg-red-100 text-red-700",
};

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ActionDropdown<T extends string>({
  label,
  options,
  onSelect,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  onSelect: (v: T) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-2.5 py-1.5 rounded-md bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium disabled:opacity-50 transition-colors"
      >
        {label}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[110px]">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function UsersTable({ initialRows }: { initialRows: UserRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter !== "all" && row.role !== roleFilter) return false;
      if (!needle) return true;
      return (
        (row.full_name ?? "").toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle) ||
        (row.phone ?? "").includes(needle)
      );
    });
  }, [rows, q, roleFilter]);

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
  } = useAdminPagination(filtered, [q, roleFilter]);

  const patchUser = async (payload: {
    userId?: string;
    role?: UserRole;
    cardId?: string;
    plan?: Plan;
  }) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json() as { error?: string };
      throw new Error(data.error ?? "Unknown error");
    }
  };

  const handleRoleChange = (userId: string, role: UserRole) => {
    startTransition(async () => {
      try {
        await patchUser({ userId, role });
        setRows((prev) =>
          prev.map((r) => (r.id === userId ? { ...r, role } : r))
        );
        toast.success("Đã cập nhật role");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Lỗi cập nhật role");
      }
    });
  };

  const handlePlanChange = (userId: string, cardId: string, plan: Plan) => {
    startTransition(async () => {
      try {
        await patchUser({ userId, cardId, plan });
        setRows((prev) =>
          prev.map((r) =>
            r.id === userId
              ? {
                  ...r,
                  wedding_cards: r.wedding_cards.map((c) =>
                    c.id === cardId ? { ...c, plan } : c
                  ),
                }
              : r
          )
        );
        toast.success("Đã cập nhật plan");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Lỗi cập nhật plan");
      }
    });
  };

  return (
    <div className="space-y-4">
      <AdminListControls
        query={q}
        onQueryChange={setQ}
        placeholder="Tìm theo tên, email, SĐT..."
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      >
        <AdminFilterSelect value={roleFilter} onChange={(v) => setRoleFilter(v as "all" | UserRole)}>
          <option value="all">Tất cả role</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </AdminFilterSelect>
      </AdminListControls>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600 w-10">#</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Người dùng</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Plan (thiệp mới nhất)</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600">Thiệp</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Đăng ký</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.map((row, idx) => {
              const latestCard = row.wedding_cards[0] ?? null;
              const rowNum = rangeStart + idx;
              return (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{rowNum}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials(row.full_name)}
                      </div>
                      <span className="font-medium text-gray-900 truncate max-w-[140px]">
                        {row.full_name ?? <span className="text-gray-400 italic">—</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 truncate max-w-[180px]">
                    {row.email || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[row.role]}`}
                    >
                      {row.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {latestCard ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[latestCard.plan]}`}
                      >
                        {latestCard.plan}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 font-medium">
                    {row.wedding_cards.length}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <ActionDropdown<UserRole>
                        label="Đổi role"
                        disabled={pending}
                        options={[
                          { value: "user", label: "user" },
                          { value: "admin", label: "admin" },
                        ]}
                        onSelect={(role) => handleRoleChange(row.id, role)}
                      />
                      {latestCard && (
                        <ActionDropdown<Plan>
                          label="Đổi plan"
                          disabled={pending}
                          options={[
                            { value: "basic", label: "Basic" },
                            { value: "pro", label: "Pro" },
                            { value: "vip", label: "VIP" },
                          ]}
                          onSelect={(plan) =>
                            handlePlanChange(row.id, latestCard.id, plan)
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            {rows.length === 0 ? "Chưa có người dùng nào." : "Không có kết quả phù hợp bộ lọc."}
          </div>
        )}
      </div>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        filteredCount={filteredCount}
        totalCount={rows.length}
        onPageChange={setPage}
      />
      </div>
    </div>
  );
}
