/**
 * Craft.js presets cho 10 mẫu MeHappy — layout đầy đủ (kéo-thả), theme theo từng mẫu.
 */

import { injectInvitationAnimations } from "../inject-invitation-animations.mjs";
import { buildPremiumSaveTheDateJson } from "./premium-save-the-date.mjs";
import { buildShowcaseTemplateJson } from "./showcase-template-variants.mjs";

/** @typedef {{ variant?: 'pro'|'vip', accent: string, accentDark?: string, rose?: string, countdownText?: string, coverOverlay?: string, coverOverlayOpacity?: number, sectionTint?: string }} MehappyTheme */

/** @type {Record<string, MehappyTheme>} */
export const MEHAPPY_CRAFT_THEMES = {
  "mehappy-classy-vogue": {
    variant: "vip",
    accent: "#c8a97e",
    accentDark: "#5c4033",
    rose: "#d4af37",
    countdownText: "#1c1410",
    coverOverlay: "#1c1410",
    coverOverlayOpacity: 40,
  },
  "mehappy-classy-vogue-envelope": {
    variant: "vip",
    accent: "#b8860b",
    accentDark: "#4a3728",
    rose: "#c8a97e",
    countdownText: "#2a1810",
    coverOverlay: "#2a1810",
    coverOverlayOpacity: 35,
  },
  "mehappy-thiep-moi-xanh": {
    accent: "#2d6a4f",
    accentDark: "#1b4332",
    rose: "#40916c",
    countdownText: "#ffffff",
    sectionTint: "#e8f5e9",
  },
  "mehappy-save-the-date-hong": {
    accent: "#ea6c88",
    accentDark: "#880000",
    rose: "#f4a5b8",
    countdownText: "#ffffff",
    sectionTint: "#fff0f3",
  },
  "mehappy-viceroy-classic": {
    accent: "#8b6914",
    accentDark: "#5c4a1f",
    rose: "#a67c52",
    countdownText: "#ffffff",
    coverOverlay: "#3d2f1f",
    coverOverlayOpacity: 30,
  },
  "mehappy-viceroy-elegant": {
    accent: "#9a7b4f",
    accentDark: "#4a3728",
    rose: "#c4a574",
    countdownText: "#ffffff",
    coverOverlay: "#2c2418",
    coverOverlayOpacity: 35,
  },
  "mehappy-save-date-arch": {
    accent: "#b56576",
    accentDark: "#6d2e46",
    rose: "#e8a0bf",
    countdownText: "#ffffff",
    sectionTint: "#fdf6f8",
  },
  "mehappy-save-date-rose": {
    accent: "#c9184a",
    accentDark: "#800f2f",
    rose: "#ff4d6d",
    countdownText: "#ffffff",
    sectionTint: "#fff5f7",
  },
  "mehappy-floral-wedding": {
    accent: "#bc6c8c",
    accentDark: "#6d597a",
    rose: "#e8b4bc",
    countdownText: "#ffffff",
    sectionTint: "#faf6f8",
  },
  "mehappy-teal-wedding": {
    accent: "#0d9488",
    accentDark: "#115e59",
    rose: "#2dd4bf",
    countdownText: "#ffffff",
    sectionTint: "#ecfdf5",
  },
};

const ROSE_TARGETS = new Set(["#ea6c88", "#E37D7D", "#f4a5b8"]);
const WINE_TARGETS = new Set(["#880000", "#C24E4E"]);
const GOLD_TARGETS = new Set(["#c8a97e"]);

/**
 * @param {Record<string, import('./premium-save-the-date.mjs').CraftNode>} nodes
 * @param {MehappyTheme} theme
 */
export function applyMehappyColorTheme(nodes, theme) {
  const accent = theme.accent;
  const accentDark = theme.accentDark ?? accent;
  const rose = theme.rose ?? accent;

  for (const node of Object.values(nodes)) {
    const p = node?.props;
    if (!p) continue;
    const name = node.type?.resolvedName;

    if (name === "CountdownBlock") {
      p.primaryColor = accent;
      if (theme.countdownText) p.textColor = theme.countdownText;
      if (theme.sectionTint) p.labelColor = theme.sectionTint;
    }

    if (name === "TextBlock" && typeof p.color === "string") {
      const c = p.color.toLowerCase();
      if (ROSE_TARGETS.has(p.color) || ROSE_TARGETS.has(c)) p.color = rose;
      else if (WINE_TARGETS.has(p.color) || WINE_TARGETS.has(c)) p.color = accentDark;
      else if (GOLD_TARGETS.has(p.color)) p.color = accent;
    }

    if (name === "IconBlock" && p.color) {
      p.color = accentDark;
    }

    if (name === "ImageBlock" && p.borderColor) {
      p.borderColor = accent;
    }

    if (name === "SectionBlock") {
      if (theme.coverOverlay && p.elementId === "section-cover") {
        p.overlayType = "color";
        p.overlayColor = theme.coverOverlay;
        p.overlayOpacity = theme.coverOverlayOpacity ?? 35;
      }
      if (theme.sectionTint && p.elementId === "section-save-date") {
        p.overlayColor = theme.sectionTint;
        p.overlayOpacity = 20;
      }
    }

    if (name === "ButtonBlock" && p.bgColor) {
      p.bgColor = accent;
    }

    if (name === "GiftBoxBlock") {
      if (p.accentColor) p.accentColor = accent;
      if (p.headerColor) p.headerColor = accentDark;
    }
  }

  return nodes;
}

/**
 * @param {string} templateId
 * @param {{ thumbnail_url?: string | null }} [meta]
 */
export function buildMehappyCraftJson(templateId, meta = {}) {
  const theme = MEHAPPY_CRAFT_THEMES[templateId] ?? { accent: "#ea6c88" };
  const cover = meta.thumbnail_url?.trim() || undefined;
  const images = cover ? { cover } : undefined;

  let nodes;
  if (theme.variant === "vip") {
    nodes = buildShowcaseTemplateJson("vip", { images });
  } else {
    nodes = buildPremiumSaveTheDateJson({ images });
    applyMehappyColorTheme(nodes, theme);
  }

  if (theme.variant === "vip") {
    applyMehappyColorTheme(nodes, theme);
  }

  return injectInvitationAnimations(nodes, { force: true });
}

export const MEHAPPY_RAW_HTML_IDS = Object.keys(MEHAPPY_CRAFT_THEMES);
