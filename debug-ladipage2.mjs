import { parse } from "node-html-parser";
import { readFileSync } from "fs";

const html = readFileSync("./scripts/imported-templates/inbox/mewedding-foreign-basic.raw.html", "utf8");
const root = parse(html);

// Check for style tags
const styleTags = root.querySelectorAll("style");
console.log("=== Style tags ===");
console.log("Count:", styleTags.length);
if (styleTags.length > 0) {
  console.log("First style tag length:", styleTags[0].innerHTML.length);
  console.log("First 500 chars of CSS:", styleTags[0].innerHTML.substring(0, 500));
}

// Check if there's any inline style on elements
const withStyle = root.querySelectorAll("[style]");
console.log("\n=== Elements with inline style ===");
console.log("Count:", withStyle.length);
if (withStyle.length > 0) {
  const sample = withStyle.slice(0, 5);
  sample.forEach((el, i) => {
    console.log(`  [${i}] tag: ${el.tagName} class: ${el.getAttribute("class")} style: ${el.getAttribute("style")?.substring(0, 100)}`);
  });
}

// Check element IDs
const sections = root.querySelectorAll("[id^='SECTION']");
console.log("\n=== SECTION elements ===");
console.log("Count:", sections.length);
sections.slice(0, 3).forEach((el, i) => {
  console.log(`  [${i}] id: ${el.getAttribute("id")} class: ${el.getAttribute("class")}`);
});

// Check body element
const body = root.querySelector("body");
if (body) {
  console.log("\n=== Body ===");
  console.log("Body class:", body.getAttribute("class"));
  console.log("Body style:", body.getAttribute("style")?.substring(0, 200));
  
  // Check children of body
  const bodyChildren = body.childNodes.filter(c => c.nodeType === 1).slice(0, 10);
  console.log("Body children:", bodyChildren.length);
  bodyChildren.forEach((el, i) => {
    console.log(`  [${i}] tag: ${el.tagName} id: ${el.getAttribute("id")} class: ${el.getAttribute("class")} style: ${el.getAttribute("style")?.substring(0, 100)}`);
  });
}
