"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Home, PenLine, Phone, Tag, User, Users } from "lucide-react";
import clsx from "clsx";
import { MEHAPPY_ASSET } from "@/lib/data/mehappy-landing";

const rosePill =
  "inline-flex items-center justify-center rounded-full bg-rose-500 px-5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-rose-600 sm:text-sm";

const authOutlinePill =
  "inline-flex items-center justify-center rounded-full border border-neutral-300/90 bg-white/80 px-4 py-2 text-xs font-medium text-neutral-800 shadow-sm transition hover:bg-white sm:text-sm";

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth={0}
      viewBox="0 0 48 48"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

function AuthHeaderActions({ authMode }: { authMode: "login" | "register" }) {
  if (authMode === "login") {
    return (
      <>
        <button
          type="button"
          className="rounded-full p-2 text-neutral-600 transition hover:bg-white/70 hover:text-rose-600"
          aria-label="Tài khoản"
        >
          <User className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <span className={clsx(rosePill, "pointer-events-none cursor-default opacity-90")} aria-current="page">
          Đăng nhập
        </span>
      </>
    );
  }
  return (
    <>
      <button
        type="button"
        className="rounded-full p-2 text-neutral-600 transition hover:bg-white/70 hover:text-rose-600"
        aria-label="Tài khoản"
      >
        <User className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <Link href="/login" className={authOutlinePill}>
        Đăng nhập
      </Link>
      <span className={clsx(rosePill, "pointer-events-none cursor-default opacity-90")} aria-current="page">
        Đăng ký
      </span>
    </>
  );
}

function AuthHeaderActionsMobile({ authMode }: { authMode: "login" | "register" }) {
  if (authMode === "login") {
    return (
      <>
        <button
          type="button"
          className="rounded-full p-2 text-neutral-600 hover:bg-white/70"
          aria-label="Tài khoản"
        >
          <User className="h-4 w-4" strokeWidth={1.75} />
        </button>
        <span className={clsx(rosePill, "px-4 py-2 text-sm opacity-90")} aria-current="page">
          Đăng nhập
        </span>
      </>
    );
  }
  return (
    <div className="flex max-w-[55%] flex-wrap items-center justify-end gap-1">
      <button
        type="button"
        className="rounded-full p-2 text-neutral-600 hover:bg-white/70"
        aria-label="Tài khoản"
      >
        <User className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <Link href="/login" className={clsx(authOutlinePill, "px-3 py-1.5 text-xs")}>
        Đăng nhập
      </Link>
      <span className={clsx(rosePill, "px-3 py-1.5 text-xs opacity-90")} aria-current="page">
        Đăng ký
      </span>
    </div>
  );
}

export function AuthMehappyShell({
  authMode,
  children,
}: {
  authMode: "login" | "register";
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div
      className="relative flex min-h-screen flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${MEHAPPY_ASSET}/images/bg.png")` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/50 via-white/30 to-white/60" />

      <header className="relative z-10 hidden border-b border-white/30 bg-white/45 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/images/logo-royal.png"
              alt="Royal Wedding"
              width={120}
              height={48}
              className="h-8 w-auto sm:h-10 md:h-12"
              priority
            />
            <span className="font-sans text-[20px] font-semibold text-neutral-900 sm:text-2xl">Royal Wedding</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center justify-center gap-1 lg:gap-2" aria-label="Chính">
            <Link
              href="/"
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white/60 hover:text-rose-600",
                pathname === "/" && "bg-white/70 font-semibold text-rose-700",
              )}
            >
              Trang chủ
            </Link>
            <Link
              href="/kho-giao-dien"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white/60 hover:text-rose-600"
            >
              Mẫu thiệp
            </Link>
            <Link
              href="/cac-cap-doi"
              className={clsx(
                "rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white/60 hover:text-rose-600",
                pathname === "/cac-cap-doi" && "bg-white/70 font-semibold text-rose-700",
              )}
            >
              Các cặp đôi
            </Link>
            <Link
              href="/bang-gia"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white/60 hover:text-rose-600"
            >
              Bảng giá
            </Link>
            <Link
              href="/lien-he"
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-800 transition hover:bg-white/60 hover:text-rose-600"
            >
              Liên hệ
            </Link>
          </nav>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <AuthHeaderActions authMode={authMode} />
          </div>
        </div>
      </header>

      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-white/30 bg-white/50 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2">
          <Image
            src="/images/logo-royal.png"
            alt="Royal Wedding"
            width={96}
            height={40}
            className="h-8 w-auto"
            priority
          />
          <span className="truncate text-[20px] font-semibold text-neutral-900">Royal Wedding</span>
        </Link>
        <AuthHeaderActionsMobile authMode={authMode} />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-10">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-rose-100 bg-white/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur md:hidden"
        aria-label="Điều hướng nhanh"
      >
        <div className="grid grid-cols-5 gap-0 px-1 py-2 text-[10px] text-neutral-600">
          <Link
            href="/"
            className={clsx(
              "flex flex-col items-center gap-1 py-1 hover:text-rose-600",
              pathname === "/" && "font-medium text-rose-600",
            )}
          >
            <Home className="h-5 w-5" aria-hidden />
            <span>Home</span>
          </Link>
          <Link
            href="/cac-cap-doi"
            className={clsx(
              "flex flex-col items-center gap-1 py-1 hover:text-rose-600",
              pathname === "/cac-cap-doi" && "font-medium text-rose-600",
            )}
          >
            <Users className="h-5 w-5" aria-hidden />
            <span>Cặp đôi</span>
          </Link>
          <Link
            href="/register"
            className={clsx("flex flex-col items-center gap-1 py-1", pathname === "/register" && "text-rose-600")}
          >
            <span
              className={clsx(
                "-mt-3 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg",
                pathname === "/register" ? "bg-rose-600 ring-2 ring-rose-300" : "bg-rose-500",
              )}
            >
              <PenLine className="h-5 w-5" aria-hidden />
            </span>
            <span className={clsx("font-medium", pathname === "/register" ? "text-rose-700" : "text-rose-600")}>
              Tạo
            </span>
          </Link>
          <Link
            href="/bang-gia"
            className={clsx(
              "flex flex-col items-center gap-1 py-1 hover:text-rose-600",
              pathname === "/bang-gia" && "font-medium text-rose-600",
            )}
          >
            <Tag className="h-5 w-5" aria-hidden />
            <span>Giá</span>
          </Link>
          <Link
            href="/lien-he"
            className={clsx(
              "flex flex-col items-center gap-1 py-1 hover:text-rose-600",
              pathname === "/lien-he" && "font-medium text-rose-600",
            )}
          >
            <Phone className="h-5 w-5" aria-hidden />
            <span>Liên hệ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
