import { parse } from "node-html-parser";
import { readFileSync } from "fs";

const html = readFileSync("./scripts/imported-templates/inbox/mewedding-foreign-basic.raw.html", "utf8");
const root = parse(html, { comment: false });

// Check SECTION1 element raw HTML
const sec1 = root.querySelector("#SECTION1");
if (sec1) {
  console.log("=== SECTION1 outer HTML (first 1000 chars) ===");
  console.log(sec1.outerHTML.substring(0, 1000));
  console.log("\n=== SECTION1 attributes ===");
  const attrs = sec1.attributes || {};
  Object.keys(attrs).forEach(k => {
    if (k !== 'style' || attrs[k]) console.log(`  ${k}: ${attrs[k]?.substring(0, 200)}`);
  });
}

// Check the ladi-wraper
const wraper = root.querySelector(".ladi-wraper");
if (wraper) {
  console.log("\n=== ladi-wraper ===");
  console.log("Attributes:", JSON.stringify(wraper.attributes || {}));
  console.log("Style:", wraper.getAttribute("style"));
  console.log("InnerHTML length:", wraper.innerHTML.length);
}

// Look for script_event_data which might contain element positions
const scriptEvent = root.querySelector("#script_event_data");
if (scriptEvent) {
  console.log("\n=== script_event_data ===");
  const content = scriptEvent.innerHTML || scriptEvent.textContent || "";
  console.log("Length:", content.length);
  console.log("First 500:", content.substring(0, 500));
}

// Search for element position data in the HTML
console.log("\n=== Search for position data ===");
const bodyContent = root.toString();
// Look for patterns like "left:", "top:", "width:", "height:" with pixel values
const posPattern = /"(left|top|width|height)"\s*:\s*"?(\d+\.?\d*)/gi;
let match;
const positions = {};
while ((match = posPattern.exec(bodyContent)) !== null) {
  const key = match[1].toLowerCase();
  const val = parseFloat(match[2]);
  if (!positions[key]) positions[key] = [];
  positions[key].push(val);
}
Object.entries(positions).forEach(([key, vals]) => {
  console.log(`${key}: min=${Math.min(...vals)}, max=${Math.max(...vals)}, count=${vals.length}`);
});
