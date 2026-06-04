"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Frame } from "@craftjs/core";
import { EditorMoveable } from "./EditorMoveable";
import { EditorPositionFlushBridge } from "./EditorPositionFlushBridge";
import { SectionIndicator } from "./SectionIndicator";
import { EditorInteractionLayer } from "./EditorInteractionLayer";
import { EditorCanvasHint } from "./EditorCanvasHint";
import { EditorCanvasProvider } from "./EditorCanvasContext";
import { useEditorUI } from "@/components/editor/EditorUIContext";
import {
  PUBLISHED_CANVAS_WIDTH,
  VIEWPORT_WIDTH_MAX,
  VIEWPORT_WIDTH_MIN,
  VIEWPORT_WIDTH_PRESETS,
} from "@/lib/editor/canvasViewport";

interface EditorCanvasAreaProps {
  frameData?: string;
  /** Remount Craft frame when saved card reloads from server. */
  frameKey?: string;
  children?: React.ReactNode;
}

export function EditorCanvasArea({ frameData, frameKey, children }: EditorCanvasAreaProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const { viewportWidth, setViewportWidth } = useEditorUI();
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null);

  /** Craft layout is always 390px; wider preview frames letterbox the design centered inside. */
  const contentWidth = Math.min(PUBLISHED_CANVAS_WIDTH, viewportWidth);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      resizeRef.current = { startX: e.clientX, startW: viewportWidth };
    },
    [viewportWidth],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!resizeRef.current) return;
      const delta = (e.clientX - resizeRef.current.startX) / zoom;
      setViewportWidth(resizeRef.current.startW + delta);
    };
    const onUp = () => {
      resizeRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [zoom, setViewportWidth]);

  return (
    <main className="editor-canvas-main flex flex-1 flex-col items-center overflow-auto bg-gray-100 px-4 py-6">
      <div className="mb-3 flex max-w-full flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500">
          <svg className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="7" y="2" width="10" height="20" rx="2" strokeWidth={2} />
            <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
          </svg>
          <label className="flex items-center gap-1.5">
            <span className="text-gray-400">Khung</span>
            <input
              type="number"
              min={VIEWPORT_WIDTH_MIN}
              max={VIEWPORT_WIDTH_MAX}
              step={1}
              value={viewportWidth}
              onChange={(e) => setViewportWidth(Number(e.target.value))}
              className="w-14 border-b border-gray-200 bg-transparent text-center font-medium tabular-nums text-gray-700 outline-none focus:border-indigo-400"
              aria-label="Chiều rộng khung xem (px)"
            />
            <span className="text-gray-400">px</span>
          </label>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">Nội dung {contentWidth}px</span>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-1.5 py-1">
          {VIEWPORT_WIDTH_PRESETS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setViewportWidth(w)}
              className={`rounded-full px-2 py-0.5 text-[11px] transition-colors ${
                viewportWidth === w
                  ? "bg-indigo-100 font-medium text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
            className="flex h-4 w-4 items-center justify-center text-xs text-gray-400 hover:text-gray-700"
          >
            −
          </button>
          <span className="w-9 text-center text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-16 accent-indigo-500"
            aria-label="Thu phóng khung xem"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
            className="flex h-4 w-4 items-center justify-center text-xs text-gray-400 hover:text-gray-700"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="ml-0.5 text-[10px] text-indigo-400 hover:text-indigo-600"
          >
            ↺
          </button>
        </div>
      </div>

      {/* Phone mockup — centered in the gray editor column */}
      <div
        className="relative mx-auto shrink-0"
        style={{
          transform: zoom !== 1 ? `scale(${zoom})` : undefined,
          transformOrigin: "top center",
          maxWidth: "100%",
        }}
      >
        <div
          className="relative overflow-hidden rounded-[20px] border-[6px] border-gray-800 bg-white shadow-xl"
          style={{ width: viewportWidth, minHeight: 700, maxWidth: "100%" }}
        >
          <div className="flex h-6 items-center justify-center bg-gray-900">
            <div className="h-2 w-16 rounded-full bg-gray-700" />
          </div>

          <EditorCanvasProvider
            zoom={zoom}
            contentWidth={contentWidth}
            scrollContainerRef={scrollRef}
          >
            <div
              ref={(el) => {
                scrollRef.current = el;
                setCanvasEl(el);
              }}
              className="editor-canvas-root"
              style={{
                width: viewportWidth,
                maxWidth: "100%",
                overflowX: "hidden",
                overflowY: "auto",
                maxHeight: "calc(100vh - 200px)",
                position: "relative",
                ["--editor-viewport-width" as string]: `${viewportWidth}px`,
                ["--editor-content-width" as string]: `${contentWidth}px`,
              }}
            >
              <div
                className="editor-craft-content mx-auto min-w-0"
                style={{
                  width: contentWidth,
                  maxWidth: "100%",
                  overflowX: "clip",
                }}
              >
                <Frame key={frameKey ?? "initial"} data={frameData}>
                  {children}
                </Frame>
              </div>
              <EditorInteractionLayer containerRef={scrollRef} />
              <EditorCanvasHint />
              <EditorPositionFlushBridge rootContainer={canvasEl} />
              <EditorMoveable rootContainer={canvasEl} />
              <SectionIndicator containerRef={scrollRef} />
            </div>
          </EditorCanvasProvider>

          <div className="flex h-5 items-center justify-center border-t border-gray-100 bg-white">
            <div className="h-1 w-24 rounded-full bg-gray-300" />
          </div>
        </div>

        <button
          type="button"
          aria-label="Kéo để đổi chiều rộng khung xem"
          onPointerDown={onResizePointerDown}
          className="absolute -right-1 top-[18%] bottom-[18%] z-20 w-3 cursor-ew-resize touch-none rounded-full border border-indigo-200 bg-indigo-50/90 shadow-sm hover:bg-indigo-100 active:bg-indigo-200"
          title="Kéo để chỉnh rộng khung"
        />
      </div>

      <p className="mt-2 max-w-sm text-center text-[11px] text-gray-400">
        Khung rộng hơn 390px: nội dung thiệp căn giữa (giống xem trên màn lớn). Thiệp công khai: 390px.
      </p>
    </main>
  );
}
