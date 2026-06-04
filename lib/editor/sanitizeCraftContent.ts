/** Craft.js resolver component names — keep in sync with components/editor/resolver.ts */
export const CRAFT_RESOLVER_NAMES = new Set([
  "SectionBlock",
  "TextBlock",
  "ImageBlock",
  "CountdownBlock",
  "DividerBlock",
  "ButtonBlock",
  "IconBlock",
  "GiftBoxBlock",
  "RootCanvas",
  // Legacy / imported blocks that may exist in old templates
  "WishesBlock",
]);

type CraftNode = {
  type?: { resolvedName?: string } | string;
  nodes?: string[];
  linkedNodes?: Record<string, string>;
  [key: string]: unknown;
};

function getResolvedName(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const t = (node as CraftNode).type;
  if (typeof t === "string") return t;
  if (t && typeof t === "object") return t.resolvedName;
  return undefined;
}

/** True when content is a Craft.js tree (has ROOT canvas), not raw-html. */
export function isCraftContentJson(content: unknown): content is Record<string, unknown> {
  if (content == null || typeof content !== "object") return false;
  const c = content as Record<string, unknown>;
  if (c.type === "raw-html") return false;
  const resolvedName = getResolvedName(c.ROOT);
  console.log('[isCraftContentJson] ROOT resolvedName:', resolvedName, '=== "RootCanvas"?', resolvedName === "RootCanvas");
  return resolvedName === "RootCanvas";
}

/**
 * Drop non-node keys (e.g. raw-html `type`/`html` strings) and nodes with missing/unknown types
 * so Craft.js deserialize does not throw "Cannot find component <undefined />".
 */
export function sanitizeCraftContent(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.type === "raw-html") return raw;

  const sanitized: Record<string, unknown> = {};

  for (const [id, node] of Object.entries(raw)) {
    if (node == null || typeof node !== "object") continue;

    const resolvedName = getResolvedName(node);
    console.log(`[sanitizeCraftContent] node "${id}" resolvedName:`, resolvedName, 'in CRAFT_RESOLVER_NAMES?', CRAFT_RESOLVER_NAMES.has(resolvedName || ''));
    if (!resolvedName || !CRAFT_RESOLVER_NAMES.has(resolvedName)) continue;

    sanitized[id] = {
      ...(node as CraftNode),
      type: { resolvedName },
    };
  }

  console.log('[sanitizeCraftContent] output keys:', Object.keys(sanitized).filter(k => !k.startsWith('UNSTABLE')));

  for (const node of Object.values(sanitized)) {
    if (!node || typeof node !== "object") continue;
    const n = node as CraftNode;
    if (n.nodes?.length) {
      n.nodes = n.nodes.filter((childId) => childId in sanitized);
    }
    if (n.linkedNodes) {
      const linked: Record<string, string> = {};
      for (const [key, childId] of Object.entries(n.linkedNodes)) {
        if (childId in sanitized) linked[key] = childId;
      }
      n.linkedNodes = linked;
    }
  }

  return sanitized;
}
