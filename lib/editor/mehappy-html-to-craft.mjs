/**
 * Chuyển HTML MeHappy (sections-wrapper) → Craft.js content_json.
 * Scale content-container (380|400px) → 390px canvas; giữ text, vị trí, font, ảnh, icon, animation.
 */

import { parse } from "node-html-parser";

const CANVAS = 390;

function makeScale(sourceWidth) {
  const sw = sourceWidth > 0 ? sourceWidth : 400;
  const ratio = CANVAS / sw;
  return (n) => Math.round(Number(n) * ratio);
}

function block(typeName, displayName, props, parent, childIds = []) {
  return {
    type: { resolvedName: typeName },
    isCanvas: typeName === "SectionBlock" || typeName === "RootCanvas",
    props,
    displayName,
    custom: {},
    hidden: false,
    nodes: childIds,
    linkedNodes: {},
    parent,
  };
}

function detectSourceWidth(wrapper) {
  const cc = wrapper.querySelector(".content-container");
  if (cc) {
    const w = px(parseStyle(cc.getAttribute("style") || "").width);
    if (w >= 360 && w <= 420) return w;
  }
  const mw = wrapper.querySelector('[style*="max-width: 380px"]');
  if (mw) return 380;
  return 400;
}

function isHiddenSection(el) {
  const st = parseStyle(el.getAttribute("style") || "");
  return st.display === "none";
}

function parseTextShadow(st) {
  const raw = st["text-shadow"];
  if (!raw) return {};
  const m = raw.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i);
  if (!m) return {};
  return { textShadow: true, textShadowColor: m[0], textShadowX: 1, textShadowY: 1, textShadowBlur: 2 };
}

function parseTransformProps(st) {
  const t = st.transform || "";
  const out = {};
  const rx = t.match(/rotateX\((-?\d+(?:\.\d+)?)deg\)/);
  const ry = t.match(/rotateY\((-?\d+(?:\.\d+)?)deg\)/);
  const rz = t.match(/rotate(?:Z)?\((-?\d+(?:\.\d+)?)deg\)/);
  if (rx) out.rotateX = parseFloat(rx[1]);
  if (ry) out.rotateY = parseFloat(ry[1]);
  if (rz) out.rotateZ = parseFloat(rz[1]);
  if (st["transform-origin"]) out.transformOrigin = st["transform-origin"];
  return out;
}

function box(s, left, top, width, height) {
  const out = { top: s(top), left: s(left), width: Math.max(1, s(width)) };
  if (height != null && height > 0) out.height = s(height);
  return out;
}

function parseStyle(styleStr) {
  const out = {};
  if (!styleStr) return out;
  for (const part of styleStr.split(";")) {
    const idx = part.indexOf(":");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

function px(val, fallback = 0) {
  if (val == null || val === "") return fallback;
  const m = String(val).match(/(-?\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : fallback;
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function normalizeFontFamily(raw) {
  const font = (raw || "").replace(/^["']|["']$/g, "").trim();
  if (!font) return "inherit";
  const lower = font.toLowerCase();
  if (
    lower.includes("fz-photograph") ||
    lower.includes("fz-myeverything") ||
    lower.includes("greatvibes") ||
    lower.includes("great vibes") ||
    lower.includes("scarlet-bradley") ||
    lower.includes("vni 24 love") ||
    lower.includes("vni-springtime") ||
    lower.includes("uvnmautim") ||
    lower.includes("uvnhoatay") ||
    lower.includes("uvnvivi") ||
    lower.includes("uvnmoihong") ||
    lower.includes("high spirited") ||
    lower.includes("high-spirited") ||
    lower.includes("fairyland") ||
    lower.includes("peristiwa") ||
    lower.includes("svn-rollgatesluxury") ||
    lower.includes("vni-love") ||
    lower.includes("vni-shishonibrush") ||
    lower.includes("utm viceroy") ||
    lower.includes("utm a&s heartbeat") ||
    lower.includes("utm aquarelle") ||
    lower.includes("utm wedding") ||
    lower.includes("iciel rukola")
  ) {
    return '"Great Vibes", cursive';
  }
  if (lower.includes("arima")) return '"Arima", cursive';
  if (lower.includes("niramit")) return '"Niramit", sans-serif';
  if (lower.includes("pinyonscript") || lower.includes("pinyon script")) return '"Pinyon Script", cursive';
  if (lower.includes("sriracha")) return '"Sriracha", cursive';
  if (lower.includes("taviraj")) return '"Taviraj", serif';
  if (lower.includes("montserrat")) return '"Montserrat", sans-serif';
  if (lower.includes("roboto slab")) return '"Roboto Slab", serif';
  if (lower.includes("slide04") || lower.includes("newparisheadline")) return '"Playfair Display", serif';
  if (lower.includes("utm yen tu")) return '"Philosopher", sans-serif';
  if (lower.includes("fc-classy-vogue")) return '"Philosopher", sans-serif';
  if (lower.includes("dancing")) return '"Dancing Script", cursive';
  if (lower.includes("chonburi") || lower.includes("uvnbutlong") || lower.includes("vnmusti")) return '"Chonburi", cursive';
  if (lower.includes("uvnthutu")) return '"Great Vibes", cursive';
  if (lower.includes("mulish")) return '"Mulish", sans-serif';
  if (lower.includes("quicksand")) return '"Quicksand", sans-serif';
  if (lower.includes("yeseva")) return '"Yeseva One", cursive';
  if (lower.includes("playfair")) return '"Playfair Display", serif';
  if (lower.includes("philosopher")) return '"Philosopher", sans-serif';
  return font;
}

function hasClass(el, cls) {
  const c = el.getAttribute("class") || "";
  return c.split(/\s+/).includes(cls);
}

function animProps(el) {
  const cls = el.getAttribute("class") || "";
  const m = cls.match(/animate__(fadeIn\w*|zoomIn\w*|bounceIn\w*|slideIn\w*|flipIn\w*|rotateIn|jackInTheBox)/);
  if (!cls.includes("anim-hidden") && !m) return {};
  return { animationEntry: m?.[1] || "fadeInUp", animationDuration: 0.8 };
}

function appearProps(el, kind, pos = {}, opts = {}) {
  if (opts.skip) return {};
  const existing = animProps(el);
  if (existing.animationEntry) return existing;
  const top = Number(pos.top) || 0;
  const left = Number(pos.left) || 0;
  const delay = Math.round(Math.min(0.36, (Math.abs(top) % 360) / 360 * 0.3) * 100) / 100;
  let entry = "fadeInUp";
  if (kind === "image") {
    entry = left < -20 ? "fadeInLeft" : left > 190 ? "fadeInRight" : "zoomIn";
  } else if (kind === "icon") {
    entry = "zoomIn";
  } else if (kind === "button" || kind === "countdown") {
    entry = "fadeInUp";
  } else if (top < 90) {
    entry = "fadeInDown";
  }
  return {
    animationEntry: entry,
    animationDuration: kind === "image" ? 1 : 0.85,
    animationDelay: delay,
    animationLoop: false,
  };
}

function parseBackground(style) {
  const bg = style.background || style["background-image"] || "";
  const grad = bg.match(/linear-gradient\(([^)]+)\)/i);
  if (grad) {
    const parts = grad[1].split(",").map((p) => p.trim());
    const from = parts[0]?.replace(/^rgb[a]?\([^)]+\)|#[0-9a-f]+/i, (m) => m) ?? "#ffffff";
    const to = parts[parts.length - 1]?.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] ?? "#ffffff";
    return { bgType: "gradient", gradientFrom: from, gradientTo: to, gradientAngle: 180 };
  }
  const url = bg.match(/url\(["']?([^"')]+)["']?\)/i);
  if (url) {
    const size = style["background-size"] || "cover";
    const repeat = style["background-repeat"] || "no-repeat";
    const position = style["background-position"] || "center center";
    return {
      bgType: "image",
      bgUrl: url[1],
      bgSize: size.includes("contain") ? "contain" : "cover",
      bgRepeat: repeat,
      bgPosition: position,
    };
  }
  const rgb = bg.match(/rgb[a]?\([^)]+\)/i)?.[0];
  if (rgb) return { bgType: "color", bgColor: rgb };
  return { bgType: "color", bgColor: "#ffffff" };
}

function parseOverlay(sectionEl) {
  for (const child of sectionEl.childNodes) {
    if (child.nodeType !== 1) continue;
    const st = parseStyle(child.getAttribute("style") || "");
    if (
      st["pointer-events"] === "none" &&
      st.opacity &&
      parseFloat(st.opacity) > 0 &&
      st.background
    ) {
      const rgb = st.background.match(/rgb[a]?\([^)]+\)/i)?.[0] || "#000000";
      return {
        overlayType: "color",
        overlayColor: rgb,
        overlayOpacity: Math.round(parseFloat(st.opacity) * 100),
      };
    }
  }
  return { overlayType: "none", overlayOpacity: 0 };
}

function parseSectionBackground(sectionEl) {
  for (const child of sectionEl.childNodes) {
    if (child.nodeType !== 1) continue;
    const st = parseStyle(child.getAttribute("style") || "");
    if (st.background && st.position === "absolute") {
      return parseBackground(st);
    }
  }
  const wrap = sectionEl.querySelector(".content-wrapper");
  if (wrap) {
    const st = parseStyle(wrap.getAttribute("style") || "");
    if (st.background || st["background-image"]) return parseBackground(st);
  }
  return { bgType: "color", bgColor: "#ffffff" };
}

function extractText(el) {
  const span = el.querySelector("span");
  const raw = span ? span.innerHTML : el.textContent || "";
  return decodeHtml(
    raw
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim()
  );
}

function fontWeight(val) {
  const n = parseInt(val, 10);
  if (n >= 700 || val === "bold") return "bold";
  if (n >= 600) return "600";
  return "normal";
}

function parseLineHeight(st, fontSize) {
  const raw = st["line-height"];
  if (!raw) return 1.4;
  if (String(raw).endsWith("px")) return Math.max(0.8, px(raw, fontSize * 1.4) / fontSize);
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 1.4;
}

function parseTextStroke(st) {
  const raw = st["-webkit-text-stroke"] || st["text-stroke"] || "";
  const width = raw.match(/(\d+(?:\.\d+)?)px/)?.[1];
  const color = raw.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0];
  if (!width || !color) return {};
  return { textStroke: true, textStrokeWidth: parseFloat(width), textStrokeColor: color };
}

function parseBorder(st, s) {
  const raw = st.border || "";
  const style = raw.match(/\b(solid|dashed|dotted|double|groove|ridge)\b/i)?.[1]?.toLowerCase();
  const width = st["border-width"] || raw.match(/(\d+(?:\.\d+)?)px/)?.[0];
  const color = st["border-color"] || raw.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0];
  if (!style || style === "none") return {};
  return {
    borderStyle: style,
    borderWidth: s(px(width, 1)),
    borderColor: color || "#cccccc",
  };
}

function parseShadow(st) {
  const raw = st["box-shadow"] || "";
  const color = raw.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0];
  const nums = [...raw.matchAll(/(-?\d+(?:\.\d+)?)px/g)].map((m) => parseFloat(m[1]));
  if (!color || nums.length < 3) return {};
  return {
    shadowType: raw.includes("inset") ? "inner" : "outer",
    shadowColor: color,
    shadowX: nums[0],
    shadowY: nums[1],
    shadowBlur: Math.max(0, nums[2]),
    shadowOpacity: 35,
  };
}

function parseImageOverlay(el) {
  for (const child of el.childNodes) {
    if (child.nodeType !== 1 || child.tagName?.toLowerCase() === "img") continue;
    const st = parseStyle(child.getAttribute("style") || "");
    if (!st.position?.includes("absolute") || !st.opacity || !st.background) continue;
    const color = st.background.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] || "#000000";
    return { overlayColor: color, overlayOpacity: Math.round(parseFloat(st.opacity) * 100) };
  }
  return {};
}

function parseFilter(style) {
  const f = style.filter || "";
  const out = {};
  const grab = (name, prop) => {
    const m = f.match(new RegExp(`${name}\\((\\d+(?:\\.\\d+)?)%\\)`));
    if (m) out[prop] = parseFloat(m[1]);
  };
  grab("contrast", "filterContrast");
  grab("brightness", "filterBrightness");
  grab("saturate", "filterSaturate");
  grab("grayscale", "filterGrayscale");
  grab("opacity", "filterOpacity");
  grab("invert", "filterInvert");
  grab("sepia", "filterSepia");
  const hue = f.match(/hue-rotate\((\d+(?:\.\d+)?)deg\)/);
  if (hue) out.filterHueRotate = parseFloat(hue[1]);
  return out;
}

function absPos(el, offTop, offLeft) {
  const st = parseStyle(el.getAttribute("style") || "");
  return {
    top: px(st.top) + offTop,
    left: px(st.left) + offLeft,
    width: px(st.width, 200),
    height: px(st.height, 0),
  };
}

function isSkippable(el) {
  const tag = el.tagName?.toLowerCase();
  if (tag === "form" || tag === "style") return true;
  if (hasClass(el, "wish-list-container")) return true;
  if (hasClass(el, "overlay-hidden-on-load")) return true;
  const cls = el.getAttribute("class") || "";
  if (cls.includes("css-f9fh63") || cls.includes("css-jkjsoo") || cls.includes("css-ntktx3"))
    return true;
  if (cls.includes("swiper-") && !cls.includes("album-swiper-slide")) return true;
  return false;
}

function collectSections(wrapper) {
  const seen = new Set();
  const out = [];
  const add = (el) => {
    const id = el.getAttribute("data-node-id") || el.outerHTML?.slice(0, 40);
    if (seen.has(id) || isHiddenSection(el)) return;
    seen.add(id);
    out.push(el);
  };
  wrapper.querySelectorAll(".sections-wrapper").forEach(add);
  wrapper.querySelectorAll('[data-preserve-transform="true"]').forEach((el) => {
    if (hasClass(el, "sections-wrapper")) return;
    const h = px(parseStyle(el.getAttribute("style") || "").height);
    if (h >= 80) add(el);
  });
  return out;
}

function isCountdownWidget(el) {
  const html = el.innerHTML || "";
  if (html.includes("Ngày") && html.includes("Giờ")) return true;
  const st = parseStyle(el.getAttribute("style") || "");
  if (!st.display?.includes("flex") && !html.includes("inline-flex")) return false;
  const nums = el.querySelectorAll("div > div");
  return nums.length >= 3 && el.innerHTML.match(/\d{1,2}/);
}

function extractSvg(el) {
  const svg = el.querySelector("svg");
  if (!svg) return null;
  return svg.toString().replace(/\s+/g, " ").trim();
}

function slugId(raw, counter) {
  const base = (raw || `n${counter}`).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
  return `mh-${base}-${counter}`;
}

/**
 * @param {string} html
 * @returns {{ ROOT: object, [id: string]: object }}
 */
export function mehappyHtmlToCraftJson(html) {
  const root = parse(html, { comment: false });
  const wrapper =
    root.querySelector("#content-wrapper") ||
    root.querySelector(".content-wrapper") ||
    root;

  const s = makeScale(detectSourceWidth(wrapper));
  const sections = collectSections(wrapper);
  const nodes = {};
  const sectionIds = [];
  let counter = 0;

  const addNode = (id, typeName, displayName, props, parent) => {
    nodes[id] = block(typeName, displayName, props, parent, []);
    return id;
  };

  function convertText(el, secId, pos, nodeId) {
    const st = parseStyle(el.getAttribute("style") || "");
    const content = extractText(el);
    if (!content) return null;
    const b = box(s, pos.left, pos.top, pos.width, pos.height);
    const tt = st["text-transform"];
    const fontSize = s(px(st["font-size"], 16));
    addNode(
      nodeId,
      "TextBlock",
      "Text",
      {
        content,
        fontSize,
        fontFamily: normalizeFontFamily(st["font-family"]),
        color: st.color || "#333333",
        textAlign: (st["text-align"] || "left").replace(/"/g, ""),
        fontWeight: fontWeight(st["font-weight"]),
        fontStyle: st["font-style"] === "italic" ? "italic" : "normal",
        textDecoration: st["text-decoration"]?.includes("underline") ? "underline" : "none",
        textTransform:
          tt === "uppercase" ? "uppercase" : tt === "lowercase" ? "lowercase" : "none",
        letterSpacing: px(st["letter-spacing"], 0),
        lineHeight: parseLineHeight(st, fontSize),
        opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
        paddingX: 0,
        paddingY: 0,
        elementId: el.getAttribute("data-node-id") || "",
        ...b,
        ...appearProps(el, "text", pos),
        ...parseFilter(st),
        ...parseTextShadow(st),
        ...parseTextStroke(st),
        ...parseTransformProps(st),
        ...parseShadow(st),
      },
      secId
    );
    return nodeId;
  }

  function convertImage(el, secId, pos, nodeId) {
    const st = parseStyle(el.getAttribute("style") || "");
    const img = el.querySelector("img");
    const src = img?.getAttribute("src") || "";
    if (!src) return null;
    const imgSt = parseStyle(img?.getAttribute("style") || "");
    const b = box(s, pos.left, pos.top, pos.width, pos.height || px(st.height, 200));
    const isBackgroundLike = b.width >= CANVAS && b.left <= 0 && b.top <= 5;
    const br = st["border-radius"] || "0";
    let borderRadius = 0;
    const brPx = br.match(/(\d+)px/);
    if (brPx) borderRadius = s(parseInt(brPx[1], 10));
    else if (br.includes("500px") || br.includes("333px")) borderRadius = Math.min(b.width, b.height || b.width) / 2;

    addNode(
      nodeId,
      "ImageBlock",
      "Hình ảnh",
      {
        src,
        alt: img?.getAttribute("alt") || "",
        objectFit: imgSt["object-fit"] || "cover",
        imageTransform: imgSt.transform || "",
        imageTransformOrigin: imgSt["transform-origin"] || "left top",
        borderRadius,
        opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
        elementId: el.getAttribute("data-node-id") || "",
        ...b,
        ...parseBorder(st, s),
        ...parseShadow(st),
        ...parseImageOverlay(el),
        ...appearProps(el, "image", pos, { skip: isBackgroundLike }),
        ...parseFilter(st),
        ...parseFilter(imgSt),
        ...parseTransformProps(st),
      },
      secId
    );
    return nodeId;
  }

  function convertIcon(el, secId, pos, nodeId) {
    const st = parseStyle(el.getAttribute("style") || "");
    const svg = extractSvg(el);
    if (!svg) return null;
    const fill = svg.match(/fill="([^"]+)"/i)?.[1] || "#333333";
    const b = box(s, pos.left, pos.top, pos.width || 30, pos.height || 30);
    const rot = st.transform?.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
    addNode(
      nodeId,
      "IconBlock",
      "Icon",
      {
        customSvg: svg,
        color: fill.startsWith("#") || fill.startsWith("rgb") ? fill : "#333333",
        width: b.width,
        height: b.height || b.width,
        top: b.top,
        left: b.left,
        rotate: rot ? parseFloat(rot[1]) : 0,
        elementId: el.getAttribute("data-node-id") || "",
        ...appearProps(el, "icon", pos),
      },
      secId
    );
    return nodeId;
  }

  function convertButton(el, secId, pos, nodeId) {
    const st = parseStyle(el.getAttribute("style") || "");
    let label = "";
    for (const div of el.querySelectorAll("div")) {
      const dst = parseStyle(div.getAttribute("style") || "");
      const text = decodeHtml(div.textContent || "").trim();
      if (text && dst.color && !div.querySelector("svg")) {
        label = text;
        break;
      }
    }
    const svg = extractSvg(el);
    if (!label && svg) {
      const b = box(s, pos.left, pos.top, pos.width, pos.height || 40);
      const br = px(st["border-radius"], 8);
      addNode(
        nodeId,
        "TextBlock",
        "Shape",
        {
          content: "",
          fontSize: 1,
          color: "transparent",
          backgroundColor: st.background?.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] || "#888888",
          borderRadius: s(br),
          opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
          paddingX: 0,
          paddingY: 0,
          elementId: el.getAttribute("data-node-id") || "",
          ...b,
          ...parseBorder(st, s),
          ...parseFilter(st),
          ...parseTransformProps(st),
          ...appearProps(el, "button", pos),
        },
        secId
      );

      const iconEl = el.querySelector(".icon-container") || el;
      const iconSt = parseStyle(iconEl.getAttribute("style") || "");
      const iconW = s(px(iconSt.width, Math.min(pos.width, 30)));
      const iconH = s(px(iconSt.height, Math.min(pos.height || pos.width, 30)));
      const iconId = `${nodeId}-icon`;
      addNode(
        iconId,
        "IconBlock",
        "Icon",
        {
          customSvg: svg,
          color: svg.match(/fill="([^"]+)"/i)?.[1] || "#ffffff",
          width: iconW,
          height: iconH,
          top: Math.round(b.top + ((b.height || iconH) - iconH) / 2),
          left: Math.round(b.left + (b.width - iconW) / 2),
          rotate: 0,
          elementId: `${el.getAttribute("data-node-id") || ""}-icon`,
          ...appearProps(el, "icon", pos),
        },
        secId
      );
      return [nodeId, iconId];
    }

    const b = box(s, pos.left, pos.top, pos.width, pos.height || 40);
    const br = px(st["border-radius"], 8);
    const labelDiv = label ? el.querySelector("div[style*='color']") : null;
    const labelSt = parseStyle(labelDiv?.getAttribute("style") || "");
    const textColor = label
      ? labelSt.color || "#ffffff"
      : "#ffffff";
    addNode(
      nodeId,
      "ButtonBlock",
      "Button",
      {
        label: label || "Button",
        bgColor: st.background?.match(/rgb[a]?\([^)]+\)/i)?.[0] || "#888888",
        textColor: textColor.includes("rgb") || textColor.startsWith("#") ? textColor : "#ffffff",
        fontSize: s(px(labelSt["font-size"], 14)),
        fontFamily: normalizeFontFamily(labelSt["font-family"]),
        fontWeight: fontWeight(labelSt["font-weight"]),
        borderRadius: s(br),
        height: b.height,
        paddingX: s(px(st.padding?.split(/\s+/)[1], 10)),
        paddingY: s(px(st.padding?.split(/\s+/)[0], 5)),
        opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
        elementId: el.getAttribute("data-node-id") || "",
        ...b,
        ...parseBorder(st, s),
        ...appearProps(el, "button", pos),
        ...parseFilter(st),
        ...parseTransformProps(st),
      },
      secId
    );
    if (svg) {
      const iconEl = el.querySelector(".icon-container");
      const iconSt = parseStyle(iconEl?.getAttribute("style") || "");
      const iconWrap = iconEl?.parentNode;
      const iconWrapSt = parseStyle(iconWrap?.getAttribute?.("style") || "");
      const iconW = s(px(iconSt.width, Math.min(pos.width, 24)));
      const iconH = s(px(iconSt.height, Math.min(pos.height || pos.width, 24)));
      const relLeft = iconWrapSt.left && !String(iconWrapSt.left).includes("%")
        ? s(px(iconWrapSt.left, 0))
        : s(8);
      const iconId = `${nodeId}-icon`;
      addNode(
        iconId,
        "IconBlock",
        "Icon",
        {
          customSvg: svg,
          color: svg.match(/fill="([^"]+)"/i)?.[1] || "#ffffff",
          width: iconW,
          height: iconH,
          top: Math.round(b.top + ((b.height || iconH) - iconH) / 2),
          left: b.left + relLeft,
          rotate: 0,
          elementId: `${el.getAttribute("data-node-id") || ""}-icon`,
          ...appearProps(el, "icon", pos),
        },
        secId
      );
      return [nodeId, iconId];
    }
    return nodeId;
  }

  function convertDivider(el, secId, pos, nodeId) {
    const inner = el.querySelector("div");
    const ist = parseStyle(inner?.getAttribute("style") || "");
    const color = ist["border-color"] || "#ffffff";
    const b = box(s, pos.left, pos.top, pos.width || 2, pos.height || 75);
    addNode(
      nodeId,
      "DividerBlock",
      "Divider",
      {
        type: "line",
        color,
        width: b.width,
        height: b.height,
        top: b.top,
        left: b.left,
        opacity: 100,
        elementId: el.getAttribute("data-node-id") || "",
      },
      secId
    );
    return nodeId;
  }

  function convertShape(el, secId, pos, nodeId) {
    const st = parseStyle(el.getAttribute("style") || "");
    const bg = st.background || st["background-color"] || "";
    const bgColor = bg.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+|transparent/i)?.[0] || "transparent";
    const hasFill = bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)";
    const hasBorder = Boolean(st.border && !st.border.includes("none"));
    const hasShadow = Boolean(st["box-shadow"]);
    if (!hasFill && !hasBorder && !hasShadow) return null;
    const b = box(s, pos.left, pos.top, pos.width || 100, pos.height || 50);
    addNode(
      nodeId,
      "TextBlock",
      "Shape",
      {
        content: "",
        fontSize: 1,
        color: "transparent",
        backgroundColor: hasFill ? bgColor : "transparent",
        borderRadius: s(px(st["border-radius"], 0)),
        opacity: st.opacity ? Math.round(parseFloat(st.opacity) * 100) : 100,
        paddingX: 0,
        paddingY: 0,
        elementId: el.getAttribute("data-node-id") || "",
        ...b,
        ...parseBorder(st, s),
        ...parseShadow(st),
        ...parseTransformProps(st),
      },
      secId
    );
    return nodeId;
  }

  function addTextBlock(secId, childIds, idSeed, props) {
    const nodeId = slugId(idSeed, ++counter);
    const shouldAnimate = !props.skipAnimation && String(props.content ?? "").trim().length > 0;
    addNode(
      nodeId,
      "TextBlock",
      "Text",
      {
        content: props.content ?? "",
        fontSize: props.fontSize ?? s(16),
        fontFamily: props.fontFamily ?? '"Philosopher", sans-serif',
        color: props.color ?? "rgb(146, 131, 98)",
        textAlign: props.textAlign ?? "left",
        fontWeight: props.fontWeight ?? "normal",
        lineHeight: props.lineHeight ?? 1.3,
        backgroundColor: props.backgroundColor ?? "transparent",
        borderRadius: props.borderRadius ?? 0,
        borderStyle: props.borderStyle ?? "none",
        borderWidth: props.borderWidth ?? 0,
        borderColor: props.borderColor ?? "transparent",
        paddingX: props.paddingX ?? 0,
        paddingY: props.paddingY ?? 0,
        top: props.top,
        left: props.left,
        width: props.width,
        height: props.height,
        elementId: props.elementId ?? "",
        ...(shouldAnimate ? appearProps({ getAttribute: () => "" }, "text", { top: props.top ?? 0 }) : {}),
      },
      secId
    );
    childIds.push(nodeId);
    return nodeId;
  }

  function convertCalendar(el, secId, childIds, pos) {
    const st = parseStyle(el.getAttribute("style") || "");
    const b = box(s, pos.left, pos.top, pos.width || 360, pos.height || 336);
    addTextBlock(secId, childIds, `${el.getAttribute("data-node-id") || "calendar"}-bg`, {
      content: "",
      top: b.top,
      left: b.left,
      width: b.width,
      height: b.height,
      backgroundColor: (st.background || st["background-color"] || "rgba(255, 255, 255, 0.13)").match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] || "rgba(255, 255, 255, 0.13)",
      borderRadius: s(px(st["border-radius"], 5)),
      paddingX: 0,
      paddingY: 0,
      elementId: el.getAttribute("data-node-id") || "",
    });

    const month = decodeHtml(el.querySelector("p")?.textContent || "Tháng 6 / 2026").trim();
    addTextBlock(secId, childIds, "calendar-month", {
      content: month,
      top: b.top + s(18),
      left: b.left,
      width: b.width,
      height: s(28),
      fontSize: s(18),
      fontWeight: "bold",
      textAlign: "center",
      color: "rgb(146, 131, 98)",
    });

    const weekdays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
    const cellW = b.width / 7;
    weekdays.forEach((day, i) => {
      addTextBlock(secId, childIds, `calendar-weekday-${i}`, {
        content: day,
        top: b.top + s(58),
        left: Math.round(b.left + i * cellW),
        width: Math.round(cellW),
        height: s(20),
        fontSize: s(11),
        fontWeight: "bold",
        textAlign: "center",
        color: "rgb(146, 131, 98)",
      });
    });

    const nums = [...el.querySelectorAll("p")]
      .map((p) => decodeHtml(p.textContent || "").trim())
      .filter((x) => /^\d{1,2}$/.test(x));
    const highlightedDays = new Set(
      [...el.querySelectorAll("div")]
        .filter((d) => {
          const cls = d.getAttribute("class") || "";
          const dst = parseStyle(d.getAttribute("style") || "");
          return (
            cls.includes("heartBeat") ||
            (dst["background-image"] || "").includes("svg") ||
            (dst.background || "").includes("BD0000")
          );
        })
        .map((d) => decodeHtml(d.textContent || "").trim())
        .filter((x) => /^\d{1,2}$/.test(x))
    );
    if (!highlightedDays.size) {
      const dateText = decodeHtml(el.closest(".sections-wrapper")?.textContent || "");
      const dateMatch = dateText.match(/\b(\d{1,2})[./-]\d{1,2}[./-]\d{4}\b/);
      if (dateMatch) highlightedDays.add(String(Number(dateMatch[1])));
    }
    nums.slice(0, 42).forEach((num, i) => {
      const row = Math.floor(i / 7);
      const col = i % 7;
      const isHeart = highlightedDays.has(num);
      addTextBlock(secId, childIds, `calendar-day-${num}`, {
        content: isHeart ? `♥\n${num}` : num,
        top: b.top + s(92 + row * 36),
        left: Math.round(b.left + col * cellW),
        width: Math.round(cellW),
        height: s(34),
        fontSize: isHeart ? s(13) : s(14),
        fontWeight: isHeart ? "bold" : "normal",
        textAlign: "center",
        color: isHeart ? "#B80000" : "rgb(146, 131, 98)",
        lineHeight: 1.05,
      });
    });
  }

  function convertAlbumSwiper(secEl, secId, childIds) {
    const active =
      secEl.querySelector(".swiper-slide-active img") ||
      secEl.querySelector('.album-swiper-slide[data-swiper-slide-index="0"] img') ||
      secEl.querySelector(".album-swiper-slide img, .album-image-container img");
    const src = active?.getAttribute("src");
    if (!src) return;
    const secSt = parseStyle(secEl.getAttribute("style") || "");
    const h = s(px(secSt.height, 576));
    const nodeId = slugId("album-swiper-active", ++counter);
    addNode(
      nodeId,
      "ImageBlock",
      "Hình ảnh",
      {
        src,
        alt: active.getAttribute("alt") || "Album",
        objectFit: "cover",
        borderRadius: 0,
        top: 0,
        left: 0,
        width: CANVAS,
        height: h,
        elementId: secEl.getAttribute("data-node-id") || "",
        ...appearProps(active, "image", { top: 0 }),
      },
      secId
    );
    childIds.push(nodeId);
  }

  function convertWishList(el, secId, childIds, pos) {
    const st = parseStyle(el.getAttribute("style") || "");
    const b = box(s, pos.left, pos.top, pos.width || 360, pos.height || 380);
    addTextBlock(secId, childIds, `${el.getAttribute("data-node-id") || "wishes"}-bg`, {
      content: "",
      top: b.top,
      left: b.left,
      width: b.width,
      height: b.height,
      backgroundColor: (st.background || "#ffffff").match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] || "#ffffff",
      borderRadius: s(px(st["border-radius"], 8)),
      borderStyle: "solid",
      borderWidth: s(1),
      borderColor: st.border?.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] || "rgb(229, 231, 235)",
      paddingX: 0,
      paddingY: 0,
      elementId: el.getAttribute("data-node-id") || "",
    });

    const items = [];
    for (const item of el.querySelectorAll("div")) {
      const itemSt = parseStyle(item.getAttribute("style") || "");
      if (!itemSt["margin-bottom"] || !itemSt.padding) continue;
      const parts = item.childNodes
        .filter((c) => c.nodeType === 1)
        .map((c) => decodeHtml(c.textContent || "").trim())
        .filter(Boolean);
      if (parts.length >= 2) items.push({ name: parts[0], message: parts[1] });
      if (items.length >= 5) break;
    }

    let y = b.top + s(14);
    items.forEach((item, idx) => {
      addTextBlock(secId, childIds, `wish-name-${idx}`, {
        content: item.name,
        top: y,
        left: b.left + s(12),
        width: b.width - s(24),
        height: s(22),
        fontSize: s(16),
        fontWeight: "bold",
        color: "#1f2937",
      });
      y += s(23);
      addTextBlock(secId, childIds, `wish-message-${idx}`, {
        content: item.message,
        top: y,
        left: b.left + s(12),
        width: b.width - s(24),
        height: s(46),
        fontSize: s(14),
        color: "#374151",
        lineHeight: 1.35,
      });
      y += s(60);
    });
  }

  function convertForm(el, secId, childIds, pos) {
    const st = parseStyle(el.getAttribute("style") || "");
    const width = pos.width || px(st.width, 360);
    const gap = px(st.gap, 10);
    let y = pos.top;
    let fieldIndex = 0;
    const addField = (label, opts = {}) => {
      const height = opts.height ?? 44;
      const nodeId = slugId(`${el.getAttribute("data-node-id") || "form"}-${fieldIndex++}`, ++counter);
      addNode(
        nodeId,
        "ButtonBlock",
        "Field",
        {
          label,
          bgColor: opts.bgColor ?? "#ffffff",
          textColor: opts.textColor ?? "rgb(31, 41, 55)",
          fontSize: s(opts.fontSize ?? 15),
          fontFamily: normalizeFontFamily(opts.fontFamily ?? '"Philosopher", sans-serif'),
          fontWeight: opts.fontWeight ?? "normal",
          borderRadius: s(opts.borderRadius ?? 6),
          borderStyle: opts.borderStyle ?? "solid",
          borderWidth: s(opts.borderWidth ?? 1),
          borderColor: opts.borderColor ?? "rgb(209, 213, 219)",
          paddingX: s(10),
          paddingY: s(0),
          top: s(y),
          left: s(pos.left),
          width: s(width),
          height: s(height),
          elementId: `${el.getAttribute("data-node-id") || "form"}-${fieldIndex}`,
          ...appearProps({ getAttribute: () => "" }, opts.bgColor ? "button" : "text", { top: y }),
        },
        secId
      );
      childIds.push(nodeId);
      y += height + gap;
    };

    const radioGroups = new Set();
    for (const field of el.querySelectorAll("input, select, textarea, button")) {
      const tag = field.tagName.toLowerCase();
      const type = (field.getAttribute("type") || "").toLowerCase();
      if (type === "radio") {
        const name = field.getAttribute("name") || "radio";
        if (radioGroups.has(name)) continue;
        radioGroups.add(name);
        const labels = field.parentNode?.parentNode
          ?.querySelectorAll("label")
          .map((label) => decodeHtml(label.textContent || "").trim())
          .filter(Boolean);
        addField(labels?.join("   ") || "Có, tôi sẽ tham dự!", { height: 64 });
        continue;
      }
      if (tag === "input") {
        addField(field.getAttribute("placeholder") || field.getAttribute("name") || "Thông tin");
        continue;
      }
      if (tag === "select") {
        const selected = field.querySelector("option[selected]") || field.querySelector("option");
        addField(decodeHtml(selected?.textContent || field.getAttribute("name") || "Chọn"));
        continue;
      }
      if (tag === "textarea") {
        addField(field.getAttribute("placeholder") || "Nội dung", { height: px(parseStyle(field.getAttribute("style") || "").height, 88) });
        continue;
      }
      if (tag === "button") {
        const bst = parseStyle(field.getAttribute("style") || "");
        addField(decodeHtml(field.textContent || "Gửi"), {
          bgColor: bst.background?.match(/rgb[a]?\([^)]+\)|#[0-9a-f]+/i)?.[0] || "rgb(146, 131, 98)",
          textColor: bst.color || "#ffffff",
          fontSize: px(bst["font-size"], 18),
          fontWeight: fontWeight(bst["font-weight"]),
          borderStyle: "none",
          borderWidth: 0,
          height: 48,
        });
      }
    }
  }

  function walkContainer(container, secId, childIds, offTop, offLeft) {
    for (const child of container.childNodes) {
      if (child.nodeType !== 1) continue;
      if (hasClass(child, "w-full")) {
        walkContainer(child, secId, childIds, offTop, offLeft);
        continue;
      }
      if (child.tagName?.toLowerCase() === "form") {
        convertForm(child, secId, childIds, absPos(child, offTop, offLeft));
        continue;
      }
      if (hasClass(child, "wish-list-container")) {
        convertWishList(child, secId, childIds, absPos(child, offTop, offLeft));
        continue;
      }
      if (child.querySelector(".css-f9fh63") || child.innerHTML?.includes("Tháng 6 / 2026")) {
        convertCalendar(child, secId, childIds, absPos(child, offTop, offLeft));
        continue;
      }
      if (isSkippable(child)) continue;

      const cls = child.getAttribute("class") || "";
      const pos = absPos(child, offTop, offLeft);
      const nodeId = slugId(child.getAttribute("data-node-id"), ++counter);

      if (cls.includes("group-v2-container") || cls.includes("group-container")) {
        walkContainer(child, secId, childIds, pos.top, pos.left);
        continue;
      }

      if (cls.includes("text-container")) {
        const id = convertText(child, secId, pos, nodeId);
        if (id) childIds.push(id);
        continue;
      }

      if (cls.includes("image-container")) {
        const id = convertImage(child, secId, pos, nodeId);
        if (id) childIds.push(id);
        continue;
      }

      if (cls.includes("button-container")) {
        const id = convertButton(child, secId, pos, nodeId);
        if (Array.isArray(id)) childIds.push(...id);
        else if (id) childIds.push(id);
        continue;
      }

      if (cls.includes("icon-container") && !child.closest(".button-container")) {
        const id = convertIcon(child, secId, pos, nodeId);
        if (id) childIds.push(id);
        continue;
      }

      // Vertical timeline dividers (2px wide containers)
      if (cls.includes("container") && pos.width <= 4 && pos.height > 20) {
        const id = convertDivider(child, secId, pos, nodeId);
        if (id) childIds.push(id);
        continue;
      }

      if (cls.includes("container") && !cls.includes("content-container")) {
        const id = convertShape(child, secId, pos, nodeId);
        if (id) childIds.push(id);
      }

      // Custom countdown widget → CountdownBlock
      if (child.getAttribute("data-node-id") && isCountdownWidget(child)) {
        const cp = absPos(child, offTop, offLeft);
        const b = box(s, cp.left, cp.top, cp.width || 360, 80);
        const id = slugId("countdown", ++counter);
        const digitColor =
          parseStyle(child.innerHTML).color ||
          child.querySelector("div[style*='color']")?.getAttribute("style")?.match(/color:\s*(rgb[^;]+)/)?.[1] ||
          "rgb(146, 131, 98)";
        addNode(
          id,
          "CountdownBlock",
          "Countdown",
          {
            primaryColor: digitColor,
            textColor: digitColor,
            labelColor: digitColor,
            digitFontSize: s(26),
            elementId: child.getAttribute("data-node-id") || "",
            ...b,
            ...appearProps(child, "countdown", cp),
          },
          secId
        );
        childIds.push(id);
        continue;
      }

      if (child.childNodes.length) {
        walkContainer(child, secId, childIds, offTop, offLeft);
      }
    }
  }

  sections.forEach((secEl, idx) => {
    const secSt = parseStyle(secEl.getAttribute("style") || "");
    const height = s(px(secSt.height, 600));
    const secId = slugId(secEl.getAttribute("data-node-id") || `section-${idx + 1}`, ++counter);
    sectionIds.push(secId);

    const bg = parseSectionBackground(secEl);
    const overlay = parseOverlay(secEl);
    const childIds = [];

    const contentContainer = secEl.querySelector(".content-container");
    if (contentContainer) {
      walkContainer(contentContainer, secId, childIds, 0, 0);
    } else if (secEl.querySelector(".album-swiper-container")) {
      convertAlbumSwiper(secEl, secId, childIds);
    }

    nodes[secId] = block(
      "SectionBlock",
      "Section",
      {
        height,
        ...bg,
        ...overlay,
      },
      "ROOT",
      childIds
    );

    for (const cid of childIds) {
      if (nodes[cid]) nodes[cid].parent = secId;
    }
  });

  nodes.ROOT = block("RootCanvas", "Canvas", {}, null, sectionIds);

  return nodes;
}

/** Craft content_json wrapper (sanitized flat nodes). */
export function mehappyHtmlToCraftContentJson(html) {
  return mehappyHtmlToCraftJson(html);
}
