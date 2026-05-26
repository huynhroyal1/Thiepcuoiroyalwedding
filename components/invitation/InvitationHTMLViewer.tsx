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

/**
 * Renders raw HTML wedding card (MeHappy-format sections).
 * - Adds IntersectionObserver for `anim-hidden` class → fadeInUp on scroll
 * - Supports `data-anim-entry` (same as CraftJsViewer)
 * - Handles data-events click/hover actions
 */
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

    // ── 1. anim-hidden → fadeInUp when scrolled into view ─────────────────
    const animObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;

          if (el.classList.contains("invitation-anim-shown")) return;

          // Craft.js style via data-anim-entry
          const animEntry = el.dataset.animEntry;
          if (animEntry) {
            el.style.opacity = "1";
            el.style.visibility = "visible";
            el.classList.remove("invitation-anim-pending");
            el.classList.add("invitation-anim-shown", "animate__animated", `animate__${animEntry}`);
            el.style.animationDuration = `${el.dataset.animDur ?? "1"}s`;
            if (el.dataset.animLoop === "true") el.classList.add("animate__infinite");
          }

          // MeHappy style via anim-hidden class
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

    // ── 2. Click/hover events via data-events ─────────────────────────────
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

    // ── 3. Hide "overlay-hidden-on-load" cover elements ──────────────────
    container.querySelectorAll<HTMLElement>(".overlay-hidden-on-load").forEach((el) => {
      el.style.display = "none";
    });

    // ── 4. Hide sections that have display:none inline ────────────────────
    // Already handled by the HTML itself

    return () => {
      animObserver.disconnect();
      cleanups.forEach((fn) => fn());
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
