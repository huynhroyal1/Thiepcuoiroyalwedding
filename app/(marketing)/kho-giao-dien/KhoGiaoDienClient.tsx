"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, ChevronLeft, ChevronRight, Crown, Filter, Search, Sparkles, Star } from "lucide-react";
import clsx from "clsx";
import type { TemplateRow } from "@/types";
import { faqMehappy } from "@/lib/data/mehappy-landing";
import { MarketingMobileNav } from "@/components/landing/MarketingMobileNav";
import type { FaqItem } from "@/types";
import { canOpenTemplateLivePreview, templatePreviewHref } from "@/lib/marketing/template-preview-url";

type Props = { templates: TemplateRow[]; faqItems?: FaqItem[] };

const PAGE_SIZE = 12;

type PlanFilter = "all" | "basic" | "pro" | "vip";
type SortKey = "newest" | "oldest" | "name-asc";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Mới nhất",
  oldest: "Cũ nhất",
  "name-asc": "Tên A–Z",
};

function planUi(plan: string) {
  if (plan === "vip")
    return {
      label: "VIP",
      wrap: "bg-gradient-to-r from-amber-600 to-amber-500 text-amber-50 shadow",
      icon: <Crown className="h-2.5 w-2.5 shrink-0 text-amber-100" aria-hidden />,
    };
  if (plan === "basic")
    return {
      label: "BASIC",
      wrap: "bg-neutral-700 text-[10px] font-bold uppercase tracking-wide text-white",
      icon: null,
    };
  return {
    label: "PRO",
    wrap: "bg-sky-600 text-[10px] font-bold text-sky-50 shadow-sm",
    icon: <Star className="h-2.5 w-2.5 shrink-0 fill-sky-100 text-sky-200" aria-hidden />,
  };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** preview_url trỏ thiệp live (/thiep/...) hoặc mẫu có content_json */
function isLiveInvitationPreview(t: TemplateRow) {
  return canOpenTemplateLivePreview(t);
}

export function KhoGiaoDienClient({ templates, faqItems = faqMehappy }: Props) {
  const [plan, setPlan] = useState<PlanFilter>("all");
  const [tag, setTag] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<TemplateRow | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const tags = useMemo(() => {
    const s = new Set<string>();
    templates.forEach((t) => (t.style_tags ?? []).forEach((x) => s.add(x)));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "vi"));
  }, [templates]);

  const filtered = useMemo(() => {
    const needle = normalize(q.trim());
    let list = templates.filter((t) => {
      if (plan !== "all" && t.plan_required !== plan) return false;
      if (tag && !(t.style_tags ?? []).includes(tag)) return false;
      if (!needle) return true;
      const hay = [
        t.name,
        t.description ?? "",
        t.id,
        ...(t.style_tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return normalize(hay).includes(needle);
    });

    list = [...list].sort((a, b) => {
      if (sort === "newest") return (b.sort_order ?? 0) - (a.sort_order ?? 0);
      if (sort === "oldest") return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      return a.name.localeCompare(b.name, "vi");
    });
    return list;
  }, [templates, plan, tag, q, sort]);

  useEffect(() => {
    setPage(1);
  }, [plan, tag, q, sort]);

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

  const tierBtn = (active: boolean) =>
    clsx(
      "rounded-full px-4 py-2 text-sm font-medium transition",
      active
        ? "bg-rose-500 text-white shadow-md shadow-rose-900/15 hover:bg-rose-600"
        : "border border-neutral-200 bg-white text-neutral-700 hover:border-rose-200 hover:bg-rose-50/80",
    );

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-b from-rose-50/50 via-white to-neutral-50/90 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <MarketingMobileNav />

      {/* Hero */}
      <section className="border-b border-rose-100/60 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/20">
        <div className="mx-auto max-w-6xl px-4 py-10 text-center md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Wedding 5.0
          </div>
          <h1 className="mt-4 font-sans text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
            Thư Viện Mẫu Thiệp Cưới
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
            Chọn mẫu thiệp phù hợp nhất để làm cho đám cưới của bạn trở nên đặc biệt và đáng nhớ.
          </p>
        </div>
      </section>

      {/* Desktop toolbar */}
      <div className="hidden border-b border-rose-100/80 bg-white/95 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="relative min-w-[200px] flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm theo phong cách, màu sắc, tên, mã…"
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none ring-rose-500/20 transition focus:border-rose-300 focus:ring-2"
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-neutral-800 outline-none ring-rose-500/20 focus:border-rose-300 focus:ring-2"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  Sắp xếp: {SORT_LABELS[k]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          </div>
          <div className="relative min-w-[160px]">
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-neutral-200 bg-white py-2.5 pl-4 pr-10 text-sm text-neutral-800 outline-none ring-rose-500/20 focus:border-rose-300 focus:ring-2"
            >
              <option value="">Tất cả Tags</option>
              {tags.map((tg) => (
                <option key={tg} value={tg}>
                  {tg}
                </option>
              ))}
            </select>
            <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Mobile search + filter toggle */}
      <div className="border-b border-rose-100/80 bg-white/95 px-4 py-3 md:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm mẫu…"
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-4 pr-10 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-500/20"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-sm font-medium text-neutral-800 hover:bg-rose-50/80"
          >
            <Filter className="h-4 w-4" />
            Bộ lọc
          </button>
          {mobileFiltersOpen && (
            <div className="flex flex-col gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3">
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tất cả Tags</option>
                {tags.map((tg) => (
                  <option key={tg} value={tg}>
                    {tg}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    Sắp xếp: {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Tất cả"],
                ["basic", "Basic"],
                ["pro", "Pro"],
                ["vip", "VIP"],
              ] as const
            ).map(([key, label]) => (
              <button key={key} type="button" className={tierBtn(plan === key)} onClick={() => setPlan(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop tier + count */}
      <div className="hidden border-b border-neutral-100 bg-white/80 md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Tất cả"],
                ["basic", "Basic"],
                ["pro", "Pro"],
                ["vip", "VIP"],
              ] as const
            ).map(([key, label]) => (
              <button key={key} type="button" className={tierBtn(plan === key)} onClick={() => setPlan(key)}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-neutral-600">
            Hiển thị{" "}
            <span className="font-semibold text-neutral-900">
              {slice.length === 0 ? 0 : (activePage - 1) * PAGE_SIZE + 1}–
              {(activePage - 1) * PAGE_SIZE + slice.length}
            </span>{" "}
            trong <span className="font-semibold text-neutral-900">{total}</span> mẫu
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        <p className="text-center text-sm font-medium text-neutral-700 md:text-left">
          {total} mẫu được tìm thấy
        </p>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((t, idx) => {
            const img = t.thumbnail_url ?? t.preview_url;
            const ui = planUi(t.plan_required);
            const globalIndex = (activePage - 1) * PAGE_SIZE + idx;
            const showHot = globalIndex === 0 && t.plan_required === "vip";

            return (
              <article
                key={t.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200/60 hover:shadow-lg"
              >
                <div className="relative aspect-[9/16] max-h-[22rem] w-full shrink-0 overflow-hidden bg-neutral-100">
                  {img ? (
                    <Image src={img} alt={t.name} fill className="object-cover object-top" sizes="(max-width:768px) 100vw, 360px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-rose-100 via-rose-50 to-white">
                      <span className="font-serif text-xl font-semibold text-rose-400/90">Royal Wedding</span>
                    </div>
                  )}
                  <div className={clsx("absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-0.5", ui.wrap)}>
                    {ui.icon}
                    <span className="text-[10px] font-bold leading-none">{ui.label}</span>
                  </div>
                  {showHot && (
                    <span className="absolute right-2 top-2 z-10 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">
                      HOT
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="line-clamp-1 text-base font-semibold text-neutral-900">{t.name}</h2>
                  <p className="line-clamp-2 text-sm text-neutral-600">{t.description ?? " "}</p>
                  <div className="flex flex-wrap gap-1">
                    {(t.style_tags ?? []).slice(0, 2).map((x) => (
                      <span key={x} className="line-clamp-1 max-w-full rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800 ring-1 ring-rose-100">
                        {x}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex gap-2 pt-1">
                    {isLiveInvitationPreview(t) ? (
                      <Link
                        href={templatePreviewHref(t)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-center text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Xem thiệp
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPreview(t)}
                        className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-center text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                      >
                        Xem thiệp
                      </button>
                    )}
                    <Link
                      href="/register"
                      className="flex-1 rounded-xl bg-rose-500 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600"
                    >
                      Chọn thiệp
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {total === 0 && (
          <p className="py-16 text-center text-sm text-neutral-500">Không có mẫu phù hợp. Thử đổi bộ lọc hoặc từ khóa.</p>
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

      {/* Partner CTA */}
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

      {/* FAQ */}
      <section id="faq-kho" className="bg-white py-14">
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

      <Dialog.Root open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[min(440px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xl">
            <Dialog.Title className="pr-8 text-lg font-semibold text-neutral-900">{preview?.name}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-neutral-600">
              {preview?.description ?? "Xem trước mẫu thiệp."}
            </Dialog.Description>
            <div className="relative mt-4 aspect-[9/16] w-full overflow-hidden rounded-xl bg-neutral-100">
              {preview && (preview.thumbnail_url || preview.preview_url) ? (
                <Image
                  src={(preview.thumbnail_url ?? preview.preview_url)!}
                  alt={preview.name}
                  fill
                  className="object-cover object-top"
                  sizes="400px"
                />
              ) : (
                <div className="flex h-full min-h-[240px] items-center justify-center bg-gradient-to-b from-rose-100 to-white text-sm text-neutral-500">
                  Chưa có ảnh xem trước — hãy chọn mẫu và tùy chỉnh sau khi đăng ký.
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Dialog.Close className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                Đóng
              </Dialog.Close>
              <Link
                href="/register"
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-rose-600"
              >
                Chọn thiệp
              </Link>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
