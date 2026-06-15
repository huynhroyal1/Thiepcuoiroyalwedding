"use client";

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PUBLISHED_CANVAS_WIDTH } from "@/lib/editor/canvasViewport";

type Layout = { scale: number; height: number };

export function InvitationCraftScale({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout>({ scale: 1, height: 0 });
  const stableLayoutRef = useRef<Layout>({ scale: 1, height: 0 });
  const roRef = useRef<ResizeObserver | null>(null);

  const applyLayout = useCallback((next: Layout) => {
    const current = stableLayoutRef.current;
    if (Math.abs(current.scale - next.scale) < 0.0005 && Math.abs(current.height - next.height) < 0.5) {
      return;
    }
    stableLayoutRef.current = next;
    setLayout(next);
  }, []);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const frameW = outer.clientWidth;
        const scale = frameW >= PUBLISHED_CANVAS_WIDTH ? 1 : frameW / PUBLISHED_CANVAS_WIDTH;
        const naturalH = inner.scrollHeight;
        applyLayout({
          scale,
          height: scale < 1 ? Math.ceil(naturalH * scale) : 0,
        });
      });
    };

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    roRef.current = ro;

    update();
    return () => {
      ro.disconnect();
      roRef.current = null;
      cancelAnimationFrame(raf);
    };
  }, [applyLayout]);

  const { scale, height } = layout;

  return (
    <div ref={outerRef} className="invitation-craft-scaler w-full overflow-x-clip">
      {scale < 1 ? (
        <div
          style={{
            width: "100%",
            height,
            position: "relative",
            zoom: scale,
            transformOrigin: "top center",
          }}
        >
          {children}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-full">{children}</div>
      )}
    </div>
  );
}
