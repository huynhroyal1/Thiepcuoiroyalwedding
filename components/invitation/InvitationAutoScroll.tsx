"use client";

import { useEffect, useRef } from "react";

const SCROLL_SPEED = 80; // px/s - nhanh gấp 3 lần
const PAUSE_AFTER_USER_MS = 2000;

export function InvitationAutoScroll() {
  const rafRef = useRef(0);
  const lastRef = useRef(performance.now());
  const pausedRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const clearPause = () => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  const scheduleResume = () => {
    clearPause();
    pausedRef.current = true;
    pauseTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
      lastRef.current = performance.now();
    }, PAUSE_AFTER_USER_MS);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onUserWheel = () => scheduleResume();
    const onUserTouch = () => scheduleResume();
    const onUserKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        scheduleResume();
      }
    };

    window.addEventListener("wheel", onUserWheel, { passive: true });
    window.addEventListener("touchstart", onUserTouch, { passive: true });
    window.addEventListener("keydown", onUserKey);

    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      if (!pausedRef.current) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 8 && window.scrollY < maxScroll - 1) {
          window.scrollBy({ top: SCROLL_SPEED * dt, behavior: "auto" });
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearPause();
      window.removeEventListener("wheel", onUserWheel);
      window.removeEventListener("touchstart", onUserTouch);
      window.removeEventListener("keydown", onUserKey);
    };
  }, []);

  return null;
}
