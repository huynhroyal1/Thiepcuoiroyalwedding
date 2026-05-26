"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gentleEase } from "@/components/motion/gentle";
import { createClient } from "@/lib/supabase/client";

const MEHAPPY_ASSET = "https://mehappy.vn";

const desktopInactive =
  "text-neutral-800 hover:bg-rose-50/90 hover:text-rose-600";
const desktopActive =
  "bg-rose-100 font-semibold text-rose-700 shadow-sm ring-1 ring-rose-200/70";

const mobileInactive = "text-neutral-800 hover:bg-rose-50/90 hover:text-rose-600";
const mobileActive = "bg-rose-100 font-semibold text-rose-700 ring-1 ring-rose-200/70";

export function MarketingNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setAuthUser(data.user);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  const displayLabel =
    authUser?.user_metadata?.full_name?.trim() ||
    authUser?.email?.split("@")[0] ||
    "Tài khoản";

  const isKho = pathname === "/kho-giao-dien" || pathname.startsWith("/kho-giao-dien/");
  const isBangGia = pathname === "/bang-gia" || pathname.startsWith("/bang-gia/");
  const isCouples = pathname === "/cac-cap-doi" || pathname.startsWith("/cac-cap-doi/");
  const isLienHe = pathname === "/lien-he" || pathname.startsWith("/lien-he/");

  const desktopClass = (active: boolean) =>
    clsx(
      "motion-soft rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? desktopActive : desktopInactive,
    );

  const mobileClass = (active: boolean) =>
    clsx("motion-soft rounded-lg px-2 py-2 text-left transition-colors", active ? mobileActive : mobileInactive);

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-rose-100/60 bg-white/95 backdrop-blur"
      initial={reduce ? { y: 0 } : { y: -6 }}
      animate={{ y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: [...gentleEase] }}
    >
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="motion-soft flex shrink-0 items-center gap-2 rounded-lg py-0.5 hover:bg-rose-50/80">
          <Image
            src="/images/logo-royal.png"
            alt="Royal Wedding"
            width={120}
            height={48}
            className="h-8 w-auto sm:h-10 md:h-12"
            priority
          />
          <span className="font-sans text-xl font-semibold text-neutral-900 sm:text-2xl">Royal Wedding</span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex" aria-label="Chính">
          <Link href="/" className={desktopClass(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
            Trang chủ
          </Link>
          <Link href="/kho-giao-dien" className={desktopClass(isKho)} aria-current={isKho ? "page" : undefined}>
            Mẫu thiệp
          </Link>
          <Link href="/cac-cap-doi" className={desktopClass(isCouples)} aria-current={isCouples ? "page" : undefined}>
            Các cặp đôi
          </Link>
          <Link href="/bang-gia" className={desktopClass(isBangGia)} aria-current={isBangGia ? "page" : undefined}>
            Bảng giá
          </Link>
          <Link href="/lien-he" className={desktopClass(isLienHe)} aria-current={isLienHe ? "page" : undefined}>
            Liên hệ
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {!authReady ? (
            <span className="hidden h-9 w-28 animate-pulse rounded-full bg-neutral-100 md:inline-block" />
          ) : authUser ? (
            <>
              <span
                className="motion-soft hidden max-w-[140px] truncate text-xs text-neutral-600 lg:inline"
                title={authUser.email ?? undefined}
              >
                Xin chào, <span className="font-medium text-neutral-800">{displayLabel}</span>
              </span>
              <Link
                href="/dashboard"
                className="motion-soft hidden items-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-rose-600 sm:text-sm md:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" strokeWidth={1.75} />
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void signOut()}
                className="motion-soft hidden rounded-full p-2 text-neutral-600 hover:bg-neutral-100 hover:text-rose-600 md:inline-flex"
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="motion-soft hidden rounded-full px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-rose-50 hover:text-rose-600 sm:text-sm md:inline-flex"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="motion-soft hidden rounded-full bg-rose-500 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-rose-600 sm:text-sm md:inline-flex"
              >
                Đăng ký
              </Link>
            </>
          )}
          <button
            type="button"
            className="motion-soft rounded-lg p-2 text-neutral-700 hover:bg-rose-50/80 hover:text-rose-600 lg:hidden active:scale-95"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="flex flex-col gap-1 border-t border-rose-100 px-4 py-4 lg:hidden"
            initial={reduce ? { y: 0 } : { y: -8 }}
            animate={{ y: 0 }}
            exit={reduce ? { y: 0 } : { y: -6 }}
            transition={{ duration: reduce ? 0 : 0.38, ease: [...gentleEase] }}
            aria-label="Menu di động"
          >
            <Link
              href="/"
              className={mobileClass(pathname === "/")}
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Trang chủ
            </Link>
            <Link
              href="/kho-giao-dien"
              className={mobileClass(isKho)}
              aria-current={isKho ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Mẫu thiệp
            </Link>
            <Link
              href="/cac-cap-doi"
              className={mobileClass(isCouples)}
              aria-current={isCouples ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Các cặp đôi
            </Link>
            <Link
              href="/bang-gia"
              className={mobileClass(isBangGia)}
              aria-current={isBangGia ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Bảng giá
            </Link>
            <Link
              href="/lien-he"
              className={mobileClass(isLienHe)}
              aria-current={isLienHe ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Liên hệ
            </Link>
            {authUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="motion-soft mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600"
                  onClick={() => setOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="motion-soft inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                  onClick={() => void signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="motion-soft mt-2 inline-flex justify-center rounded-full border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-50"
                  onClick={() => setOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="motion-soft inline-flex justify-center rounded-full bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600"
                  onClick={() => setOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
