"use client";

import { useEffect, useRef } from "react";

const SCROLL_SPEED = 25; // px/s
const SWIPER_INTERVAL = 2200; // ms giữa mỗi lần vuốt ảnh
const USER_PAUSE_MS = 3000;

export function InvitationAutoScroll() {
  const rafRef = useRef(0);
  const lastRef = useRef(performance.now());
  const pausedRef = useRef(false);
  const modeRef = useRef<"scroll" | "swiper" | "idle">("scroll");
  const swiperReadyRef = useRef(false);
  const swiperSlidesRef = useRef(0);
  const swiperPassesRef = useRef(0);
  const swiperLastSlideRef = useRef(0);

  const getSwiperFromDOM = () => {
    if (typeof document === "undefined") return null;
    const el = document.querySelector(".album-swiper") as HTMLElement | null;
    if (!el) return null;
    const cls = el.classList;
    if (!cls.contains("swiper-initialized") && !cls.contains("swiper-initialized")) {
      return null;
    }
    const inst = (el as unknown as { swiper?: { activeIndex: number; slides: { length: number } } }).swiper;
    if (!inst) return null;
    return inst;
  };

  const pause = (ms = USER_PAUSE_MS) => {
    pausedRef.current = true;
    setTimeout(() => {
      pausedRef.current = false;
      lastRef.current = performance.now();
    }, ms);
  };

  const enterSwiperMode = () => {
    const swiper = getSwiperFromDOM();
    if (!swiper) return;
    modeRef.current = "swiper";
    swiperReadyRef.current = true;
    swiperSlidesRef.current = swiper.slides.length;
    swiperPassesRef.current = 0;
    swiperLastSlideRef.current = swiper.activeIndex;
  };

  const exitSwiperMode = () => {
    modeRef.current = "scroll";
    swiperReadyRef.current = false;
    lastRef.current = performance.now();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onUserScroll = () => pause();
    const onUserTouch = () => pause();
    const onUserKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        pause();
      }
    };

    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchstart", onUserTouch, { passive: true });
    window.addEventListener("keydown", onUserKey);

    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      if (!pausedRef.current) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        if (modeRef.current === "scroll") {
          if (maxScroll > 8 && window.scrollY < maxScroll - 1) {
            window.scrollBy({ top: SCROLL_SPEED * dt, behavior: "auto" });
          }

          const swiper = getSwiperFromDOM();
          if (swiper) {
            const rect = (document.querySelector(".album-swiper") as HTMLElement | null)?.getBoundingClientRect();
            if (rect && rect.bottom > 0 && rect.top < window.innerHeight * 0.9) {
              enterSwiperMode();
            }
          }
        } else if (modeRef.current === "swiper") {
          const swiper = getSwiperFromDOM();
          if (!swiper) {
            exitSwiperMode();
            return;
          }

          if (swiper.activeIndex !== swiperLastSlideRef.current) {
            swiperLastSlideRef.current = swiper.activeIndex;
            swiperPassesRef.current += 1;
          }

          if (swiperPassesRef.current >= swiperSlidesRef.current) {
            exitSwiperMode();
          }
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchstart", onUserTouch);
      window.removeEventListener("keydown", onUserKey);
    };
  }, []);

  return null;
}
