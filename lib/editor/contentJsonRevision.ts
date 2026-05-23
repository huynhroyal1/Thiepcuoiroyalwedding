import { migrateContentJson } from "@/lib/editor/migrateContentJson";

/** Stable revision string for Craft Frame remount when content or save time changes. */
export function contentJsonRevision(
  contentJson: Record<string, unknown>,
  updatedAt?: string | null,
  renderVersion?: string | number | null
): string {
  const json = JSON.stringify(migrateContentJson(contentJson));
  let hash = 0;
  for (let i = 0; i < json.length; i += 1) {
    hash = (Math.imul(31, hash) + json.charCodeAt(i)) | 0;
  }
  const parts = [String(hash >>> 0)];
  if (updatedAt) parts.push(updatedAt);
  if (renderVersion != null && renderVersion !== "") parts.push(String(renderVersion));
  return parts.join("-");
}
