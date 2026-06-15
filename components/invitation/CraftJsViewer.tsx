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
  renderVersion?: string | number | null;
}

export function CraftJsViewer({ card, contentJson, renderVersion }: CraftJsViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const revision = useMemo(
    () => contentJsonRevision(contentJson, card.updated_at, renderVersion),
    [contentJson, card.updated_at, renderVersion]
  );

  const frameData = useMemo(() => {
    const migrated = migrateContentJson(contentJson);
    return JSON.stringify(migrated);
  }, [contentJson]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    try {
      JSON.parse(frameData);
    } catch (e) {
      console.error("[CraftJsViewer] frameData parse error:", e);
    }
  }, [frameData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const debugTimer = setTimeout(() => {
      const childCount = container.querySelectorAll("[data-node-id]").length;
      console.log("[CraftJsViewer] rendered nodes:", childCount);
    }, 2000);

    return () => clearTimeout(debugTimer);
  }, [revision, frameData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      try {
        console.error("[CraftJsViewer] Unhandled rejection caught", ev.reason);
        ev.preventDefault?.();
      } catch {
        // ignore
      }
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection as never);

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

    fallbackTimer = setTimeout(() => revealVisibleAnimations(container), 900);

    const hoverElements = container.querySelectorAll("[data-hover-effect]");
    hoverElements.forEach((el) => {
      const effect = (el as HTMLElement).dataset.hoverEffect;
      if (effect && effect !== "none") {
        (el as HTMLElement).classList.add(`hover-${effect}`);
      }
    });

    const stickyElements = container.querySelectorAll("[data-sticky='true']");
    stickyElements.forEach((el) => {
      (el as HTMLElement).style.position = "sticky";
      (el as HTMLElement).style.top = "0";
      (el as HTMLElement).style.zIndex = "50";
    });

    const customClassElements = container.querySelectorAll("[data-custom-class]");
    customClassElements.forEach((el) => {
      const cls = (el as HTMLElement).dataset.customClass;
      if (cls) cls.split(" ").filter(Boolean).forEach((c) => (el as HTMLElement).classList.add(c));
    });

    const eventElements = container.querySelectorAll("[data-events]");
    const cleanupFns: (() => void)[] = [];

    const buttonFallbacks = container.querySelectorAll<HTMLAnchorElement>('[data-block="button"] a[href]');
    buttonFallbacks.forEach((anchor) => {
      const el = anchor.closest("[data-events]") as HTMLElement | null;
      if (el) {
        const eventsJson = el.dataset.events ?? "";
        try {
          const events: SharedEventItem[] = JSON.parse(eventsJson);
          const hasLink = events.some((ev) => ev.action === "link");
          if (hasLink) return;
        } catch {
          // invalid JSON → treat as no events
        }
      }

      const handler = (e: Event) => {
        e.preventDefault();
        const href = anchor.getAttribute("href");
        if (href && href !== "#") {
          window.open(href, "_blank", "noopener,noreferrer");
        }
      };
      anchor.addEventListener("click", handler);
      cleanupFns.push(() => anchor.removeEventListener("click", handler));
    });

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
      window.removeEventListener("unhandledrejection", onUnhandledRejection as never);
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
