"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Check, Crown, Sparkles, Star, Tag, X } from "lucide-react";
import clsx from "clsx";
import { faqMehappy } from "@/lib/data/mehappy-landing";
import { formatPlanPriceDisplay } from "@/lib/plans/format-plan-price";
import type { PlanPricesMap } from "@/lib/plans/get-plan-prices";
import { formatVnd } from "@/lib/utils";
import type { FaqItem } from "@/types";
import { MarketingMobileNav } from "@/components/landing/MarketingMobileNav";
import { PlanDetailModal } from "@/components/pricing/PlanDetailModal";
import type { PlanKey } from "@/lib/data/pricing-plan-features";

const DESIGN_EXTRA = {
  basic: "+ 168.000đ khi yêu cầu thiết kế hộ",
  pro: "+ 105.000đ khi yêu cầu thiết kế hộ",
  vip: "+ 160.000đ khi yêu cầu thiết kế hộ",
} as const;

const PLUS_PACKAGE_PRICE = {
  basic: "168.000đ",
  pro: "295.000đ",
  vip: "450.000đ",
} as const;

type Cell = "yes" | "no" | string;

const COMPARE_ROWS: { label: string; basic: Cell; pro: Cell; vip: Cell }[] = [
  { label: "Hỗ trợ mọi lúc mọi nơi", basic: "yes", pro: "yes", vip: "yes" },
  { label: "Chỉnh sửa không giới hạn trên website", basic: "yes", pro: "yes", vip: "yes" },
  { label: "Gửi mời và truy cập không giới hạn", basic: "yes", pro: "yes", vip: "yes" },
  { label: "Nhạc nền, hiệu ứng tim / tuyết / chuyển động", basic: "yes", pro: "yes", vip: "yes" },
  { label: "Số lượng ảnh cưới", basic: "10 ảnh", pro: "40 ảnh", vip: "100 ảnh" },
  { label: "Thời gian công khai thiệp", basic: "6 tháng", pro: "2 năm", vip: "Trọn đời" },
  { label: "Số thiệp có thể tạo", basic: "1", pro: "2", vip: "3" },
  { label: "Mã QR in thiệp giấy", basic: "yes", pro: "yes", vip: "yes" },
  { label: "Đếm ngược & Google Maps", basic: "yes", pro: "yes", vip: "yes" },
  { label: "RSVP & quản lý khách mời", basic: "no", pro: "yes", vip: "yes" },
  { label: "Giao diện VIP độc quyền", basic: "no", pro: "no", vip: "yes" },
  { label: "Tên miền riêng (Custom domain)", basic: "no", pro: "no", vip: "yes" },
];

function CellIcon({ v }: { v: Cell }) {
  if (v === "yes")
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  if (v === "no")
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
    );
  return <span className="text-xs font-medium text-neutral-800 sm:text-sm">{v}</span>;
}

type BangGiaProps = {
  faqItems?: FaqItem[];
  planPrices?: PlanPricesMap;
};

export function BangGiaClient({ faqItems = faqMehappy, planPrices }: BangGiaProps) {
  const [mobilePlan, setMobilePlan] = useState<PlanKey>("pro");
  const [comparePlus, setComparePlus] = useState(false);
  const [detailPlan, setDetailPlan] = useState<PlanKey | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openPlanDetail = useCallback((plan: PlanKey) => {
    setDetailPlan(plan);
    setDetailOpen(true);
  }, []);

  const prices = planPrices ?? {
    basic: { name: "Basic", price: 198_000, discount_percent: 49, description: "" },
    pro: { name: "Pro", price: 199_000, discount_percent: 49, description: "" },
    vip: { name: "VIP", price: 399_000, discount_percent: 52, description: "" },
  };

  const basicDisplay = formatPlanPriceDisplay(prices.basic);
  const proDisplay = formatPlanPriceDisplay(prices.pro);
  const vipDisplay = formatPlanPriceDisplay(prices.vip);

  const cards: Record<
    PlanKey,
    {
      title: string;
      badge?: string;
      badgeStyle?: string;
      discount?: string;
      listPrice: number | null;
      priceLabel: string;
      sub: string;
      features: string[];
      primaryCta: { label: string; className: string };
      secondary?: { label: string; onClick?: () => void; outline?: boolean; href?: string };
      tertiary?: { label: string; href?: string; outline?: boolean };
    }
  > = {
    basic: {
      title: "BASIC",
      badge: undefined,
      badgeStyle: undefined,
      discount: basicDisplay.discountPercent != null ? `-${basicDisplay.discountPercent}%` : undefined,
      listPrice: basicDisplay.listPrice,
      priceLabel: basicDisplay.label,
      sub: DESIGN_EXTRA.basic,
      features: [
        "Trình thiết kế thiệp cơ bản",
        "6 tháng công khai thiệp",
        "Số lượng ảnh cơ bản",
        "Các tính năng cơ bản",
        "Gửi mời không giới hạn",
      ],
      primaryCta: {
        label: "Xem chi tiết",
        className: "w-full rounded-xl border border-transparent py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100",
      },
      secondary: { label: "Mua lẻ tính năng", onClick: () => scrollTo("faq"), outline: true },
      tertiary: { label: "Yêu cầu thiết kế hộ", outline: true },
    },
    pro: {
      title: "PRO",
      badge: "Phổ biến",
      badgeStyle: "bg-blue-600 text-white",
      discount: proDisplay.discountPercent != null ? `-${proDisplay.discountPercent}%` : undefined,
      listPrice: proDisplay.listPrice,
      priceLabel: proDisplay.label,
      sub: DESIGN_EXTRA.pro,
      features: [
        "Trình thiết kế thiệp nâng cao",
        "2 năm công khai thiệp",
        "Số lượng ảnh nâng cao",
        "Các tính năng nâng cao",
        "Sử dụng thiệp gói PRO",
      ],
      primaryCta: {
        label: "Xem chi tiết",
        className: "w-full rounded-xl border border-transparent py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100",
      },
      secondary: { label: "Mua lẻ tính năng", onClick: () => scrollTo("faq"), outline: true },
      tertiary: { label: "Chọn gói này", outline: false },
    },
    vip: {
      title: "VIP",
      badge: "Tốt nhất",
      badgeStyle: "bg-amber-500 text-white",
      discount: vipDisplay.discountPercent != null ? `-${vipDisplay.discountPercent}%` : undefined,
      listPrice: vipDisplay.listPrice,
      priceLabel: vipDisplay.label,
      sub: DESIGN_EXTRA.vip,
      features: [
        "Trình thiết kế thiệp toàn diện",
        "Trọn đời công khai thiệp",
        "Số lượng ảnh tối đa",
        "Mở khóa tất cả các tính năng",
        "Sử dụng thiệp gói VIP",
      ],
      primaryCta: {
        label: "Xem chi tiết",
        className: "w-full rounded-xl border border-transparent py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100",
      },
      secondary: {
        label: "Thiết kế theo yêu cầu",
        outline: true,
        href: "mailto:mehappy.vnn@gmail.com?subject=Thiết kế thiệp VIP theo yêu cầu",
      },
      tertiary: { label: "Chọn gói này", outline: false },
    },
  };

  function PricingCard({ plan }: { plan: PlanKey }) {
    const c = cards[plan];
    const isPro = plan === "pro";
    const isVip = plan === "vip";
    return (
      <div
        className={clsx(
          "flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition sm:p-6",
          isPro && "border-blue-400 ring-2 ring-blue-200 md:scale-[1.02]",
          isVip && "border-amber-200/80 bg-gradient-to-b from-amber-50/40 to-white",
          !isPro && !isVip && "border-neutral-200",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {c.badge && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                c.badgeStyle,
              )}
            >
              <Star className="h-3 w-3 fill-current opacity-90" aria-hidden />
              {c.badge}
            </span>
          )}
          {c.discount && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 ring-1 ring-rose-100">
              <Tag className="h-3 w-3" aria-hidden />
              {c.discount}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start gap-2">
          <h3 className="text-xl font-extrabold tracking-tight text-neutral-900">{c.title}</h3>
          {isVip && <Crown className="mt-0.5 h-6 w-6 text-amber-500" aria-hidden />}
        </div>
        <p className="mt-1 text-sm text-neutral-600">
          {plan === "basic" && "Dành cho thông báo đơn giản"}
          {plan === "pro" && "Phù hợp cho hầu hết các cặp đôi"}
          {plan === "vip" && "Trải nghiệm cao cấp hoàn chỉnh"}
        </p>
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <div className="flex flex-wrap items-baseline gap-2">
            {c.listPrice != null && (
              <span className="text-lg text-neutral-400 line-through">{formatVnd(c.listPrice)}</span>
            )}
            <span className="text-2xl font-bold text-neutral-900">{c.priceLabel}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">{c.sub}</p>
        </div>
        <ul className="mt-4 flex flex-1 flex-col gap-2.5 text-sm text-neutral-700">
          {c.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={() => openPlanDetail(plan)} className={c.primaryCta.className}>
            {c.primaryCta.label}
          </button>
          {c.secondary &&
            (c.secondary.href ? (
              <a
                href={c.secondary.href}
                className="block w-full rounded-xl border border-neutral-300 py-2.5 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {c.secondary.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={c.secondary.onClick}
                className="w-full rounded-xl border border-neutral-300 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {c.secondary.label}
              </button>
            ))}
          {c.tertiary && (
            <>
              {c.tertiary.outline !== false ? (
                <a
                  href="mailto:mehappy.vnn@gmail.com?subject=Yêu cầu thiết kế hộ thiệp cưới"
                  className="block w-full rounded-xl border border-neutral-300 py-2.5 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  {c.tertiary.label}
                </a>
              ) : (
                <Link
                  href="/register"
                  className={clsx(
                    "block w-full rounded-xl py-3 text-center text-sm font-semibold text-white shadow-sm transition",
                    isPro && "bg-blue-600 hover:bg-blue-700",
                    isVip && "bg-[#e7bb06] hover:bg-[#d4ab05]",
                  )}
                >
                  {c.tertiary.label}
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <MarketingMobileNav />

      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-50/40 pt-6 md:pt-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(244,63,94,0.12),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 text-center md:py-16 md:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">Bảng giá</p>
          <h1 className="mt-3 font-sans text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:max-w-xl">
            Lựa chọn gói cưới hoàn hảo
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 md:mx-0">
            Từ thông báo đơn giản đến trải nghiệm đám cưới cao cấp, chúng tôi có gói phù hợp cho ngày đặc biệt của bạn.
          </p>
          <button
            type="button"
            onClick={() => scrollTo("pricing-cards")}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-rose-600"
          >
            Xem gói phù hợp
          </button>
        </div>
      </section>

      <div id="pricing-cards" className="scroll-mt-28 border-t border-rose-100/60 bg-neutral-50/80 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Chọn gói phù hợp với nhu cầu</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-600">
              Chọn gói phù hợp và thanh toán an toàn qua PayOS.
            </p>
          </div>

          <div className="mt-8 hidden gap-6 md:grid md:grid-cols-3">
            <PricingCard plan="basic" />
            <PricingCard plan="pro" />
            <PricingCard plan="vip" />
          </div>

          <div className="mt-8 md:hidden">
            <div className="grid grid-cols-3 gap-2">
              {(["basic", "pro", "vip"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setMobilePlan(p)}
                  className={clsx(
                    "min-h-[5.5rem] rounded-xl border px-1 py-2 text-center text-xs font-semibold transition",
                    mobilePlan === p
                      ? p === "pro"
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : p === "vip"
                          ? "border-amber-300 bg-amber-50 text-amber-900"
                          : "border-neutral-400 bg-neutral-100 text-neutral-900"
                      : "border-neutral-200 bg-white text-neutral-600",
                  )}
                >
                  <span className="block">{cards[p].title}</span>
                  <span className="mt-1 block text-[11px] font-normal opacity-90">{cards[p].priceLabel}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-neutral-500">Chạm từng gói để xem chi tiết bên dưới.</p>
            <div className="mt-4">
              <PricingCard plan={mobilePlan} />
            </div>
          </div>
        </div>
      </div>

      <section className="border-y border-neutral-100 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <p className="font-semibold text-neutral-900">Mã giảm giá công khai</p>
              <p className="mt-1 text-sm text-neutral-600">Chọn mã phù hợp và áp dụng nhanh ở bước thanh toán.</p>
            </div>
            <p className="mt-4 text-sm text-neutral-500 md:mt-0">Hiện chưa có mã giảm giá công khai.</p>
          </div>
        </div>
      </section>

      <section id="details" className="scroll-mt-28 border-t border-rose-100/40 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-neutral-900">So sánh tính năng chi tiết</h2>
            <p className="mt-2 text-sm text-neutral-600">Xem nhanh sự khác biệt giữa các gói{comparePlus ? " (kèm gói thiết kế hộ Plus)" : ""}.</p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 md:justify-start">
            <button
              type="button"
              onClick={() => setComparePlus(false)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                !comparePlus ? "bg-rose-500 text-white shadow" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
              )}
            >
              Gói thường
            </button>
            <button
              type="button"
              onClick={() => setComparePlus(true)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                comparePlus ? "bg-blue-600 text-white shadow" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
              )}
            >
              Gói Plus
              <span className="ml-1 text-xs opacity-90">(thiết kế hộ)</span>
            </button>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  <th className="sticky left-0 z-10 min-w-[10rem] bg-neutral-50 px-3 py-3 font-semibold text-neutral-800">
                    Tính năng
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-neutral-800">
                    Basic
                    <div className="mt-1 text-xs font-normal text-neutral-500">{comparePlus ? PLUS_PACKAGE_PRICE.basic : basicDisplay.label}</div>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-neutral-800">
                    Pro
                    <div className="mt-1 text-xs font-normal text-neutral-500">
                      {comparePlus ? PLUS_PACKAGE_PRICE.pro : proDisplay.label}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold text-neutral-800">
                    VIP
                    <div className="mt-1 text-xs font-normal text-neutral-500">
                      {comparePlus ? PLUS_PACKAGE_PRICE.vip : vipDisplay.label}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100 bg-rose-50/30">
                  <td className="sticky left-0 z-10 bg-rose-50 px-3 py-2.5 text-xs text-neutral-700 md:text-sm">
                    meHappy thiết kế và cài đặt thiệp từ A–Z
                  </td>
                  <td className="px-3 py-2.5 text-center">{comparePlus ? <CellIcon v="yes" /> : <CellIcon v="no" />}</td>
                  <td className="px-3 py-2.5 text-center">{comparePlus ? <CellIcon v="yes" /> : <CellIcon v="no" />}</td>
                  <td className="px-3 py-2.5 text-center">{comparePlus ? <CellIcon v="yes" /> : <CellIcon v="no" />}</td>
                </tr>
                {COMPARE_ROWS.map((row, idx) => (
                  <tr key={row.label} className="border-b border-neutral-100">
                    <td
                      className={clsx(
                        "sticky left-0 z-10 px-3 py-2.5 text-xs text-neutral-800 md:text-sm",
                        idx % 2 === 0 ? "bg-white" : "bg-neutral-50",
                      )}
                    >
                      {row.label}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <CellIcon v={row.basic} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <CellIcon v={row.pro} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <CellIcon v={row.vip} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 rounded-xl border border-amber-100 bg-amber-50/60 p-4 text-sm leading-relaxed text-neutral-700">
            <span className="font-semibold text-amber-900">Lưu ý:</span> Hiện tại chúng tôi chưa có chính sách hoàn tiền và hủy dịch vụ các gói; nếu bạn gặp lỗi hoặc nhầm lẫn khi thanh toán, hãy liên hệ để được hỗ trợ. Các tính năng trong gói không quy đổi tiền để khấu trừ hoặc đổi sang gói khác.
          </p>
        </div>
      </section>

      <section className="border-y border-rose-100 bg-gradient-to-r from-violet-50 via-white to-rose-50/80 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center md:text-left">
          <div className="md:flex md:items-end md:justify-between md:gap-8">
            <div className="max-w-xl">
              <p className="text-lg font-bold text-neutral-900 sm:text-xl">
                Trở thành Đối tác hoặc Nhà thiết kế của meWedding
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Tham gia cộng đồng sáng tạo và kiếm tiền bằng cách chia sẻ thiết kế hoặc giới thiệu khách hàng đến nền tảng.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-0 md:shrink-0">
              <a
                href="mailto:mehappy.vnn@gmail.com?subject=Đăng ký Đại lý meWedding"
                className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-purple-700"
              >
                Đăng ký Đại lý
              </a>
              <a
                href="mailto:mehappy.vnn@gmail.com?subject=Đăng ký Nhà sáng tạo meWedding"
                className="inline-flex items-center justify-center rounded-xl bg-rose-400 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-rose-500"
              >
                Đăng ký Nhà sáng tạo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 bg-[#faf7f8] py-14">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-5 w-5 text-rose-500" aria-hidden />
            <h2 className="text-2xl font-bold text-neutral-900">Những câu hỏi thường gặp</h2>
          </div>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-neutral-600">
            Giải đáp những câu hỏi thường gặp nhất về việc sử dụng MeHappy.
          </p>
          <div className="mt-8 space-y-2">
            {faqItems.map((item, i) => (
              <details
                key={item.q}
                className="group rounded-xl border border-neutral-200 bg-white open:border-rose-200 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-neutral-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="mr-2 font-bold text-rose-500">{i + 1}.</span>
                    {item.q}
                  </span>
                  <span className="text-neutral-400 transition group-open:rotate-180">▼</span>
                </summary>
                <p className="border-t border-rose-50 px-4 pb-4 pt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-rose-100 py-8 text-center">
        <Link href="/register" className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline">
          Đăng ký và chọn gói ngay →
        </Link>
      </div>

      <PlanDetailModal
        plan={detailPlan}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailPlan(null);
        }}
        onBuyFeatures={() => scrollTo("faq")}
      />
    </div>
  );
}
