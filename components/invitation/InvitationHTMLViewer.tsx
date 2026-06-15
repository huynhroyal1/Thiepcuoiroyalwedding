"use client";

import { useEffect, useRef, useState } from "react";
import { runBlockEvent } from "@/lib/editor/runBlockEvent";
import type { SharedEventItem } from "@/components/editor/utils/styleHelpers";
import "animate.css";

interface Props {
  html: string;
}

const TAILWIND_CDN_ID = "royal-wedding-tailwind-cdn";
const DAISYUI_CDN_ID = "royal-wedding-daisyui-cdn";

function htmlNeedsTailwindCdn(html: string) {
  return (
    /data-testid="boho-floral-green-template"/.test(html) ||
    /class="demo-page"/.test(html) ||
    /\bmodal-box\b/.test(html)
  );
}

function ensureTailwindCdn() {
  if (typeof document === "undefined") return;
  if (!document.getElementById(TAILWIND_CDN_ID)) {
    const script = document.createElement("script");
    script.id = TAILWIND_CDN_ID;
    script.src = "https://cdn.tailwindcss.com";
    script.async = true;
    document.head.appendChild(script);
  }
  if (!document.getElementById(DAISYUI_CDN_ID)) {
    const link = document.createElement("link");
    link.id = DAISYUI_CDN_ID;
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/daisyui@4.12.14/dist/full.min.css";
    document.head.appendChild(link);
  }
}

function destroyAlbumSwiper(container: HTMLElement) {
  const existing = (container as unknown as { swiper?: { destroy(allowDestroyEl?: boolean, deleteInstance?: boolean): void } }).swiper;
  if (!existing) return;
  try {
    existing.destroy(true, true);
  } catch {
    // ignore cleanup errors
  }
  delete (container as unknown as { swiper?: unknown }).swiper;
  container.removeAttribute("data-swiper-initialized");
}

function initAlbumSwiper(container: HTMLElement) {
  const swiperContainer = container.querySelector<HTMLElement>(".album-swiper-container");
  if (!swiperContainer) {
    console.log("[InvitationHTMLViewer] album swiper container not found");
    return;
  }

  destroyAlbumSwiper(swiperContainer);

  const swiperWrapper = swiperContainer.querySelector<HTMLElement>(".swiper-wrapper");
  if (!swiperWrapper) {
    console.log("[InvitationHTMLViewer] album swiper wrapper not found");
    return;
  }

  const slides = swiperWrapper.querySelectorAll<HTMLElement>(".swiper-slide");
  if (!slides.length) {
    console.log("[InvitationHTMLViewer] album swiper slides not found");
    return;
  }

  swiperContainer.classList.remove("swiper-initialized");
  swiperContainer.classList.add("swiper", "swiper-initialized");
  const prevBtn = swiperContainer.querySelector<HTMLElement>(".swiper-button-prev");
  const nextBtn = swiperContainer.querySelector<HTMLElement>(".swiper-button-next");
  const pagination = swiperContainer.querySelector<HTMLElement>(".swiper-pagination");
  if (prevBtn) prevBtn.classList.add("swiper-button-prev");
  if (nextBtn) nextBtn.classList.add("swiper-button-next");
  if (pagination) pagination.classList.add("swiper-pagination");

  const attachClasses = () => {
    slides.forEach((slide, idx) => {
      slide.classList.add("swiper-slide");
      if (idx === 0) slide.classList.add("swiper-slide-active");
      if (idx === slides.length - 1) slide.classList.add("swiper-slide-last");
    });
  };

  const tryInit = () => {
    const SwiperLib = (window as unknown as { Swiper?: unknown }).Swiper;
    if (!SwiperLib) {
      setTimeout(tryInit, 50);
      return;
    }

    attachClasses();

    const instance = new (SwiperLib as new (el: HTMLElement, opts: unknown) => { update(): void; destroy(allowDestroyEl?: boolean, deleteInstance?: boolean): void })(
      swiperContainer,
      {
        loop: true,
        speed: 900,
        spaceBetween: 10,
        slidesPerView: 1.15,
        centeredSlides: true,
        navigation: {
          nextEl: nextBtn ?? undefined,
          prevEl: prevBtn ?? undefined,
        },
        pagination: {
          el: pagination ?? undefined,
          clickable: true,
        },
        autoplay: {
          delay: 2000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        },
        keyboard: { enabled: true },
      }
    );

    (swiperContainer as unknown as { swiper?: unknown }).swiper = instance;
    swiperContainer.dataset.swiperInitialized = "true";
    console.log("[InvitationHTMLViewer] album swiper initialized", {
      slides: slides.length,
      activeIndex: (instance as { activeIndex?: number }).activeIndex,
      autoplay: (instance as { params?: { autoplay?: boolean } }).params?.autoplay,
    });

    setTimeout(() => instance.update(), 0);
  };

  tryInit();
}

export function InvitationHTMLViewer({ html }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const needsTailwind = htmlNeedsTailwindCdn(html);

  useEffect(() => {
    if (needsTailwind) ensureTailwindCdn();
  }, [needsTailwind]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanups: (() => void)[] = [];

    const animObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (el.classList.contains("invitation-anim-shown")) return;

          const animEntry = el.dataset.animEntry;
          if (animEntry) {
            el.style.opacity = "1";
            el.style.visibility = "visible";
            el.classList.remove("invitation-anim-pending");
            el.classList.add("invitation-anim-shown", "animate__animated", `animate__${animEntry}`);
            el.style.animationDuration = `${el.dataset.animDur ?? "1"}s`;
            if (el.dataset.animLoop === "true") el.classList.add("animate__infinite");
          }

          if (el.classList.contains("anim-hidden")) {
            el.classList.remove("anim-hidden");
            el.classList.add("invitation-anim-shown", "animate__animated", "animate__fadeInUp");
            el.style.animationDuration = "0.7s";
          }

          animObserver.unobserve(el);
        });
      },
      { threshold: 0.12 }
    );

    container.querySelectorAll<HTMLElement>(".anim-hidden, [data-anim-entry]").forEach((el) => {
      animObserver.observe(el);
    });

    container.querySelectorAll<HTMLElement>("[data-events]").forEach((el) => {
      const raw = el.dataset.events;
      if (!raw) return;
      let events: SharedEventItem[] = [];
      try { events = JSON.parse(raw); } catch { return; }
      events.forEach((ev) => {
        const domEvent = ev.trigger === "hover" ? "mouseenter" : "click";
        const handler = (e: Event) => {
          e.preventDefault();
          runBlockEvent(ev, { onLightbox: setLightboxSrc });
        };
        el.addEventListener(domEvent, handler);
        cleanups.push(() => el.removeEventListener(domEvent, handler));
      });
    });

    container.querySelectorAll<HTMLElement>(".overlay-hidden-on-load").forEach((el) => {
      el.style.display = "none";
    });

    initAlbumSwiper(container);

    return () => {
      animObserver.disconnect();
      cleanups.forEach((fn) => fn());
      destroyAlbumSwiper(container);
    };
  }, [html]);

  return (
    <>
      <div
        ref={containerRef}
        className="invitation-html-root mx-auto w-full min-w-0 max-w-full overflow-x-clip"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {lightboxSrc && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc} alt="Lightbox"
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={{ position: "absolute", top: 20, right: 20, color: "#fff",
              background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
              width: 36, height: 36, fontSize: 18, cursor: "pointer" }}
            onClick={() => setLightboxSrc(null)}
          >✕</button>
        </div>
      )}
    </>
  );
}
