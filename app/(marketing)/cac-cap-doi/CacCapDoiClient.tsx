"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import clsx from "clsx";
import { faqMehappy, MEHAPPY_ASSET } from "@/lib/data/mehappy-landing";
import { MarketingMobileNav } from "@/components/landing/MarketingMobileNav";
import type { CoupleShowcaseItem } from "@/lib/marketing/types";
import type { FaqItem } from "@/types";

type Props = { couples: CoupleShowcaseItem[]; faqItems?: FaqItem[] };

function InvitationLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

const PAGE_SIZE = 12;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function CacCapDoiClient({ couples, faqItems = faqMehappy }: Props) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    if (!needle) return couples;
    return couples.filter((c) => {
      const hay = normalize(`${c.title} ${c.meta} ${c.date}`);
      return hay.includes(needle);
    });
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activePage = Math.min(Math.max(1, page), pageCount);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const slice = useMemo(() => {
    const start = (activePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, activePage]);

  const heroBg = `${MEHAPPY_ASSET}/images/bg-wedding-template.png`;
  const heroBgMb = `${MEHAPPY_ASSET}/images/bg-wedding-template-mb.png`;

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <MarketingMobileNav />

      {/* Desktop hero */}
      <div className="relative hidden min-h-[14rem] w-full overflow-hidden md:block md:min-h-[16rem]">
        <Image
          src={heroBg}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent" />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col justify-center px-4 py-12 md:min-h-[16rem] md:py-16">
          <span className="inline-flex w-fit rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-600 shadow-sm">
            Cộng đồng Royal Wedding
          </span>
          <h1 className="mt-4 max-w-xl font-sans text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Thư Viện Thiệp Cưới
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-700 sm:text-base">
            Khám phá những thiệp cưới tuyệt đẹp được tạo bởi cộng đồng người dùng Royal Wedding.
          </p>
        </div>
      </div>

      {/* Mobile hero */}
      <div className="relative min-h-[12rem] w-full overflow-hidden md:hidden">
        <Image src={heroBgMb} alt="" fill className="object-cover object-center" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <div className="relative z-10 flex min-h-[12rem] flex-col justify-end px-4 pb-8 pt-16">
          <span className="inline-flex w-fit rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            Cộng đồng Royal Wedding
          </span>
          <h1 className="mt-3 font-sans text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
            Thư Viện Thiệp Cưới
          </h1>
          <p className="mt-2 max-w-md text-sm text-white/95 drop-shadow">Khám phá thiệp cưới từ cộng đồng</p>
        </div>
      </div>

      {/* Desktop search */}
      <div className="hidden border-b border-neutral-100 bg-white py-4 md:block">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative max-w-2xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm theo tên cô dâu, chú rể, địa điểm…"
              className="w-full rounded-xl border border-neutral-200 py-3 pl-4 pr-11 text-sm outline-none ring-rose-500/20 focus:border-rose-300 focus:ring-2"
            />
            <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="border-b border-neutral-100 bg-white px-4 py-3 md:hidden">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm thiệp cưới..."
            className="w-full rounded-xl border border-neutral-200 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-500/20"
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        </div>
      </div>

      <div className="border-b border-neutral-50 bg-neutral-50/80 py-3">
        <div className="mx-auto max-w-6xl px-4 text-center md:text-left">
          <p className="text-sm text-neutral-600">
            Hiển thị <span className="font-semibold text-neutral-900">{slice.length}</span> trong{" "}
            <span className="font-semibold text-neutral-900">{total}</span> thiệp cưới
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((c) => (
            <article
              key={c.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200/50 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-neutral-100">
                <Image src={c.image} alt={c.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" />
                <span className="absolute left-2 top-2 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                  Thiệp cưới
                </span>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                  <InvitationLink
                    href={c.invitationUrl}
                    className="rounded-xl border border-white/80 bg-white/95 px-4 py-2 text-sm font-semibold text-neutral-800 shadow hover:bg-white"
                  >
                    Xem thiệp
                  </InvitationLink>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="line-clamp-2 font-semibold text-neutral-900">{c.title}</p>
                <div className="flex flex-col gap-2 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
                    <span>{c.date}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
                    <span className="line-clamp-2 leading-snug">{c.meta}</span>
                  </div>
                </div>
                <InvitationLink
                  href={c.invitationUrl}
                  className="mt-auto flex w-full items-center justify-center rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
                >
                  Xem thiệp
                </InvitationLink>
              </div>
            </article>
          ))}
        </div>

        {total === 0 && (
          <p className="py-16 text-center text-sm text-neutral-500">
            {q.trim()
              ? "Không tìm thấy thiệp phù hợp."
              : "Chưa có thiệp cưới nào được chia sẻ trên trang cộng đồng. Các cặp đôi có thể bật tùy chọn này trong Cài đặt thiệp sau khi công khai thiệp."}
          </p>
        )}

        {pageCount > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Trang trước"
              disabled={activePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-neutral-200 p-2 text-neutral-700 transition hover:bg-rose-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={clsx(
                  "min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition",
                  n === activePage
                    ? "bg-rose-500 text-white shadow"
                    : "border border-neutral-200 text-neutral-700 hover:bg-rose-50",
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              aria-label="Trang sau"
              disabled={activePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className="rounded-lg border border-neutral-200 p-2 text-neutral-700 transition hover:bg-rose-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <section className="border-y border-rose-100 bg-gradient-to-r from-violet-50 via-white to-rose-50/80 py-12">
        <div className="mx-auto max-w-6xl px-4 text-center md:text-left">
          <div className="md:flex md:items-end md:justify-between md:gap-8">
            <div className="max-w-xl">
              <p className="text-lg font-bold text-neutral-900 sm:text-xl">
                Trở thành Đối tác hoặc Nhà thiết kế của Royal Wedding
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Tham gia cộng đồng sáng tạo của chúng tôi và kiếm tiền bằng cách chia sẻ các thiết kế đẹp mắt của bạn hoặc
                giới thiệu khách hàng đến nền tảng của chúng tôi.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-0 md:shrink-0">
              <a
                href="mailto:mehappy.vnn@gmail.com?subject=Đăng ký Đại lý Royal Wedding"
                className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-purple-700"
              >
                Đăng ký Đại lý
              </a>
              <a
                href="mailto:mehappy.vnn@gmail.com?subject=Đăng ký Nhà sáng tạo Royal Wedding"
                className="inline-flex items-center justify-center rounded-xl bg-rose-400 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-rose-500"
              >
                Đăng ký Nhà sáng tạo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-[#faf7f8] py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold text-neutral-900">Những câu hỏi thường gặp</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-neutral-600">
            Giải đáp những câu hỏi thường gặp nhất về việc sử dụng Royal Wedding.
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
                  <ChevronDown className="h-5 w-5 shrink-0 text-neutral-400 transition group-open:rotate-180" />
                </summary>
                <p className="border-t border-rose-50 px-4 pb-4 pt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-rose-100 bg-white py-8 text-center">
        <Link href="/register" className="text-sm font-semibold text-rose-600 hover:text-rose-700 hover:underline">
          Tạo thiệp cưới của riêng bạn →
        </Link>
      </div>
    </div>
  );
}
