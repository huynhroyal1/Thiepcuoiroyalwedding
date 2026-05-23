"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { migrateContentJson } from "@/lib/editor/migrateContentJson";
import { contentJsonRevision } from "@/lib/editor/contentJsonRevision";
import { Editor, Frame } from "@craftjs/core";
import { editorResolver } from "@/components/editor/resolver";
import { EditorCardProvider } from "@/components/editor/EditorContext";
import type { WeddingCard } from "@/types";
import type { SharedEventItem } from "@/components/editor/utils/styleHelpers";
import { runBlockEvent } from "@/lib/editor/runBlockEvent";
import { InvitationCraftScale } from "@/components/invitation/InvitationCraftScale";
import "animate.css";

function revealInvitationAnimation(el: HTMLElement) {
  const animEntry = el.dataset.animEntry;
  if (!animEntry) return;
  // Always strip pending — effect re-runs can re-add it while shown is already set.
  el.classList.remove("invitation-anim-pending");
  if (el.classList.contains("invitation-anim-shown")) return;
  const dur = parseFloat(el.dataset.animDur ?? "1");
  const delay = parseFloat(el.dataset.animDelay ?? "0");
  const loop = el.dataset.animLoop === "true";
  el.classList.add("invitation-anim-shown", "animate__animated", `animate__${animEntry}`);
  el.style.animationDuration = `${dur}s`;
  el.style.setProperty("--animate-duration", `${dur}s`);
  if (delay > 0) {
    el.style.animationDelay = `${delay}s`;
    el.style.setProperty("--animate-delay", `${delay}s`);
  }
  if (loop) el.classList.add("animate__infinite");
}

function revealVisibleAnimations(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("[data-anim-entry]").forEach((el) => {
    if (el.classList.contains("invitation-anim-shown")) {
      el.classList.remove("invitation-anim-pending");
      return;
    }
    if (isElementInScrollView(el)) revealInvitationAnimation(el);
  });
}

function isElementInScrollView(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

interface CraftJsViewerProps {
  card: WeddingCard;
  contentJson: Record<string, unknown>;
  /** Bust Craft Frame cache after save (?v= from preview URL). */
  renderVersion?: string | number | null;
}

/**
 * Read-only renderer for wedding cards saved as Craft.js node trees.
 * - `enabled={false}` disables all drag/drop/select interactions.
 * - IntersectionObserver triggers animate.css animations when scrolled into view.
 * - Event listeners (click/hover) are attached based on `data-events` attributes.
 * - Fits parent frame (max 390px, 100% on narrow phones).
 */
export function CraftJsViewer({ card, contentJson, renderVersion }: CraftJsViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const revision = useMemo(
    () => contentJsonRevision(contentJson, card.updated_at, renderVersion),
    [contentJson, card.updated_at, renderVersion]
  );
  const frameData = useMemo(
    () => JSON.stringify(migrateContentJson(contentJson)),
    [contentJson]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    // ── 1. IntersectionObserver for animate.css animations ────────────────────
    const animObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          if (!el.dataset.animEntry) return;
          revealInvitationAnimation(el);
          animObserver.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );

    const animElements = container.querySelectorAll<HTMLElement>("[data-anim-entry]");
    animElements.forEach((el) => {
      if (!el.classList.contains("invitation-anim-shown")) {
        el.classList.add("invitation-anim-pending");
      }
      if (isElementInScrollView(el)) {
        revealInvitationAnimation(el);
        animObserver.unobserve(el);
      } else {
        animObserver.observe(el);
      }
    });
    // Fail-safe: if IntersectionObserver misses initial viewport timing, reveal only visible blocks.
    fallbackTimer = setTimeout(() => revealVisibleAnimations(container), 900);

    // ── 2. Apply hover effects from data-hover-effect attribute ───────────────
    const hoverElements = container.querySelectorAll("[data-hover-effect]");
    hoverElements.forEach((el) => {
      const effect = (el as HTMLElement).dataset.hoverEffect;
      if (effect && effect !== "none") {
        (el as HTMLElement).classList.add(`hover-${effect}`);
      }
    });

    // Apply sticky elements
    const stickyElements = container.querySelectorAll("[data-sticky='true']");
    stickyElements.forEach((el) => {
      (el as HTMLElement).style.position = "sticky";
      (el as HTMLElement).style.top = "0";
      (el as HTMLElement).style.zIndex = "50";
    });

    // Apply custom CSS classes
    const customClassElements = container.querySelectorAll("[data-custom-class]");
    customClassElements.forEach((el) => {
      const cls = (el as HTMLElement).dataset.customClass;
      if (cls) cls.split(" ").filter(Boolean).forEach((c) => (el as HTMLElement).classList.add(c));
    });

    // ── 3. Event listeners via data-events ────────────────────────────────────
    const eventElements = container.querySelectorAll("[data-events]");
    const cleanupFns: (() => void)[] = [];

    eventElements.forEach((el) => {
      const eventsJson = (el as HTMLElement).dataset.events;
      if (!eventsJson) return;

      let events: SharedEventItem[] = [];
      try {
        events = JSON.parse(eventsJson);
      } catch {
        return;
      }

      events.forEach((ev) => {
        const handler = (e: Event) => {
          e.preventDefault();
          executeAction(ev, setLightboxSrc);
        };

        const domEvent = ev.trigger === "hover" ? "mouseenter" : "click";
        el.addEventListener(domEvent, handler);
        cleanupFns.push(() => el.removeEventListener(domEvent, handler));
      });
    });

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      animObserver.disconnect();
      cleanupFns.forEach((fn) => fn());
    };
  }, [revision]);

  return (
    <EditorCardProvider card={card}>
      <InvitationCraftScale>
        <div
          ref={containerRef}
          className="invitation-craft-root mx-auto w-full min-w-0 max-w-full"
          style={{ overflowX: "clip" }}
        >
          <Editor resolver={editorResolver} enabled={false}>
            <Frame key={revision} data={frameData} />
          </Editor>
        </div>
      </InvitationCraftScale>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Lightbox"
            style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              color: "#fff",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: 36,
              height: 36,
              fontSize: 18,
              cursor: "pointer",
            }}
            onClick={() => setLightboxSrc(null)}
          >
            ✕
          </button>
        </div>
      )}
    </EditorCardProvider>
  );
}

function executeAction(
  ev: SharedEventItem,
  setLightboxSrc: (src: string | null) => void
) {
  runBlockEvent(ev, { onLightbox: setLightboxSrc });
}
