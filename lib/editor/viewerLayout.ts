import type { CSSProperties } from "react";
import { PUBLISHED_CANVAS_WIDTH } from "./canvasViewport";

/** @deprecated Use PUBLISHED_CANVAS_WIDTH */
export const INVITATION_CANVAS_WIDTH = PUBLISHED_CANVAS_WIDTH;

/** Shared absolute positioning for editor + public invitation (390px canvas). */
export function publishedBlockLayout(
  left: number,
  width: number
): Pick<CSSProperties, "left" | "width" | "maxWidth"> {
  const normalizedLeft = editorLeftCss(left, width);
  return {
    left: viewerLeftCss(normalizedLeft, width),
    width: viewerWidthCss(width, normalizedLeft),
    maxWidth: "100%",
  };
}

/** Editor uses fixed pixel layout so drag/resize tools can read/write numeric CSS. */
export function editorBlockLayout(
  left: number,
  width: number,
  canvasWidth = PUBLISHED_CANVAS_WIDTH,
): Pick<CSSProperties, "left" | "width" | "maxWidth"> {
  void canvasWidth;
  return {
    left,
    width,
  };
}

/** Editor + public viewer share fixed 390px coordinates for WYSIWYG parity. */
export function blockLayout(
  _isViewer: boolean,
  left: number,
  width: number,
): Pick<CSSProperties, "left" | "width" | "maxWidth"> {
  if (_isViewer) return publishedBlockLayout(left, width);
  return editorBlockLayout(left, width);
}

/** Pixel width capped so the block's right edge stays within the canvas. */
export function clampBlockWidth(
  width: number,
  left = 0,
  canvasWidth = PUBLISHED_CANVAS_WIDTH,
): number {
  const maxWidth = canvasWidth - left;
  return Math.min(Math.max(1, width), maxWidth);
}

/** Clamp absolute block width so published cards never exceed the section (mobile viewport). */
export function viewerWidthCss(width: number, left = 0): string {
  const inset = Math.max(0, left);
  return `min(${width}px, calc(100% - ${inset}px))`;
}

/** Clamp horizontal position so blocks stay inside the section on narrow screens. */
export function viewerLeftCss(left: number, width: number): string {
  const w = Math.max(1, width);
  return `clamp(0px, ${Math.max(0, left)}px, calc(100% - min(${w}px, 100%)))`;
}

/** Editor canvas: same cap as viewer but fixed px (no %). */
export function editorWidthCss(
  width: number,
  left = 0,
  canvasWidth = PUBLISHED_CANVAS_WIDTH,
): number {
  return clampBlockWidth(width, left, canvasWidth);
}

/**
 * Preserve exact horizontal position (including negative left for partial bleed).
 * Only clamp when the block would extend past the right canvas edge.
 */
export function editorLeftCss(
  left: number,
  width: number,
  canvasWidth = PUBLISHED_CANVAS_WIDTH,
): number {
  const w = clampBlockWidth(width, left, canvasWidth);
  const maxLeft = canvasWidth - w;
  return Math.min(left, maxLeft);
}
