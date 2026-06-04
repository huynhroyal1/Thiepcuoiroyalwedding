/**
 * Parse LadiPage CSS rules to extract element positions.
 * LadiPage stores all positions in CSS <style> tags, not inline styles.
 * Each element has CSS rules like:
 *   #HEADLINE3{width: 663px;}
 *   #HEADLINE3 > .ladi-headline{font-size: 65px;}
 *   @media (max-width: 767px) { #HEADLINE33{top: 28.167px; left: 7.5px;} }
 */

import { parse } from "node-html-parser";

/**
 * Parse a CSS declaration block and return key-value styles
 */
function parseCssDecl(decl) {
  const styles = {};
  if (!decl) return styles;
  const parts = decl.split(";");
  for (const part of parts) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (key && val) styles[key] = val;
  }
  return styles;
}

/**
 * Extract all CSS rules from a CSS text block.
 * Returns array of {selector, decl, mediaQuery}
 */
function extractCssRules(cssText) {
  const rules = [];
  // Remove comments
  const cleanCss = cssText.replace(/\/\*[\s\S]*?\*\//g, "");

  // Match @media queries
  const mediaRegex = /@media\s*\([^{]+\)\s*\{([\s\S]*?)\}\s*\}/g;
  let mediaMatch;
  while ((mediaMatch = mediaRegex.exec(cleanCss)) !== null) {
    const mediaQuery = mediaMatch[0].match(/@media\([^)]\)/)?.[0] || "";
    const body = mediaMatch[1];
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let ruleMatch;
    while ((ruleMatch = ruleRegex.exec(body)) !== null) {
      rules.push({
        selector: ruleMatch[1].trim(),
        decl: ruleMatch[2].trim(),
        media: mediaQuery,
        isMobile: mediaQuery.includes("max-width"),
      });
    }
  }

  // Match regular rules (not inside @media)
  const ruleRegex2 = /([^{}@]+)\{([^{}]*)\}/g;
  let ruleMatch2;
  while ((ruleMatch2 = ruleRegex2.exec(cleanCss)) !== null) {
    const selector = ruleMatch2[1].trim();
    // Skip if this is inside a @media (already handled)
    if (cleanCss.substring(0, ruleMatch2.index).match(/@media[^{]*\{[\s\S]*$/)) continue;
    rules.push({
      selector,
      decl: ruleMatch2[2].trim(),
      media: "",
      isMobile: false,
    });
  }

  return rules;
}

/**
 * Build a lookup map: elementId -> {styles, media}
 * For elements with multiple rules (desktop + mobile), prefer mobile.
 */
function buildElementStyleMap(html) {
  const root = parse(html, { comment: false });

  // Collect all CSS from <style> tags
  const styleTags = root.querySelectorAll("style");
  let allCss = "";
  styleTags.forEach((t) => {
    allCss += t.innerHTML + "\n";
  });

  const rules = extractCssRules(allCss);

  // Build element map
  const elementMap = {}; // id -> {styles, media}

  for (const rule of rules) {
    // Find element IDs in selector
    // Handle: #HEADLINE3, #GROUP4, or selectors like #HEADLINE3 > .ladi-headline
    // We extract the FIRST ID in the selector as the target element
    const idMatches = rule.selector.match(/#([A-Z][A-Z0-9_]+)/g);
    if (!idMatches || idMatches.length === 0) continue;

    const styles = parseCssDecl(rule.decl);
    const hasPosition = styles.top !== undefined || styles.left !== undefined ||
                       styles.width !== undefined || styles.height !== undefined ||
                       styles.background !== undefined || styles.background_color !== undefined ||
                       styles.background_image !== undefined || styles.color !== undefined ||
                       styles.font_size !== undefined || styles.font_family !== undefined ||
                       styles.font_weight !== undefined || styles.text_align !== undefined ||
                       styles.line_height !== undefined || styles.letter_spacing !== undefined ||
                       styles.border !== undefined || styles.border_radius !== undefined ||
                       styles.border_color !== undefined || styles.border_width !== undefined ||
                       styles.border_style !== undefined || styles.opacity !== undefined ||
                       styles.filter !== undefined || styles.animation !== undefined ||
                       styles.transform !== undefined || styles.position !== undefined;

    // For descendant selectors like "#HEADLINE3 > .ladi-headline", the parent ID (#HEADLINE3)
    // also inherits the child styles conceptually, so we apply them to the parent too.
    // The child element (#HEADLINE3 > .ladi-headline) styles (font-size, color, etc.) apply to
    // the child DOM element, but conceptually should affect the parent Craft node too.
    for (const idSelector of idMatches) {
      const elId = idSelector.slice(1); // remove #
      if (!elementMap[elId]) {
        elementMap[elId] = { desktop: {}, mobile: {}, default: {} };
      }

      const target = rule.isMobile ? "mobile" : rule.media === "" ? "default" : "desktop";

      // For child selectors (#PARENT > .child), apply the child's styles to both parent and a "child" sub-entry
      const isDirectChild = rule.selector.includes(">");
      const isDescendantSelector = idMatches.length > 1 || (rule.selector.trim().indexOf("#" + elId) > 0);

      // Always apply to the element
      Object.assign(elementMap[elId][target], styles);

      // If this is a child selector (#ID > .child), also store in "child" sub-entry
      if (isDirectChild && !isDescendantSelector) {
        if (!elementMap[elId][target]._childStyles) {
          elementMap[elId][target]._childStyles = {};
        }
        Object.assign(elementMap[elId][target]._childStyles, styles);
      }
    }
  }

  return elementMap;
}

/**
 * Get computed styles for an element, preferring mobile values
 */
export function getElementStyles(elementMap, elementId) {
  const entry = elementMap[elementId];
  if (!entry) return {};

  // Prefer: mobile > desktop > default
  return {
    ...entry.default,
    ...entry.desktop,
    ...entry.mobile,
  };
}

/**
 * Get dimension (width/height) - use desktop if mobile is empty
 */
export function getElementDims(elementMap, elementId) {
  const styles = getElementStyles(elementMap, elementId);
  return {
    width: parseFloat(styles.width) || 0,
    height: parseFloat(styles.height) || 0,
  };
}

/**
 * Get position (top/left) - prefer mobile if available
 */
export function getElementPosition(elementMap, elementId) {
  const entry = elementMap[elementId];
  if (!entry) return { top: 0, left: 0 };

  // Use mobile position if available, else desktop
  const mobile = entry.mobile;
  const desktop = entry.desktop;
  const def = entry.default;

  return {
    top: parseFloat(mobile.top ?? desktop.top ?? def.top ?? 0),
    left: parseFloat(mobile.left ?? desktop.left ?? def.left ?? 0),
  };
}

/**
 * Get width (prefer mobile, fallback to desktop)
 */
export function getWidth(elementMap, elementId, fallback = 420) {
  const entry = elementMap[elementId];
  if (!entry) return fallback;
  return parseFloat(entry.mobile.width ?? entry.desktop.width ?? entry.default.width ?? fallback);
}

/**
 * Get height (prefer mobile, fallback to desktop)
 */
export function getHeight(elementMap, elementId, fallback = 400) {
  const entry = elementMap[elementId];
  if (!entry) return fallback;
  return parseFloat(entry.mobile.height ?? entry.desktop.height ?? entry.default.height ?? fallback);
}

/**
 * Get all element IDs that have position info
 */
export function getAllElementIds(elementMap) {
  return Object.keys(elementMap);
}

export { buildElementStyleMap, parseCssDecl, extractCssRules };
