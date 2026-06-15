"use client";

import { useEffect } from "react";

const PX_PER_SECOND = 22;

export function InvitationAutoScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let last = performance.now();
    let pausedByUser = false;
    let started = false;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const resume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(() => {
        pausedByUser = false;
        last = performance.now();
      }, 4000);
    };

    const onMusicPlay = () => {
      if (!started) {
        started = true;
        last = performance.now();
      }
      pausedByUser = false;
      last = performance.now();
    };

    const onMusicPause = () => {
      pausedByUser = true;
      if (resumeTimer) clearTimeout(resumeTimer);
    };

    const onWheel = () => {
      if (!started) return;
      pausedByUser = true;
      resume();
    };
    const onTouch = () => {
      if (!started) return;
      pausedByUser = true;
      resume();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!started) return;
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key)) {
        pausedByUser = true;
        resume();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("invitation:music:play", onMusicPlay);
    window.addEventListener("invitation:music:pause", onMusicPause);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!pausedByUser) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 8 && window.scrollY < maxScroll - 1) {
          window.scrollBy({ top: PX_PER_SECOND * dt, behavior: "auto" });
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("invitation:music:play", onMusicPlay);
      window.removeEventListener("invitation:music:pause", onMusicPause);
    };
  }, []);

  return null;
}
