/**
 * LadiPage (mewedding.vn) HTML → Craft.js converter.
 *
 * LadiPage DOM structure:
 * .ladi-section
 *   .ladi-container
 *     .ladi-element#GROUP4 (CSS: top=148 left=20 width=380 height=380)
 *       .ladi-group
 *         .ladi-element#HEADLINE3 (text content here)
 *           .ladi-headline
 *         .ladi-element#BOX1
 *           .ladi-box
 *
 * CSS positions are stored in <style> tags, keyed by element ID.
 * We accumulate positions by walking UP the DOM and summing CSS positions.
 *
 * Canvas: 390px (scaled from 420px mobile).
 */
import { parse } from "node-html-parser";
import { buildElementStyleMap } from "./ladipage-css-parser.mjs";

const CANVAS = 390;
const MOBILE_WIDTH = 420;

function scale(v) { return Math.round(v * CANVAS / MOBILE_WIDTH); }
function px(v, f = 0) { if (v == null || v === "") return f; const m = String(v).match(/(-?\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : f; }
function slugId(raw, n) { const b = (raw || `lp-${n}`).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40); return `lp-${b}-${n}`; }

function nodeAttr(n, a) { return n.getAttribute ? n.getAttribute(a) || "" : ""; }
function cls(n) { return nodeAttr(n, "class"); }
function id(n) { return nodeAttr(n, "id"); }

function decode(s) {
  return (s || "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}

function extractText(n) {
  return decode((n.textContent || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/\n+/g, "\n").trim());
}

function rgbToHex(s) {
  if (!s || s.startsWith("#")) return s;
  const m = s.match(/rgb[a]?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map(Number);
  if (p.length < 3) return null;
  return `#${p.slice(0,3).map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("")}`;
}

function normFont(s) {
  if (!s) return "inherit";
  const l = s.toLowerCase();
  if (l.includes("dancing") || l.includes("greatvibes")) return '"Dancing Script", cursive';
  if (l.includes("sriracha") || l.includes("vbsrvn")) return '"Sriracha", cursive';
  if (l.includes("montserrat")) return '"Montserrat", sans-serif';
  if (l.includes("roboto slab")) return '"Roboto Slab", serif';
  if (l.includes("playfair")) return '"Playfair Display", serif';
  if (l.includes("philosopher")) return '"Philosopher", sans-serif';
  if (l.includes("open sans")) return '"Open Sans", sans-serif';
  if (l.includes("itim") || l.includes("lobster") || l.includes("baloo") || l.includes("shantell")) return '"Sriracha", cursive';
  return s;
}

function fw(v) { const n = parseInt(v, 10); if (n >= 700 || v === "bold") return "bold"; if (n >= 600) return "600"; return "normal"; }

function mkNode(type, name, props, parent, kids = []) {
  return { type: { resolvedName: type }, isCanvas: type === "SectionBlock" || type === "RootCanvas", props, displayName: name, custom: {}, hidden: false, nodes: kids, linkedNodes: {}, parent };
}

/**
 * Get position (top, left) by walking UP the DOM from `node`,
 * accumulating CSS positions from each ancestor with a ladi-group ID.
 * The "group" for an element is the nearest ancestor with a CSS ID that has position data.
 */
function getPos(node, absTop, absLeft, cssMap) {
  let top = absTop, left = absLeft;
  let p = node.parentNode;
  let depth = 0;
  while (p && p.nodeType === 1 && depth < 30) {
    depth++;
    const pid = id(p);
    if (pid) {
      const st = (cssMap[pid] || {}).default || {};
      const t = px(st.top); const l = px(st.left);
      if (t || l) { top += t; left += l; }
    }
    if (cls(p).includes("ladi-section") || cls(p).includes("ladi-container")) break;
    p = p.parentNode;
  }
  return { top, left };
}

/**
 * Get size (width, height) by walking UP the DOM from `node`.
 */
function getSize(node, dw, dh, cssMap) {
  let w = 0, h = 0;
  let p = node.parentNode;
  let depth = 0;
  while (p && p.nodeType === 1 && depth < 30) {
    depth++;
    const pid = id(p);
    if (pid) {
      const st = (cssMap[pid] || {}).default || {};
      const pw = px(st.width); const ph = px(st.height);
      if (pw) w = pw;
      if (ph) h = ph;
    }
    if (cls(p).includes("ladi-section") || cls(p).includes("ladi-container")) break;
    p = p.parentNode;
  }
  return { width: w || dw, height: h || dh };
}

/**
 * @param {string} html
 */
export function ladipageHtmlToCraftJson(html) {
  const root = parse(html, { comment: false });
  const cssMap = buildElementStyleMap(html);
  const nodes = {};
  const sectionIds = [];
  let counter = 0;

  // ── Node factory helpers ───────────────────────────────────────────────
  function add(secId, kids, seed, type, name, props) {
    const nid = slugId(seed, ++counter);
    nodes[nid] = mkNode(type, name, props, secId, []);
    kids.push(nid);
    return nid;
  }

  function addText(secId, kids, seed, p) {
    add(secId, kids, seed, "TextBlock", p.displayName || "Text", {
      content: p.content ?? "",
      fontSize: p.fontSize ?? 16,
      fontFamily: p.fontFamily ?? '"Open Sans", sans-serif',
      color: p.color ?? "#333333",
      textAlign: p.textAlign ?? "left",
      fontWeight: p.fontWeight ?? "normal",
      fontStyle: p.fontStyle ?? "normal",
      lineHeight: p.lineHeight ?? 1.4,
      letterSpacing: p.letterSpacing ?? 0,
      opacity: p.opacity ?? 100,
      backgroundColor: p.backgroundColor ?? "transparent",
      borderRadius: p.borderRadius ?? 0,
      paddingX: p.paddingX ?? 0,
      paddingY: p.paddingY ?? 0,
      top: p.top ?? 0,
      left: p.left ?? 0,
      width: p.width ?? 300,
      height: p.height,
      elementId: p.elementId ?? "",
    });
  }

  function addImage(secId, kids, seed, p) {
    add(secId, kids, seed, "ImageBlock", "Hình ảnh", {
      src: p.src || "",
      alt: p.alt || "",
      objectFit: p.objectFit ?? "cover",
      borderRadius: p.borderRadius ?? 0,
      opacity: p.opacity ?? 100,
      elementId: p.elementId ?? "",
      top: p.top ?? 0,
      left: p.left ?? 0,
      width: p.width ?? 200,
      height: p.height ?? 200,
    });
  }

  function addShape(secId, kids, seed, p) {
    add(secId, kids, seed, "TextBlock", "Shape", {
      content: "",
      fontSize: 1,
      color: "transparent",
      backgroundColor: p.backgroundColor ?? "transparent",
      borderRadius: p.borderRadius ?? 0,
      opacity: p.opacity ?? 100,
      paddingX: 0, paddingY: 0,
      top: p.top ?? 0,
      left: p.left ?? 0,
      width: p.width ?? 100,
      height: p.height ?? 50,
      elementId: p.elementId ?? "",
    });
  }

  function addButton(secId, kids, seed, p) {
    add(secId, kids, seed, "ButtonBlock", "Button", {
      label: p.label ?? "Button",
      bgColor: p.bgColor ?? "#888888",
      textColor: p.textColor ?? "#ffffff",
      fontSize: p.fontSize ?? 14,
      fontFamily: p.fontFamily ?? '"Montserrat", sans-serif',
      fontWeight: p.fontWeight ?? "normal",
      borderRadius: p.borderRadius ?? 0,
      paddingX: p.paddingX ?? 10,
      paddingY: p.paddingY ?? 5,
      opacity: p.opacity ?? 100,
      elementId: p.elementId ?? "",
      top: p.top ?? 0,
      left: p.left ?? 0,
      width: p.width ?? 120,
      height: p.height ?? 40,
    });
  }

  // ── Section walker ────────────────────────────────────────────────────
  function walkContainer(el, secId, kids, absTop, absLeft) {
    const nodes2 = el.childNodes || [];
    for (let i = 0; i < nodes2.length; i++) {
      const child = nodes2[i];
      if (child.nodeType !== 1) continue;

      const ccls = cls(child);
      const ctag = child.tagName?.toLowerCase() || "";
      const cid = id(child);

      // Skip
      if (ccls.includes("ladi-section-background")) continue;
      if (ctag === "script" || ctag === "style" || ctag === "link") continue;

      // .ladi-container → walk inside
      if (ccls.includes("ladi-container")) {
        walkContainer(child, secId, kids, absTop, absLeft);
        continue;
      }

      // .ladi-element wrapper (like .ladi-group containers or content wrappers)
      // These may have CSS position and contain the actual content element
      if (ccls.includes("ladi-element")) {
        // Get styles for this element (the wrapper)
        const st = (cssMap[cid] || {}).default || {};

        // Check if there's a content element inside (not a ladi-group)
        let innerContent = null;
        let innerGroup = null;
        for (const gc of child.childNodes || []) {
          if (gc.nodeType !== 1) continue;
          const gcCls = cls(gc);
          if (gcCls.includes("ladi-group") && !gcCls.includes("ladi-element")) {
            innerGroup = gc;
            break;
          }
          if (gcCls.includes("ladi-headline") || gcCls.includes("ladi-paragraph") ||
              gcCls.includes("ladi-image") || gcCls.includes("ladi-button") ||
              gcCls.includes("ladi-box") || gcCls.includes("ladi-shape")) {
            innerContent = gc;
          }
        }

        if (innerGroup) {
          // Walk into the inner group with this element's position
          const pos = getPos(child, absTop, absLeft, cssMap);
          walkContainer(innerGroup, secId, kids, pos.top, pos.left);
        } else if (innerContent) {
          // Process the inner content element using this wrapper's position
          const icls = cls(innerContent);
          const iid = id(innerContent) || cid; // use wrapper id if no inner id
          const ist = (cssMap[iid] || {}).default || {};
          const pos = getPos(child, absTop, absLeft, cssMap);
          const sz = getSize(child, 300, 50, cssMap);

          if (icls.includes("ladi-headline") || icls.includes("ladi-paragraph")) {
            const text = extractText(innerContent);
            if (text) {
              addText(secId, kids, cid, {
                content: text,
                fontSize: scale(px(ist.font_size || st.font_size, 16)),
                fontFamily: normFont(ist["font-family"] || st["font-family"]),
                color: rgbToHex(ist.color || st.color) || "#333333",
                textAlign: ((ist["text-align"] || st["text-align"] || "left") || "left").replace(/"/g, ""),
                fontWeight: fw(ist["font-weight"] || st["font-weight"]),
                fontStyle: (ist["font-style"] || st["font-style"]) === "italic" ? "italic" : "normal",
                lineHeight: parseFloat(ist["line-height"] || st["line-height"] || 1.4),
                opacity: (ist.opacity ? parseFloat(ist.opacity) * 100 : (st.opacity ? parseFloat(st.opacity) * 100 : 100)),
                top: scale(pos.top),
                left: scale(pos.left),
                width: scale(sz.width),
                height: scale(sz.height),
                elementId: cid,
              });
            }
          } else if (icls.includes("ladi-image")) {
            const bg = st["background-image"] || st.background || "";
            let src = "";
            if (bg.startsWith("url(")) src = bg.match(/url\(["']?([^"')]+)["']?\)/i)?.[1] || "";
            if (!src) { const img = innerContent.querySelector?.("img"); if (img) src = img.getAttribute?.("src") || ""; }
            if (src) {
              addImage(secId, kids, cid, {
                src,
                alt: st["data-name"] || "Image",
                objectFit: (st["background-size"] || "").includes("contain") ? "contain" : "cover",
                borderRadius: scale(px(st["border-radius"], 0)),
                opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
                top: scale(pos.top),
                left: scale(pos.left),
                width: scale(sz.width),
                height: scale(sz.height),
                elementId: cid,
              });
              continue;
            }
          } else if (icls.includes("ladi-button")) {
            let label = extractText(innerContent) || "Button";
            const hl = innerContent.querySelector?.(".ladi-headline");
            if (hl) label = extractText(hl);
            addButton(secId, kids, cid, {
              label,
              bgColor: rgbToHex(ist.background || st.background) || "#888888",
              textColor: rgbToHex(ist.color || st.color) || "#ffffff",
              fontSize: scale(px(ist.font_size || st.font_size || "14", 14)),
              fontFamily: normFont(ist["font-family"] || st["font-family"]),
              fontWeight: fw(ist["font-weight"] || st["font-weight"]),
              borderRadius: scale(px(ist["border-radius"] || st["border-radius"], 8)),
              opacity: ist.opacity ? Math.round(parseFloat(ist.opacity) * 100) : 100,
              top: scale(pos.top),
              left: scale(pos.left),
              width: scale(sz.width),
              height: scale(sz.height),
              elementId: cid,
            });
            continue;
          } else if (icls.includes("ladi-box") || icls.includes("ladi-shape")) {
            const bg = ist.background || st.background || "";
            const hasBg = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";
            if (hasBg || ist["border-style"]) {
              addShape(secId, kids, cid, {
                backgroundColor: hasBg ? (rgbToHex(bg) || bg) : "transparent",
                borderRadius: scale(px(ist["border-radius"] || st["border-radius"], 0)),
                opacity: ist.opacity ? Math.round(parseFloat(ist.opacity) * 100) : 100,
                top: scale(pos.top),
                left: scale(pos.left),
                width: scale(sz.width),
                height: scale(sz.height),
                elementId: cid,
              });
            }
          }
        }
        // Also walk into nested ladi-element children
        for (const gc of child.childNodes || []) {
          if (gc.nodeType !== 1) continue;
          const gcCls = cls(gc);
          const gcId = id(gc);
          if (gcCls.includes("ladi-element") && gcId && !gcCls.includes("ladi-group")) {
            // This is a nested ladi-element with its own ID - process it
            const gcPos = getPos(gc, absTop, absLeft, cssMap);
            const gcSz = getSize(gc, 300, 50, cssMap);
            const gcSt = (cssMap[gcId] || {}).default || {};
            const gcContent = gc.querySelector?.(".ladi-headline, .ladi-paragraph, .ladi-image, .ladi-button, .ladi-box, .ladi-shape");
            if (gcContent) {
              const gcc = cls(gcContent);
              if (gcc.includes("ladi-headline") || gcc.includes("ladi-paragraph")) {
                const text = extractText(gcContent);
                if (text) addText(secId, kids, gcId, {
                  content: text,
                  fontSize: scale(px(gcSt.font_size, 16)),
                  fontFamily: normFont(gcSt["font-family"]),
                  color: rgbToHex(gcSt.color) || "#333333",
                  textAlign: ((gcSt["text-align"]) || "left").replace(/"/g, ""),
                  fontWeight: fw(gcSt["font-weight"]),
                  lineHeight: parseFloat(gcSt["line-height"] || 1.4),
                  top: scale(gcPos.top),
                  left: scale(gcPos.left),
                  width: scale(gcSz.width),
                  height: scale(gcSz.height),
                  elementId: gcId,
                });
              }
            }
          }
        }
        continue;
      }

      // .ladi-element with no id → skip
      if (!cid) continue;

      // Skip non-content elements
      if (cid.startsWith("SECTION") || cid.startsWith("POPUP") || cid.startsWith("BACKDROP")) continue;

      // ── Content types ───────────────────────────────────────────────

      // .ladi-headline / .ladi-paragraph → Text
      if (ccls.includes("ladi-headline") || ccls.includes("ladi-paragraph")) {
        const text = extractText(child);
        if (text) {
          const st = (cssMap[cid] || {}).default || {};
          const pos = getPos(child, absTop, absLeft, cssMap);
          const sz = getSize(child, 300, 50, cssMap);
          addText(secId, kids, cid, {
            content: text,
            fontSize: scale(px(st.font_size, 16)),
            fontFamily: normFont(st["font-family"]),
            color: rgbToHex(st.color) || "#333333",
            textAlign: (st["text-align"] || "left").replace(/"/g, ""),
            fontWeight: fw(st["font-weight"]),
            fontStyle: st["font-style"] === "italic" ? "italic" : "normal",
            lineHeight: parseFloat(st["line-height"] || 1.4),
            letterSpacing: scale(px(st["letter-spacing"], 0)),
            opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
            top: scale(pos.top),
            left: scale(pos.left),
            width: scale(sz.width),
            height: scale(sz.height),
            elementId: cid,
          });
        }
        continue;
      }

      // .ladi-image → Image
      if (ccls.includes("ladi-image")) {
        // Try this element's ID first, then parent's ID
        const myId = cid;
        const parentId = child.parentNode && child.parentNode.getAttribute ? child.parentNode.getAttribute("id") || "" : "";
        const useId = myId || parentId;
        const st = useId ? ((cssMap[useId] || {}).default || {}) : {};
        const bg = st["background-image"] || st.background || "";
        let src = "";
        if (bg.startsWith("url(")) src = bg.match(/url\(["']?([^"')]+)["']?\)/i)?.[1] || "";
        if (!src) { const img = child.querySelector("img"); if (img) src = img.getAttribute("src") || ""; }
        if (src) {
          const pos = getPos(child, absTop, absLeft, cssMap);
          const sz = getSize(child, 200, 200, cssMap);
          addImage(secId, kids, useId || cid, {
            src,
            alt: st["data-name"] || "Image",
            objectFit: st["background-size"]?.includes("contain") ? "contain" : "cover",
            borderRadius: scale(px(st["border-radius"], 0)),
            opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
            top: scale(pos.top),
            left: scale(pos.left),
            width: scale(sz.width),
            height: scale(sz.height),
            elementId: useId || cid,
          });
        }
        continue;
      }

      // .ladi-element wrapper containing .ladi-image (image inside wrapper without its own ID)
      // Check if this element's child has ladi-image and extract image URL
      if (ccls.includes("ladi-element") && cid) {
        const st = (cssMap[cid] || {}).default || {};
        const imgChild = child.querySelector ? child.querySelector(".ladi-image") : null;
        if (imgChild) {
          const bg = st["background-image"] || st.background || "";
          let src = "";
          if (bg.startsWith("url(")) src = bg.match(/url\(["']?([^"')]+)["']?\)/i)?.[1] || "";
          if (!src) {
            const imgEl = child.querySelector ? child.querySelector("img") : null;
            if (imgEl) src = imgEl.getAttribute ? imgEl.getAttribute("src") || "" : "";
          }
          if (!src) {
            const diAttr = imgChild.getAttribute ? imgChild.getAttribute("data-image") : "";
            if (diAttr) src = diAttr;
          }
          if (src) {
            const pos = getPos(child, absTop, absLeft, cssMap);
            const sz = getSize(child, 200, 200, cssMap);
            addImage(secId, kids, cid, {
              src,
              alt: st["data-name"] || "Image",
              objectFit: "cover",
              borderRadius: scale(px(st["border-radius"], 0)),
              opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
              top: scale(pos.top),
              left: scale(pos.left),
              width: scale(sz.width),
              height: scale(sz.height),
              elementId: cid,
            });
            continue;
          }
        }
      }

      // .ladi-button → Button
      if (ccls.includes("ladi-button")) {
        const st = (cssMap[cid] || {}).default || {};
        let label = "";
        const hl = child.querySelector(".ladi-headline");
        if (hl) label = extractText(hl);
        if (!label) {
          const divs = child.querySelectorAll("div");
          for (const d of Array.from(divs)) {
            const t = decode(d.textContent || "").trim();
            if (t && !d.querySelector("svg")) { label = t; break; }
          }
        }
        if (!label) label = extractText(child) || "Button";
        const pos = getPos(child, absTop, absLeft, cssMap);
        const sz = getSize(child, 120, 40, cssMap);
        addButton(secId, kids, cid, {
          label,
          bgColor: rgbToHex(st.background) || "#888888",
          textColor: rgbToHex(st.color) || "#ffffff",
          fontSize: scale(px(st.font_size, 14)),
          fontFamily: normFont(st["font-family"]),
          fontWeight: fw(st["font-weight"]),
          borderRadius: scale(px(st["border-radius"], 8)),
          opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
          top: scale(pos.top),
          left: scale(pos.left),
          width: scale(sz.width),
          height: scale(sz.height),
          elementId: cid,
        });
        continue;
      }

      // .ladi-box / .ladi-shape → Shape
      if (ccls.includes("ladi-box") || ccls.includes("ladi-shape")) {
        const st = (cssMap[cid] || {}).default || {};
        const bg = st.background || "";
        const hasBg = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";
        const pos = getPos(child, absTop, absLeft, cssMap);
        const sz = getSize(child, 100, 50, cssMap);
        if (hasBg || st["border-style"]) {
          addShape(secId, kids, cid, {
            backgroundColor: hasBg ? (rgbToHex(bg) || bg) : "transparent",
            borderRadius: scale(px(st["border-radius"], 0)),
            opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
            top: scale(pos.top),
            left: scale(pos.left),
            width: scale(sz.width),
            height: scale(sz.height),
            elementId: cid,
          });
        }
        continue;
      }

      // .ladi-gallery → extract images
      if (ccls.includes("ladi-gallery")) {
        const pos = getPos(child, absTop, absLeft, cssMap);
        const sz = getSize(child, 390, 300, cssMap);
        const imgs = child.querySelectorAll(".ladi-image");
        let cnt = 0;
        for (const imgEl of Array.from(imgs)) {
          if (cnt >= 6) break;
          const iid = id(imgEl) || `${cid}-img-${cnt}`;
          const ist = (cssMap[iid] || {}).default || {};
          const ibg = ist["background-image"] || ist.background || "";
          const isrc = ibg.startsWith("url(") ? ibg.match(/url\(["']?([^"')]+)["']?\)/i)?.[1] : "";
          if (isrc) {
            const ipos = getPos(imgEl, pos.top, pos.left, cssMap);
            const isz = getSize(imgEl, 80, 80, cssMap);
            addImage(secId, kids, iid, {
              src: isrc,
              alt: `Gallery ${cnt + 1}`,
              objectFit: "cover",
              borderRadius: scale(px(ist["border-radius"], 4)),
              top: scale(ipos.top),
              left: scale(ipos.left),
              width: scale(isz.width),
              height: scale(isz.height),
              elementId: iid,
            });
            cnt++;
          }
        }
        continue;
      }

      // .ladi-carousel → first slide
      if (ccls.includes("ladi-carousel")) {
        const pos = getPos(child, absTop, absLeft, cssMap);
        const sz = getSize(child, 390, 300, cssMap);
        const firstImg = child.querySelector(".ladi-image");
        if (firstImg) {
          const iid = id(firstImg) || `${cid}-slide`;
          const ist = (cssMap[iid] || {}).default || {};
          const ibg = ist["background-image"] || ist.background || "";
          const isrc = ibg.startsWith("url(") ? ibg.match(/url\(["']?([^"')]+)["']?\)/i)?.[1] : "";
          if (isrc) {
            addImage(secId, kids, `${cid}-slide`, {
              src: isrc,
              alt: "Carousel",
              objectFit: "cover",
              top: scale(pos.top),
              left: scale(pos.left),
              width: scale(sz.width),
              height: scale(sz.height),
              elementId: `${cid}-slide`,
            });
          }
        }
        continue;
      }

      // .ladi-form → extract inputs
      if (ccls.includes("ladi-form")) {
        const pos = getPos(child, absTop, absLeft, cssMap);
        const inputs = child.querySelectorAll("input, select, textarea, button");
        let yOff = 0;
        for (const inp of Array.from(inputs)) {
          const itype = inp.getAttribute("type") || inp.tagName.toLowerCase();
          const ist = (cssMap[inp.getAttribute("id") || ""] || {}).default || {};
          const ih = px(ist.height, 44);
          const iw = px(ist.width, 300);
          if (itype === "submit" || itype === "button") {
            addButton(secId, kids, inp.getAttribute("id") || `submit-${counter}`, {
              label: decode(inp.textContent || "Gửi"),
              bgColor: rgbToHex(ist.background || ist.background_color) || "#3c72f9",
              textColor: rgbToHex(ist.color) || "#ffffff",
              fontSize: scale(px(ist.font_size, 16)),
              fontWeight: fw(ist["font-weight"]),
              borderRadius: scale(px(ist["border-radius"], 8)),
              top: scale(pos.top + yOff),
              left: scale(pos.left),
              width: scale(iw),
              height: scale(ih),
            });
          } else {
            addText(secId, kids, inp.getAttribute("id") || `field-${counter}`, {
              content: inp.getAttribute("placeholder") || "Nhập thông tin",
              fontSize: scale(px(ist.font_size, 14)),
              fontFamily: normFont(ist["font-family"]),
              color: rgbToHex(ist.color) || "#333333",
              backgroundColor: "transparent",
              borderRadius: scale(px(ist["border-radius"], 4)),
              borderStyle: "solid",
              borderWidth: 1,
              borderColor: rgbToHex(ist["border-color"]) || "#cccccc",
              top: scale(pos.top + yOff),
              left: scale(pos.left),
              width: scale(iw),
              height: scale(ih),
            });
          }
          yOff += ih + 10;
        }
        continue;
      }
    }
  }

  // ── Process all sections ────────────────────────────────────────────
  root.querySelectorAll(".ladi-section").forEach((secEl, idx) => {
    const secId_ = id(secEl) || `section-${idx + 1}`;
    const secId = slugId(secId_, ++counter);
    sectionIds.push(secId);

    const secSt = (cssMap[secId_] || {}).default || {};
    const secH = scale(px(secSt.height, 500));

    const kids = [];

    // Section background color
    const secBg = secSt.background_color || secSt.background || "";
    if (secBg && secBg !== "transparent" && secBg !== "rgba(0, 0, 0, 0)") {
      addShape(secId, kids, `${secId}-bg`, {
        backgroundColor: rgbToHex(secBg) || secBg,
        top: 0, left: 0,
        width: CANVAS,
        height: secH,
        borderRadius: 0,
        opacity: 100,
      });
    }

    // Walk section's container (if any)
    const container = secEl.querySelector(".ladi-container");
    if (container) {
      walkContainer(container, secId, kids, 0, 0);
    } else {
      walkContainer(secEl, secId, kids, 0, 0);
    }

    nodes[secId] = mkNode("SectionBlock", "Section", {
      height: secH,
      bgType: "color",
      bgColor: "#ffffff",
      overlayType: "none",
      overlayOpacity: 0,
    }, "ROOT", kids);

    for (const cid of kids) {
      if (nodes[cid]) nodes[cid].parent = secId;
    }
  });

  nodes.ROOT = mkNode("RootCanvas", "Canvas", {}, null, sectionIds);
  return nodes;
}

export function ladipageHtmlToCraftContentJson(html) {
  return ladipageHtmlToCraftJson(html);
}
