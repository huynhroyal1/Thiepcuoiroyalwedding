"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { TemplateRow } from "@/types";
import { gentleEase, gentleDuration } from "@/components/motion/gentle";
import { CarouselThree } from "@/components/landing/CarouselThree";

const FILTERS = ["Tất cả", "Luxury", "Tối giản", "Hàn Quốc", "Vintage", "Tự nhiên"] as const;

type Props = { templates: TemplateRow[] };

function planBadge(plan: string) {
  if (plan === "basic") return { label: "BASIC", className: "bg-neutral-500/90 text-white" };
  if (plan === "vip") return { label: "VIP", className: "bg-amber-500/95 text-white ring-1 ring-amber-200/80" };
  return { label: "PRO", className: "bg-rose-600/95 text-white" };
}

export function TemplateGrid({ templates }: Props) {
  const [tab, setTab] = useState<(typeof FILTERS)[number]>("Tất cả");
  const reduce = useReducedMotion();

  const filtered = useMemo(() => {
    if (tab === "Tất cả") return templates;
    return templates.filter((t) => (t.style_tags ?? []).some((tag) => tag.toLowerCase().includes(tab.toLowerCase())));
  }, [templates, tab]);

  const cards = useMemo(
    () =>
      filtered.map((t, i) => {
        const badge = planBadge(t.plan_required);
        const vipFrame = t.plan_required === "vip";
        const img = t.thumbnail_url ?? t.preview_url;
        return (
            <motion.div
            key={t.id}
            className={`group/card flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm motion-soft hover:-translate-y-1 hover:shadow-xl ${
              vipFrame ? "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-white" : "border border-neutral-100 hover:border-mewedding-rose/25"
            }`}
            initial={reduce ? { y: 0 } : { y: 18 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, amount: 0.05, margin: "0px 0px 100px 0px" }}
            transition={{
              duration: reduce ? 0 : gentleDuration,
              ease: [...gentleEase],
              delay: reduce ? 0 : i * 0.05,
            }}
          >
            <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-neutral-100 sm:aspect-[9/16] sm:max-h-[22rem] lg:max-h-64">
              {img ? (
                <Image
                  src={img}
                  alt={t.name}
                  fill
                  className="object-cover object-center sm:object-top"
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 320px"
                />
              ) : (
                <div className="absolute inset-0 z-0 bg-gradient-to-b from-rose-100 via-rose-50 to-white transition-transform duration-500 ease-out group-hover/card:scale-110" />
              )}
              {!img && (
                <div className="relative z-10 flex h-full min-h-[12rem] items-center justify-center">
                  <span className="font-serif text-2xl font-semibold text-mewedding-rose/90 drop-shadow-sm">Wedding</span>
                </div>
              )}
              <div
                className={`absolute left-2 top-2 z-20 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.className}`}
              >
                {badge.label}
              </div>
              {(i === 0 || i === 2) && (
                <div className="absolute right-2 top-2 z-20 rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm">
                  {i === 0 ? "Hot" : "New"}
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 z-[15] bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />
              <div className="absolute inset-0 z-[16] flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
                <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-neutral-900 shadow-md">Xem mẫu</span>
              </div>
            </div>
            <div className="relative z-[1] flex flex-1 flex-col border-t border-rose-50/80 bg-white p-4">
              <h3 className="line-clamp-2 font-semibold leading-snug text-neutral-900">{t.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{t.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(t.style_tags ?? []).slice(0, 3).map((x) => (
                  <span key={x} className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                    {x}
                  </span>
                ))}
              </div>
              <Link
                href="/register"
                className="motion-soft mt-auto flex w-full items-center justify-center rounded-xl bg-mewedding-rose py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#9d4f5d] hover:shadow-md active:scale-[0.99]"
              >
                Sử dụng mẫu
              </Link>
            </div>
          </motion.div>
        );
      }),
    [filtered, reduce],
  );

  return (
    <section id="kho-mau-home" className="bg-white py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-mewedding-rose">Kho giao diện</p>
        <h2 className="mt-2 text-center font-sans text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
          Các mẫu thiệp cưới đẹp
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-neutral-600">
          Chọn mẫu phù hợp phong cách của hai bạn — chỉnh sửa trực quan, chia sẻ chỉ với một link 💕
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTab(f)}
              className={`motion-soft rounded-full px-3 py-1 text-xs font-medium ring-offset-2 active:scale-[0.97] ${
                tab === f
                  ? "bg-mewedding-rose text-white shadow-sm ring-2 ring-rose-200/60 hover:bg-[#9d4f5d]"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/90 hover:ring-2 hover:ring-rose-100/80"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative mt-10 w-full min-w-0 overflow-hidden">
          <CarouselThree
            autoMs={3000}
            slideKeys={filtered.map((t) => t.id)}
            className="template-home-carousel"
          >
            {cards}
          </CarouselThree>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/kho-giao-dien"
            className="motion-soft inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm hover:border-mewedding-rose/40 hover:bg-rose-50/90 hover:text-mewedding-rose"
          >
            Xem tất cả các mẫu thiệp
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
