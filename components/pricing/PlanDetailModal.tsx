"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import clsx from "clsx";
import type { PlanConfigMap } from "@/lib/plans/plan-config-shared";
import type { PlanKey } from "@/lib/data/pricing-plan-features";

function formatPublicMonths(months: number | null): string {
  if (months === null) return "Trọn đời";
  if (months >= 12) {
    const years = months / 12;
    return years === 1 ? "1 năm" : `${years} năm`;
  }
  return `${months} tháng`;
}

type ModalRow = {
  label: string;
  basic: string;
  pro: string;
  vip: string;
};

const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
  basic: "BASIC",
  pro: "PRO",
  vip: "VIP",
};

function buildFeatureRows(cfg: PlanConfigMap): ModalRow[] {
  return [
    {
      label: "Royal Wedding sẽ thiết kế thiệp, cài đặt thiệp cho bạn từ A–Z",
      basic: "no",
      pro: "no",
      vip: "no",
    },
    { label: "Hỗ trợ mọi lúc mọi nơi", basic: "yes", pro: "yes", vip: "yes" },
    {
      label: "Chỉnh sửa không giới hạn số lần hay thời gian trên website Royal Wedding",
      basic: "yes",
      pro: "yes",
      vip: "yes",
    },
    { label: "Gửi mời và truy cập không giới hạn", basic: "yes", pro: "yes", vip: "yes" },
    {
      label: "Các tính năng cơ bản (nhạc nền, hiệu ứng tim / tuyết / chuyển động)",
      basic: "yes",
      pro: "yes",
      vip: "yes",
    },
    { label: "Quản lý kế hoạch cưới, ngân sách cưới", basic: "yes", pro: "yes", vip: "yes" },
    {
      label: 'Thông tin các "Sự kiện cưới", thời gian, địa điểm, timeline',
      basic: "yes",
      pro: "yes",
      vip: "yes",
    },
    { label: "Thông tin về cô dâu chú rể", basic: "yes", pro: "yes", vip: "yes" },
    { label: '"Song thân phụ mẫu", tư gia địa chỉ 2 nhà', basic: "yes", pro: "yes", vip: "yes" },
    { label: "Hộp mừng cưới (thông tin chuyển khoản, QR Code)", basic: "yes", pro: "yes", vip: "yes" },
    {
      label: "Số lượng ảnh cưới",
      basic: `${cfg.basic.max_photos} ảnh cưới`,
      pro: `${cfg.pro.max_photos} ảnh cưới`,
      vip: `${cfg.vip.max_photos} ảnh cưới`,
    },
    {
      label: "Thời gian công khai thiệp cưới",
      basic: formatPublicMonths(cfg.basic.public_months),
      pro: formatPublicMonths(cfg.pro.public_months),
      vip: formatPublicMonths(cfg.vip.public_months),
    },
    {
      label: "Số lượng thiệp có thể tạo",
      basic: `${cfg.basic.max_cards} thiệp`,
      pro: `${cfg.pro.max_cards} thiệp`,
      vip: `${cfg.vip.max_cards} thiệp`,
    },
    { label: "Tạo mã QR cho thiệp cưới (in thiệp giấy, gửi bạn bè)", basic: "yes", pro: "yes", vip: "yes" },
    {
      label: 'Tính năng "Đếm ngược thời gian" đến sự kiện cưới',
      basic: "yes",
      pro: "yes",
      vip: "yes",
    },
    { label: "Google Maps chỉ dẫn đến nơi diễn ra sự kiện cưới", basic: "yes", pro: "yes", vip: "yes" },
    { label: "Tuỳ chỉnh hiệu ứng hiển thị tim, tuyết, hoa rơi", basic: "no", pro: "yes", vip: "yes" },
    { label: "Loại bỏ quảng cáo trên website Royal Wedding", basic: "no", pro: "yes", vip: "yes" },
    {
      label: "Thống kê thiệp (lượt truy cập, khách mời, lời chúc, …)",
      basic: "no",
      pro: "yes",
      vip: "yes",
    },
    { label: "Tuỳ chỉnh màu sắc, font chữ cho thiệp cưới", basic: "no", pro: "yes", vip: "yes" },
    {
      label: "Tuỳ chỉnh thay đổi, sắp xếp các mục, thiết kế giữa các mẫu",
      basic: "no",
      pro: "yes",
      vip: "yes",
    },
    { label: "Tuỳ chọn hiệu ứng mở thiệp", basic: "no", pro: "yes", vip: "yes" },
    { label: "Tính năng Photobook online", basic: "no", pro: "yes", vip: "yes" },
    { label: "Cài mật khẩu cho thiệp cưới", basic: "no", pro: "yes", vip: "yes" },
    {
      label: "Thiết lập thông báo cho người xem thiệp (popup trên thiệp)",
      basic: "no",
      pro: "yes",
      vip: "yes",
    },
    { label: "Thay đổi giao diện thiệp khác", basic: "no", pro: "yes", vip: "yes" },
    {
      label: "Gửi lời chúc mừng cưới và quản lý, phản hồi lời chúc",
      basic: "no",
      pro: "yes",
      vip: "yes",
    },
    {
      label: "Tải xuống danh sách lời chúc (danh sách khách mời cho VIP)",
      basic: "no",
      pro: "yes",
      vip: "yes",
    },
    { label: "Tải lên video, video cưới, video khác", basic: "no", pro: "yes", vip: "yes" },
    { label: "Xác nhận tham dự và quản lý khách mời dự tiệc", basic: "no", pro: "yes", vip: "yes" },
    { label: "Tải lên font chữ yêu thích", basic: "no", pro: "no", vip: "yes" },
    { label: "Tải lên bài hát yêu thích", basic: "no", pro: "no", vip: "yes" },
    { label: "Tải lên hiệu ứng yêu thích", basic: "no", pro: "no", vip: "yes" },
    {
      label: 'Sử dụng "Giao diện VIP" thiết kế tỉ mỉ, đặc biệt dành riêng gói VIP',
      basic: "no",
      pro: "no",
      vip: "yes",
    },
    {
      label:
        "Tạo và gửi thiệp mời online cho từng khách (ghi tên cá nhân hoá, không giới hạn)",
      basic: "Được dùng thử 3 khách mời",
      pro: "Được dùng thử 3 khách mời",
      vip: "yes",
    },
    {
      label: "Thiệp mời báo cưới (Save the Date) + ghi tên từng khách mời",
      basic: "Được dùng thử 3 khách mời",
      pro: "Được dùng thử 3 khách mời",
      vip: "yes",
    },
    {
      label: "Ghi tên khách mời VIP (kèm hình ảnh cá nhân hoá khách mời)",
      basic: "Được dùng thử 3 khách mời",
      pro: "Được dùng thử 3 khách mời",
      vip: "yes",
    },
    {
      label: "Thiệp mời hiển thị bên trong thiệp chính + hiện tên khách mời",
      basic: "no",
      pro: "no",
      vip: "yes",
    },
    {
      label: 'Tính năng "Đếm số thời gian đã cưới" sau khi kết thúc đám cưới',
      basic: "no",
      pro: "no",
      vip: "yes",
    },
    { label: "Tính năng nhắc lịch hẹn đến ngày cưới", basic: "no", pro: "no", vip: "yes" },
    { label: "Tính năng gửi mail nhắc ngày cưới", basic: "no", pro: "no", vip: "yes" },
    { label: "Tạo logo riêng cho đám cưới", basic: "no", pro: "no", vip: "yes" },
    { label: "Loại bỏ logo Royal Wedding", basic: "no", pro: "no", vip: "yes" },
    { label: "Tích hợp tên miền riêng (Custom Domain)", basic: "no", pro: "no", vip: "yes" },
    { label: "Yêu cầu toàn quyền (Admin)", basic: "no", pro: "no", vip: "yes" },
    { label: "Tuỳ chỉnh mã QR code", basic: "no", pro: "no", vip: "yes" },
    { label: "Tặng thiệp thôi nôi, thiệp sinh nhật gói PRO miễn phí", basic: "no", pro: "no", vip: "no" },
    {
      label: "Tặng video cưới Chibi, animation vui nhộn, trình chiếu tại sự kiện",
      basic: "no",
      pro: "no",
      vip: "no",
    },
  ];
}

type Cell = "yes" | "no" | string;

function FeatureStatus({ value }: { value: Cell }) {
  if (value === "yes") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  return (
    <span className="max-w-[9.5rem] text-right text-xs font-medium leading-snug text-neutral-800 sm:max-w-none sm:text-sm">
      {value}
    </span>
  );
}

type Props = {
  plan: PlanKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuyFeatures?: () => void;
  planConfig: PlanConfigMap;
};

export function PlanDetailModal({ plan, open, onOpenChange, onBuyFeatures, planConfig }: Props) {
  if (!plan) return null;

  const title = PLAN_DISPLAY_NAMES[plan];
  const showUpgrade = plan !== "vip";
  const featureRows = buildFeatureRows(planConfig);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px]" />
        <Dialog.Content
          className={clsx(
            "fixed left-1/2 top-1/2 z-[101] flex max-h-[min(92vh,880px)] w-[min(100%,42rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl outline-none sm:max-w-3xl",
          )}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4 sm:px-6">
            <Dialog.Title className="text-xl font-bold text-neutral-900">Chi tiết gói {title}</Dialog.Title>
            <Dialog.Description className="sr-only">
              Danh sách tính năng và trạng thái của gói {title}
            </Dialog.Description>
            <Dialog.Close
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
              aria-label="Đóng"
            >
              ×
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">
            <div className="sticky top-0 z-10 -mx-5 border-b border-neutral-200 bg-white/95 px-5 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6">
              <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-wide text-neutral-500 sm:text-sm">
                <span>Tính năng</span>
                <span>Trạng thái</span>
              </div>
            </div>
            <ul className="divide-y divide-neutral-100">
              {featureRows.map((row) => (
                <li key={row.label} className="flex items-start justify-between gap-4 py-3.5 first:pt-2">
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-neutral-800 sm:text-[15px]">{row.label}</p>
                  <div className="flex shrink-0 items-center justify-end">
                    <FeatureStatus value={row[plan]} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <footer className="shrink-0 border-t border-neutral-200 bg-neutral-50/90 px-5 py-4 sm:px-6">
            <p className="text-center text-xs leading-relaxed text-neutral-600 sm:text-left">
              Thêm dịch vụ thiết kế hộ hoặc nâng cấp lên gói cao hơn
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onBuyFeatures?.();
                }}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-purple-700 sm:text-sm"
              >
                Mua thêm tính năng
              </button>
              {showUpgrade ? (
                <Link
                  href="/register"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600 sm:text-sm"
                >
                  Nâng cấp gói thiệp
                </Link>
              ) : (
                <Link
                  href="/register"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-[#e7bb06] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#d4ab05] sm:text-sm"
                >
                  Chọn gói VIP
                </Link>
              )}
            </div>
            <Dialog.Close
              type="button"
              className="mt-3 w-full rounded-lg border border-neutral-300 bg-white py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              Đóng
            </Dialog.Close>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
