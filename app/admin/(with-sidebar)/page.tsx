import Link from "next/link";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  CreditCard,
  Gift,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

export const metadata = { title: "Admin Dashboard" };

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
}

export default async function AdminPage() {
  const serviceClient = createServiceRoleClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalUsers },
    { count: totalCards },
    { data: revenueData },
    { count: pendingOrders },
    { count: pendingWithdrawals },
  ] = await Promise.all([
    serviceClient.from("profiles").select("*", { count: "exact", head: true }),
    serviceClient.from("wedding_cards").select("*", { count: "exact", head: true }),
    serviceClient
      .from("orders")
      .select("amount")
      .eq("status", "paid")
      .gte("paid_at", startOfMonth),
    serviceClient.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
    serviceClient.from("withdrawal_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const monthlyRevenue = (revenueData ?? []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const stats = [
    { label: "Tổng người dùng", value: String(totalUsers ?? 0), icon: Users, color: "bg-blue-50 text-blue-600", href: "/admin/users" },
    { label: "Wedding Cards", value: String(totalCards ?? 0), icon: CreditCard, color: "bg-rose-50 text-rose-600", href: "/admin/cards" },
    { label: "Doanh thu tháng", value: fmt(monthlyRevenue), icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", href: "/admin/orders" },
    { label: "Đơn hàng chờ", value: String(pendingOrders ?? 0), icon: ShoppingCart, color: "bg-amber-50 text-amber-600", href: "/admin/orders" },
    { label: "Yêu cầu rút tiền", value: String(pendingWithdrawals ?? 0), icon: Gift, color: "bg-purple-50 text-purple-600", href: "/admin/referrals" },
  ];

  const quickLinks = [
    { label: "Quản lý Users", href: "/admin/users" },
    { label: "Wedding Cards", href: "/admin/cards" },
    { label: "Templates", href: "/admin/templates" },
    { label: "Feature Catalog", href: "/admin/features" },
    { label: "Đơn hàng", href: "/admin/orders" },
    { label: "Video Catalog", href: "/admin/video-catalog" },
    { label: "Referrals", href: "/admin/referrals" },
    { label: "Sản phẩm", href: "/admin/products" },
    { label: "Cài đặt website", href: "/admin/settings" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Tổng quan hệ thống Royal Wedding</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className={`mb-3 inline-flex rounded-xl p-2.5 ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-neutral-900">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Quản trị nhanh
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              {l.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
