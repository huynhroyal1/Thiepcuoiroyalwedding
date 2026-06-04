import { parse } from "node-html-parser";
import { readFileSync } from "fs";

const html = readFileSync("./scripts/imported-templates/inbox/mewedding-foreign-basic.raw.html", "utf8");
const root = parse(html, { comment: false });

// Collect all CSS
const styleTags = root.querySelectorAll("style");
let allCss = "";
styleTags.forEach(t => { allCss += t.innerHTML + "\n"; });

// Find ALL rules for #HEADLINE3 (all occurrences)
console.log("=== All rules for #HEADLINE3 ===");
const headline3All = allCss.match(/#HEADLINE3[^{]*\{[^}]+\}/gi);
if (headline3All) {
  headline3All.forEach(r => console.log(r.substring(0, 300)));
}

// Find ALL rules for #SECTION1
console.log("\n=== All rules for #SECTION1 ===");
const section1All = allCss.match(/#SECTION1[^{]*\{[^}]+\}/gi);
if (section1All) {
  section1All.forEach(r => console.log(r.substring(0, 300)));
}

// Find rules that contain position properties (left, top, width, height) with specific element IDs
console.log("\n=== Rules with position + element ID ===");
const posRules = allCss.match(/#[A-Z][A-Z0-9_]+\s*[^{]*\{[^}]*(?:left|top|width|height|position)[^}]*\}/gi);
if (posRules) {
  console.log("Found:", posRules.length);
  posRules.slice(0, 20).forEach(r => console.log(r.substring(0, 250)));
}

// Find #GROUP or #BOX rules
console.log("\n=== Rules for #GROUP4 ===");
const group4 = allCss.match(/#GROUP4[^{]*\{[^}]+\}/gi);
if (group4) {
  group4.forEach(r => console.log(r.substring(0, 300)));
}

console.log("\n=== Rules for #BOX1 ===");
const box1 = allCss.match(/#BOX1[^{]*\{[^}]+\}/gi);
if (box1) {
  box1.forEach(r => console.log(r.substring(0, 300)));
}

// Look at the SCRIPT tag that loads ladipagev3.min.js - maybe positions are in a JS data structure
console.log("\n=== Look for script with position data ===");
const scripts = root.querySelectorAll("script");
scripts.forEach((s, i) => {
  const content = s.textContent || "";
  if (content.includes("left") && content.includes("top") && content.length < 100000) {
    console.log(`Script[${i}] length: ${content.length}`);
    // Find patterns like "left:123"
    const matches = content.match(/"left"\s*:\s*\d+/g);
    if (matches) console.log("  left matches:", matches.slice(0, 5));
  }
});

// Check if there's any data attributes or JSON embedded
console.log("\n=== Search for data-left, data-top, etc ===");
const dataAttrs = root.querySelectorAll("[data-left], [data-top], [data-width], [data-height]");
console.log("Found:", dataAttrs.length);
if (dataAttrs.length > 0) {
  const sample = dataAttrs.slice(0, 3);
  sample.forEach(el => {
    console.log(`  ${el.tagName}#${el.getAttribute("id")}: left=${el.getAttribute("data-left")} top=${el.getAttribute("data-top")}`);
  });
}
