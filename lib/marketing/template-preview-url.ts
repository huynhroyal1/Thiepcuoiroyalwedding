import { hasPublishedInvitationDesign } from "@/lib/editor/contentJsonKind";
import type { TemplateRow } from "@/types";

/** URL xem trước thiệp live (Craft / HTML), không chỉ thumbnail. */
export function templatePreviewHref(t: Pick<TemplateRow, "id" | "preview_url">): string {
  if (t.preview_url?.startsWith("/thiep/")) return t.preview_url;
  return `/thiep/mau/${encodeURIComponent(t.id)}`;
}

export function canOpenTemplateLivePreview(t: Pick<TemplateRow, "preview_url" | "content_json">): boolean {
  if (t.preview_url?.startsWith("/thiep/")) return true;
  return hasPublishedInvitationDesign(t.content_json);
}

export function templatePreviewHrefWithVersion(
  t: Pick<TemplateRow, "id" | "preview_url">,
  version?: number
): string {
  const base = templatePreviewHref(t);
  if (version == null || version <= 0) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${version}`;
}
