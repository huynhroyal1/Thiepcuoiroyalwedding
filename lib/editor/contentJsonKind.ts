import { isCraftContentJson, isRawHtmlContentJson } from "@/lib/editor/sanitizeCraftContent";

export type ContentJsonKind = "none" | "raw-html" | "craft";

export function getContentJsonKind(content: unknown): ContentJsonKind {
  if (isRawHtmlContentJson(content)) return "raw-html";
  if (isCraftContentJson(content)) return "craft";
  return "none";
}

/** Card can open `/dashboard/editor/[cardId]` (Craft.js visual editor). */
export function canOpenVisualEditor(content: unknown): boolean {
  return getContentJsonKind(content) === "craft";
}

/** Card has a publishable invitation design (HTML or Craft). */
export function hasPublishedInvitationDesign(content: unknown): boolean {
  const kind = getContentJsonKind(content);
  return kind === "craft" || kind === "raw-html";
}
