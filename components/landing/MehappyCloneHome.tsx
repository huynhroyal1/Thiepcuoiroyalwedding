import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  Crown,
  Heart,
  Home,
  LayoutGrid,
  PenLine,
  Phone,
  Share2,
  Sparkles,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { CarouselThree } from "@/components/landing/CarouselThree";
import { TypingText } from "@/components/landing/TypingText";
import { featureBlocks, MEHAPPY_ASSET, stepsBlock, whyChooseItems } from "@/lib/data/mehappy-landing";
import type { CoupleShowcaseItem, TemplateShowcaseItem } from "@/lib/marketing/types";
import type { FaqItem } from "@/types";

const roseBtn =
  "inline-flex items-center justify-center rounded-full bg-rose-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-rose-900/10 transition hover:bg-rose-600 active:scale-[0.99] disabled:opacity-50";
const outlineBtn =
  "inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-transparent px-5 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50";
const outlinePill =
  "inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-8 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50";

function TierRibbon({ tier }: { tier: "basic" | "pro" | "vip" }) {
  if (tier === "vip") {
    return (
      <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-50 shadow">
        <Crown className="h-3 w-3 text-amber-100" aria-hidden />
        VIP
      </div>
    );
  }
  if (tier === "pro") {
    return (
      <div className="absolute left-2 top-2 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Pro
      </div>
    );
  }
  return (
    <div className="absolute left-2 top-2 rounded-md bg-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      Basic
    </div>
  );
}

type Props = {
  showcaseTemplates: TemplateShowcaseItem[];
  couplesPreview: CoupleShowcaseItem[];
  faqItems: FaqItem[];
};

export function MehappyCloneHome({ showcaseTemplates, couplesPreview, faqItems }: Props) {
  const whyIcons = [Heart, Share2, LayoutGrid, LayoutGrid, Wallet, Calendar] as const;

  return (
    <div className="min-h-screen overflow-x-hidden pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-50/90 via-white to-amber-50/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/40 via-transparent to-transparent" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:flex-row lg:items-center lg:gap-8 lg:py-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-600 shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden />
              MỜI CƯỚI THỜI 5.0
            </div>
            <h1 className="mt-4 font-sans text-3xl font-extrabold uppercase tracking-tight text-neutral-900 sm:text-4xl lg:text-[2.75rem] leading-[1.22] sm:leading-[1.2]">
              <span className="block pb-0.5">TẠO THIỆP CƯỚI</span>
              <span className="mt-2 block text-rose-500 sm:mt-2.5">ĐIỆN TỬ</span>
            </h1>
            <p className="mt-4 text-lg font-bold uppercase tracking-wide text-rose-500 sm:text-xl">CHẤT LƯỢNG CAO</p>
            <TypingText
              texts={[
                "Cho Đám Cưới của bạn trở nên Độc Đáo và Đáng Nhớ hơn ♥",
                "Một link thiệp online — gửi trọn yêu thương tới mọi người.",
                "RSVP, album ảnh, nhạc nền… gói gọn trong một trang đẹp.",
              ]}
              className="mx-auto mt-3 min-h-[3.25rem] max-w-lg text-sm text-neutral-600 sm:min-h-[3.5rem] sm:text-base lg:mx-0"
              speedMs={44}
              pauseAfterFullMs={2800}
            />
            <div className="mt-8 flex w-full justify-center lg:justify-start">
              <Link href="/register" className={`${roseBtn} w-full sm:w-auto`}>
                <span className="inline-flex items-center gap-2">
                  Tạo Thiệp Ngay
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-lg flex-1 items-end justify-center gap-3 pt-4 lg:mx-0 lg:justify-end">
            <div className="relative z-10 w-[min(100%,420px)]">
              <div className="relative rounded-2xl border border-white/80 bg-white/90 p-2 shadow-xl shadow-rose-200/40">
                <Image
                  src="/images/mac2-original.png"
                  alt="Wedding preview"
                  width={800}
                  height={500}
                  className="h-auto w-full rounded-xl object-contain"
                  sizes="(max-width: 1024px) 100vw, 420px"
                  priority
                />
              </div>
              <p className="mt-2 text-center text-xs text-neutral-500 sm:text-sm">Website Đám Cưới - Thiệp cưới Online</p>
            </div>
            <div className="absolute -bottom-2 right-0 z-20 w-[min(38%,140px)] sm:w-[150px]">
              <div className="rounded-[1.75rem] border-[8px] border-neutral-900 bg-neutral-900 shadow-2xl">
                <Image
                  src="/images/phone2-original.png"
                  alt="Wedding mobile preview"
                  width={280}
                  height={560}
                  className="h-auto w-full rounded-[1.25rem] object-cover"
                  sizes="150px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kho giao diện — carousel ngang */}
      <div id="card-id" className="border-t border-rose-100/60 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">KHO GIAO DIỆN</p>
            <h2 className="mt-2 font-sans text-2xl font-bold text-neutral-900 sm:text-3xl">Các Mẫu Thiệp Cưới Đẹp</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600">
              Bắt đầu Đám Cưới của bạn với 1 chiếc Thiệp Cưới thật đẹp ngay nhé ♥
            </p>
          </div>

          <div className="relative mt-10 w-full min-w-0">
            <CarouselThree autoMs={3000} slideKeys={showcaseTemplates.map((t) => t.id)}>
              {showcaseTemplates.map((t) => (
                <div
                  key={t.id}
                  className="card-hover flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-[3/4] max-h-72 shrink-0 overflow-hidden bg-neutral-100">
                    <Image src={t.image} alt={t.title} fill className="object-cover" sizes="300px" />
                    <TierRibbon tier={t.tier} />
                    {t.hot && (
                      <span className="absolute right-2 top-2 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        HOT
                      </span>
                    )}
                    {t.newHot && !t.hot && (
                      <span className="absolute right-2 top-2 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        NEW/HOT
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition hover:opacity-100">
                      <Link href={t.previewHref} className={outlineBtn}>
                        Xem nhanh
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col space-y-2 p-4">
                    <p className="line-clamp-1 font-semibold text-neutral-900">{t.title}</p>
                    <p className="line-clamp-2 flex-1 text-xs text-neutral-600">{t.desc}</p>
                    {t.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <Link
                      href={`/register?template=${encodeURIComponent(t.id)}`}
                      className={`${roseBtn} mt-auto w-full text-center`}
                    >
                      Sử dụng mẫu
                    </Link>
                  </div>
                </div>
              ))}
            </CarouselThree>
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/kho-giao-dien" className={outlinePill}>
              <span className="inline-flex items-center gap-2">
                Xem tất cả các mẫu Thiệp
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tính năng */}
      <div id="features" className="bg-[#faf7f8] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">TÍNH NĂNG NỔI BẬT</p>
            <h2 className="mx-auto mt-2 max-w-3xl font-sans text-2xl font-bold leading-snug text-neutral-900 sm:text-3xl">
              Trải nghiệm những tính năng <br className="hidden sm:block" />
              <span className="text-rose-500">chỉ có trên Thiệp Cưới Điện Tử</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-600">
              Không giống như những chiếc thiệp giấy cổ điển, Thiệp Cưới Điện Tử mang đến những tính năng hữu ích, giúp Dâu
              Rể chia sẻ, quản lý và chuẩn bị cho đám cưới một cách trọn vẹn nhất.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {featureBlocks.map((block) => (
              <div
                key={block.key}
                className="card-hover flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm"
              >
                <div className="relative h-48 w-full shrink-0 bg-neutral-100 sm:h-52">
                  <Image src={block.image} alt={block.title} fill className="object-cover object-top" sizes="(max-width:1024px) 100vw, 50vw" />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-neutral-900 sm:text-xl">{block.title}</h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-neutral-700">
                    {block.bullets.map((line) => (
                      <li key={line} className="flex gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" strokeWidth={2.5} aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/kho-giao-dien" className={roseBtn}>
              Chọn Mẫu Thiệp Ngay
            </Link>
          </div>
        </div>
      </div>

      {/* 4 bước */}
      <div className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-sans text-2xl font-bold text-neutral-900 sm:text-3xl">{stepsBlock.title}</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              {stepsBlock.steps.map((s) => (
                <div key={s.n} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white">
                    {s.n}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{s.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-md rounded-3xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-6 shadow-inner">
                <Image
                  src={stepsBlock.image}
                  alt="Wedding Steps"
                  width={640}
                  height={480}
                  className="mx-auto h-auto w-full max-w-sm object-contain"
                />
              </div>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/register" className={roseBtn}>
              Bắt Đầu Tạo Thiệp
            </Link>
          </div>
        </div>
      </div>

      {/* Các cặp đôi */}
      <div id="cac-cap-doi" className="scroll-mt-24 border-t border-rose-100/60 bg-neutral-50 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">CÁC CẶP ĐÔI</p>
            <h2 className="mt-2 font-sans text-2xl font-bold text-neutral-900 sm:text-3xl">Thiệp Cưới Của Các Cặp Đôi</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600">
              Cùng xem những thiệp cưới xinh đẹp từ cộng đồng và lấy cảm hứng cho đám cưới của bạn ♥
            </p>
          </div>
          <div className="mt-10 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {couplesPreview.map((c) => (
              <div
                key={c.id}
                className="card-hover flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm"
              >
                <div className="relative h-[200px] w-full shrink-0 overflow-hidden bg-neutral-100 sm:h-[212px] lg:h-[220px]">
                  <Image src={c.image} alt={c.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                  <span className="absolute left-2 top-2 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Thiệp cưới
                  </span>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition hover:opacity-100">
                    <Link href={c.invitationUrl} className={outlineBtn}>
                      Xem thiệp
                    </Link>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 min-h-[2.5rem] font-semibold leading-snug text-neutral-900">{c.title}</p>
                  <div className="flex min-h-[3.25rem] flex-col gap-1.5 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span>{c.date}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="line-clamp-2 leading-snug">{c.meta}</span>
                    </div>
                  </div>
                  <Link
                    href={c.invitationUrl}
                    className={`${roseBtn} mt-auto w-full justify-center text-center`}
                  >
                    Xem thiệp
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/cac-cap-doi" className={outlinePill}>
              <span className="inline-flex items-center gap-2">
                Xem tất cả thiệp cưới
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tại sao */}
      <div className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-sans text-2xl font-bold leading-snug text-neutral-900 sm:text-3xl">
            Tại sao nên lựa chọn <br className="sm:hidden" />
            <span className="text-rose-500">Thiệp Cưới Điện Tử</span>
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyChooseItems.map((item, i) => {
              const Icon = whyIcons[i] ?? Heart;
              return (
                <div
                  key={item.title}
                  className="card-hover flex gap-4 rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/bang-gia" className={outlineBtn.replace("rounded-xl", "rounded-full px-8")}>
              Xem Bảng Giá Chi Tiết
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-rose-100/60 bg-[#faf7f8] py-14">
        <div className="mx-auto max-w-3xl px-4">
          <h3 className="text-center text-2xl font-bold text-neutral-900">Những câu hỏi thường gặp</h3>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Giải đáp những câu hỏi thường gặp nhất về việc sử dụng Royal Wedding.
          </p>
          <div className="mt-8 space-y-3">
            {faqItems.map((item, idx) => (
              <details
                key={item.q}
                className="faq-details group rounded-xl border border-neutral-200 bg-white open:border-rose-200 open:shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-neutral-900 marker:content-none [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="mr-2 font-bold text-rose-500">{idx + 1}.</span>
                    {item.q}
                  </span>
                  <ChevronDown className="faq-chevron h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
                </summary>
                <p className="border-t border-rose-50 px-4 pb-4 pt-3 text-sm leading-relaxed text-neutral-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA cuối */}
      <div className="border-t border-rose-100 bg-gradient-to-r from-rose-50 to-white py-10">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <Link href="/register" className={roseBtn}>
            Tạo Thiệp Cưới Ngay
          </Link>
        </div>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-rose-100 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden"
        aria-label="Điều hướng nhanh"
      >
        <div className="grid grid-cols-5 gap-0 px-1 py-2 text-[10px] text-neutral-600">
          <Link href="/" className="flex flex-col items-center gap-1 py-1 text-rose-500">
            <Home className="h-5 w-5" aria-hidden />
            <span>Home</span>
          </Link>
          <Link href="/cac-cap-doi" className="flex flex-col items-center gap-1 py-1 hover:text-rose-600">
            <Users className="h-5 w-5" aria-hidden />
            <span>Cặp đôi</span>
          </Link>
          <Link href="/register" className="flex flex-col items-center gap-1 py-1">
            <span className="-mt-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg">
              <PenLine className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-medium text-rose-600">Tạo</span>
          </Link>
          <Link href="/bang-gia" className="flex flex-col items-center gap-1 py-1">
            <Tag className="h-5 w-5" aria-hidden />
            <span>Giá</span>
          </Link>
          <Link href="/lien-he" className="flex flex-col items-center gap-1 py-1">
            <Phone className="h-5 w-5" aria-hidden />
            <span>Liên hệ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
