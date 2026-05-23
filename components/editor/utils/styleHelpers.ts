import { CSSProperties } from "react";

// ─── Shared prop interfaces ───────────────────────────────────────────────────

export interface SharedFilterProps {
  blendMode?: string;
  filterContrast?: number;
  filterBrightness?: number;
  filterSaturate?: number;
  filterGrayscale?: number;
  filterOpacity?: number;
  filterInvert?: number;
  filterSepia?: number;
  filterHueRotate?: number;
}

export interface SharedTransformProps {
  transformOrigin?: string;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
  skewX?: number;
  skewY?: number;
  perspective?: number;
}

export interface SharedShadowProps {
  shadowType?: "none" | "outer" | "inner";
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowColor?: string;
}

export interface SharedEventItem {
  id: string;
  trigger: "click" | "hover";
  action:
    | "link"
    | "call"
    | "email"
    | "navigate-section"
    | "toggle-element"
    | "copy-clipboard"
    | "open-lightbox"
    | "open-popup"
    | "add-to-calendar";
  params: Record<string, string>;
}

export interface SharedProps
  extends SharedFilterProps,
    SharedTransformProps,
    SharedShadowProps {
  elementId?: string;
  hidden?: boolean;
  locked?: boolean;
  lockAspect?: boolean;
  zIndex?: number;
  animationEntry?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationLoop?: boolean;
  hoverEffect?: "none" | "scale-up" | "scale-down" | "glow" | "shake" | "rotate";
  stickyEnabled?: boolean;
  customClass?: string;
  events?: SharedEventItem[];
}

// ─── Default values ───────────────────────────────────────────────────────────

export const SHARED_DEFAULTS: SharedProps = {
  elementId: "",
  blendMode: "normal",
  lockAspect: true,
  filterContrast: 100,
  filterBrightness: 100,
  filterSaturate: 100,
  filterGrayscale: 0,
  filterOpacity: 100,
  filterInvert: 0,
  filterSepia: 0,
  filterHueRotate: 0,
  transformOrigin: "center center",
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  skewX: 0,
  skewY: 0,
  perspective: 0,
  shadowType: "none",
  shadowX: 0,
  shadowY: 4,
  shadowBlur: 12,
  shadowOpacity: 30,
  shadowColor: "#000000",
  hidden: false,
  locked: false,
  zIndex: 0,
  animationEntry: "",
  animationDuration: 1,
  animationDelay: 0,
  animationLoop: false,
  hoverEffect: "none",
  stickyEnabled: false,
  customClass: "",
  events: [],
};

// ─── Builder functions ────────────────────────────────────────────────────────

export function buildFilter(props: SharedFilterProps): string | undefined {
  const parts: string[] = [];
  if (props.filterContrast !== undefined && props.filterContrast !== 100)
    parts.push(`contrast(${props.filterContrast}%)`);
  if (props.filterBrightness !== undefined && props.filterBrightness !== 100)
    parts.push(`brightness(${props.filterBrightness}%)`);
  if (props.filterSaturate !== undefined && props.filterSaturate !== 100)
    parts.push(`saturate(${props.filterSaturate}%)`);
  if (props.filterGrayscale !== undefined && props.filterGrayscale !== 0)
    parts.push(`grayscale(${props.filterGrayscale}%)`);
  if (props.filterOpacity !== undefined && props.filterOpacity !== 100)
    parts.push(`opacity(${props.filterOpacity}%)`);
  if (props.filterInvert !== undefined && props.filterInvert !== 0)
    parts.push(`invert(${props.filterInvert}%)`);
  if (props.filterSepia !== undefined && props.filterSepia !== 0)
    parts.push(`sepia(${props.filterSepia}%)`);
  if (props.filterHueRotate !== undefined && props.filterHueRotate !== 0)
    parts.push(`hue-rotate(${props.filterHueRotate}deg)`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function buildTransform(props: SharedTransformProps): string | undefined {
  const parts: string[] = [];
  if (props.perspective && props.perspective !== 0)
    parts.push(`perspective(${props.perspective}px)`);
  if (props.rotateX && props.rotateX !== 0)
    parts.push(`rotateX(${props.rotateX}deg)`);
  if (props.rotateY && props.rotateY !== 0)
    parts.push(`rotateY(${props.rotateY}deg)`);
  if (props.rotateZ && props.rotateZ !== 0)
    parts.push(`rotateZ(${props.rotateZ}deg)`);
  if (props.skewX && props.skewX !== 0)
    parts.push(`skewX(${props.skewX}deg)`);
  if (props.skewY && props.skewY !== 0)
    parts.push(`skewY(${props.skewY}deg)`);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

export function buildBoxShadow(props: SharedShadowProps): string | undefined {
  if (!props.shadowType || props.shadowType === "none") return undefined;
  const {
    shadowX = 0,
    shadowY = 4,
    shadowBlur = 12,
    shadowOpacity = 30,
    shadowColor = "#000000",
  } = props;
  const alpha = Math.round((shadowOpacity / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  const baseColor =
    shadowColor.startsWith("#") && shadowColor.length === 7
      ? shadowColor + alpha
      : shadowColor;
  if (props.shadowType === "inner") {
    return `inset ${shadowX}px ${shadowY}px ${shadowBlur}px ${baseColor}`;
  }
  return `${shadowX}px ${shadowY}px ${shadowBlur}px ${baseColor}`;
}

export function buildSharedStyle(props: SharedProps): CSSProperties {
  return {
    mixBlendMode: (props.blendMode ?? "normal") as CSSProperties["mixBlendMode"],
    filter: buildFilter(props),
    transform: buildTransform(props),
    boxShadow: buildBoxShadow(props),
    visibility: props.hidden ? "hidden" : "visible",
    zIndex: props.zIndex || "auto",
    transformOrigin: props.transformOrigin ?? "center center",
  };
}

export function buildAnimationAttrs(props: SharedProps): Record<string, string | undefined> {
  if (!props.animationEntry) return {};
  return {
    "data-anim-entry": props.animationEntry,
    "data-anim-dur": String(props.animationDuration ?? 1),
    "data-anim-delay": props.animationDelay ? String(props.animationDelay) : undefined,
    "data-anim-loop": props.animationLoop ? "true" : undefined,
  };
}

export function buildEventsAttr(props: SharedProps): string | undefined {
  if (!props.events || props.events.length === 0) return undefined;
  return JSON.stringify(props.events);
}

/** Returns data attributes for hover effect + sticky (read by CraftJsViewer). */
export function buildExtraAttrs(props: SharedProps): Record<string, string | undefined> {
  const attrs: Record<string, string | undefined> = {};
  if (props.hoverEffect && props.hoverEffect !== "none") {
    attrs["data-hover-effect"] = props.hoverEffect;
  }
  if (props.stickyEnabled) {
    attrs["data-sticky"] = "true";
  }
  if (props.customClass) {
    attrs["data-custom-class"] = props.customClass;
  }
  return attrs;
}
