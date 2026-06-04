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

  // Check for actual ROOT key (standard Craft.js format)
  const rootResolvedName = getResolvedName(c.ROOT);
  if (rootResolvedName === "RootCanvas") {
    console.log('[isCraftContentJson] Found ROOT with RootCanvas');
    return true;
  }

  // Fallback: check if any node has parent === "ROOT" (imported mehappy format)
  const hasRootParent = Object.values(c).some((node) => {
    if (!node || typeof node !== "object") return false;
    const n = node as CraftNode;
    return n.parent === "ROOT" && getResolvedName(node) !== undefined;
  });
  console.log('[isCraftContentJson] hasRootParent:', hasRootParent);
  return hasRootParent;
}

/**
 * Drop non-node keys (e.g. raw-html `type`/`html` strings) and nodes with missing/unknown types
 * so Craft.js deserialize does not throw "Cannot find component <undefined />".
 */
export function sanitizeCraftContent(raw: Record<string, unknown>): Record<string, unknown> {
  if (raw.type === "raw-html") return raw;

  const sanitized: Record<string, unknown> = {};
  let hasRootParent = false;

  for (const [id, node] of Object.entries(raw)) {
    if (node == null || typeof node !== "object") continue;

    const resolvedName = getResolvedName(node);
    if (!resolvedName || !CRAFT_RESOLVER_NAMES.has(resolvedName)) continue;

    // Track if any node has parent === "ROOT" (imported mehappy format without ROOT key)
    const n = node as CraftNode;
    if (n.parent === "ROOT") hasRootParent = true;

    sanitized[id] = {
      ...(node as CraftNode),
      type: { resolvedName },
    };
  }

  // If no actual ROOT key but nodes have parent === "ROOT", inject a virtual ROOT node
  if (hasRootParent && !sanitized["ROOT"]) {
    sanitized["ROOT"] = {
      type: { resolvedName: "RootCanvas" },
      isCanvas: true,
      props: {},
      displayName: "Root",
      custom: {},
      hidden: false,
      nodes: Object.keys(sanitized).filter((id) => {
        const node = sanitized[id] as CraftNode;
        return node.parent === "ROOT";
      }),
      linkedNodes: {},
    };
    console.log('[sanitizeCraftContent] Injected virtual ROOT node with', sanitized.ROOT.nodes.length, 'children');
  }

  for (const node of Object.values(sanitized)) {
    if (!node || typeof node !== "object") continue;
    const n = node as CraftNode;
    if (n.id === "ROOT") continue; // skip ROOT node itself
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

  console.log('[sanitizeCraftContent] output keys count:', Object.keys(sanitized).length);

  return sanitized;
}
