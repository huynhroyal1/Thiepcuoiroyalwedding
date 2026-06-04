import { migrateCardFieldBindings } from "@/lib/editor/cardFieldBinding";
import { isCraftContentJson, sanitizeCraftContent } from "@/lib/editor/sanitizeCraftContent";
import { editorWidthCss } from "@/lib/editor/viewerLayout";

/**
 * Migrates old content_json by filling in default values for props added
 * in later versions. Safe to call multiple times (idempotent).
 *
 * Call before passing content_json to <Frame data={...}> in EditorClient.
 */

type NodeData = {
  type?: { resolvedName?: string };
  props?: Record<string, unknown>;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
  [key: string]: unknown;
};

type ContentJson = Record<string, NodeData>;

// ─── Defaults per block type ──────────────────────────────────────────────────

const SECTION_DEFAULTS: Record<string, unknown> = {
  // Overlay fields (Sprint 1)
  overlayType: "none",
  overlayGradientFrom: "#000000",
  overlayGradientTo: "#000000",
  overlayGradientAngle: 135,
  overlayImageUrl: "",
  overlayImageRepeat: "repeat",
  // Background extra (Sprint 1)
  bgRepeat: "no-repeat",
  bgAttachment: "scroll",
  videoPoster: "",
  // Separator (Sprint 3)
  separatorType: "none",
  separatorColor: "#ffffff",
  // Bg filter (Sprint 2)
  bgBlendMode: "normal",
  bgFilterContrast: 100,
  bgFilterBrightness: 100,
  bgFilterSaturate: 100,
  bgFilterGrayscale: 0,
  bgFilterOpacity: 100,
  bgFilterInvert: 0,
  bgFilterSepia: 0,
  bgFilterHueRotate: 0,
};

const SHARED_DEFAULTS: Record<string, unknown> = {
  // Sprint 2
  hoverEffect: "none",
  // Sprint 3
  stickyEnabled: false,
  customClass: "",
};

const IMAGE_DEFAULTS: Record<string, unknown> = {
  imageFilter: undefined,
  imageBlendMode: "normal",
};

function normalizeAbsoluteLayout(blockType: string, props: Record<string, unknown>) {
  if (blockType === "SectionBlock" || blockType === "RootCanvas") return;
  const left = typeof props.left === "number" ? props.left : 0;
  const widthKey = blockType === "IconBlock" ? "size" : "width";
  const rawWidth = props[widthKey];
  if (typeof rawWidth !== "number" || rawWidth <= 0) return;
  // Cap width only — preserve left/top exactly (negative left is valid with overflow:clip).
  props[widthKey] = editorWidthCss(rawWidth, left);
}

// ─── Main migration function ──────────────────────────────────────────────────

export function migrateContentJson(raw: Record<string, unknown>): Record<string, unknown> {
  console.log('[migrateContentJson] input keys:', Object.keys(raw).filter(k => !k.startsWith('UNSTABLE')));
  
  if (!isCraftContentJson(raw)) {
    console.log('[migrateContentJson] NOT craft content - isCraftContentJson returned false');
    return raw;
  }
  const content = sanitizeCraftContent(raw) as ContentJson;
  console.log('[migrateContentJson] after sanitize, keys:', Object.keys(content).filter(k => !k.startsWith('UNSTABLE')));

  Object.entries(content).forEach(([, node]) => {
    if (!node || typeof node !== "object") return;
    const props = node.props;
    if (!props || typeof props !== "object") return;

    const blockType = (node.type as { resolvedName?: string })?.resolvedName ?? "";

    // Apply shared defaults to all blocks
    Object.entries(SHARED_DEFAULTS).forEach(([key, defaultVal]) => {
      if (!(key in props)) props[key] = defaultVal;
    });

    // Section-specific defaults
    if (blockType === "SectionBlock") {
      Object.entries(SECTION_DEFAULTS).forEach(([key, defaultVal]) => {
        if (!(key in props)) props[key] = defaultVal;
      });

      // Backward compat: if overlayOpacity > 0 but no overlayType set, use "color"
      if (!("overlayType" in props) || props.overlayType === "none") {
        if ((props.overlayOpacity as number ?? 0) > 0) {
          props.overlayType = "color";
        }
      }
    }

    // Image-specific defaults
    if (blockType === "ImageBlock") {
      Object.entries(IMAGE_DEFAULTS).forEach(([key, defaultVal]) => {
        if (!(key in props)) props[key] = defaultVal;
      });
    }

    // Old drag state may contain negative/out-of-canvas left values. Normalize
    // before save/view so public CSS never computes zero/negative widths.
    normalizeAbsoluteLayout(blockType, props);
  });

  return migrateCardFieldBindings(content as Record<string, unknown>);
}
