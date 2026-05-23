"use client";

import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { PUBLISHED_CANVAS_WIDTH } from "@/lib/editor/canvasViewport";

/**
 * Keeps Craft invitation layout at 390px design coordinates and scales down
 * uniformly on narrow viewports so editor WYSIWYG matches /thiep preview.
 */
export function InvitationCraftScale({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const frameW = outer.clientWidth;
      const scale = frameW >= PUBLISHED_CANVAS_WIDTH ? 1 : frameW / PUBLISHED_CANVAS_WIDTH;
      const naturalH = inner.scrollHeight;
      setLayout({
        scale,
        height: scale < 1 ? Math.ceil(naturalH * scale) : 0,
      });
    };

    const ro = new ResizeObserver(update);
    ro.observe(outer);
    const mo = new MutationObserver(update);
    mo.observe(inner, { childList: true, subtree: true, attributes: true });

    update();
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const { scale, height } = layout;

  return (
    <div ref={outerRef} className="invitation-craft-scaler w-full overflow-x-clip">
      <div
        style={
          scale < 1
            ? { width: "100%", height, position: "relative" as const }
            : undefined
        }
      >
        <div
          ref={innerRef}
          style={{
            width: PUBLISHED_CANVAS_WIDTH,
            marginLeft: "auto",
            marginRight: "auto",
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top center",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
