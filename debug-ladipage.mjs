import { parse } from "node-html-parser";
import { readFileSync } from "fs";

const html = readFileSync("./scripts/imported-templates/inbox/mewedding-foreign-basic.raw.html", "utf8");
const root = parse(html);

// Find SECTION1
const sec1 = root.querySelector("#SECTION1");
if (sec1) {
  console.log("=== SECTION1 style ===");
  const secSt = sec1.getAttribute("style") || "";
  console.log("section style:", secSt.substring(0, 300));

  const container = sec1.querySelector(".ladi-container");
  if (container) {
    console.log("\ncontainer style:", container.getAttribute("style") || "");
    const firstHeadline = container.querySelector(".ladi-headline");
    if (firstHeadline) {
      console.log("\nfirst headline style:", firstHeadline.getAttribute("style") || "");
      console.log("first headline text:", firstHeadline.text.substring(0, 50));
    }
    const firstImg = container.querySelector(".ladi-image");
    if (firstImg) {
      console.log("\nfirst image style:", firstImg.getAttribute("style") || "");
      const bgDiv = firstImg.querySelector(".ladi-image-background");
      if (bgDiv) {
        console.log("image background style:", bgDiv.getAttribute("style") || "");
      }
    }
    const firstBox = container.querySelector(".ladi-box");
    if (firstBox) {
      console.log("\nfirst box style:", firstBox.getAttribute("style") || "");
    }
    const firstGroup = container.querySelector(".ladi-group");
    if (firstGroup) {
      console.log("\nfirst group style:", firstGroup.getAttribute("style") || "");
    }
  }
}

// Find SECTION6 (event info)
const sec6 = root.querySelector("#SECTION6");
if (sec6) {
  console.log("\n=== SECTION6 (event) ===");
  const container = sec6.querySelector(".ladi-container");
  if (container) {
    console.log("container style:", container.getAttribute("style") || "");
    const headlines = container.querySelectorAll(".ladi-headline");
    headlines.slice(0, 5).forEach((h, i) => {
      console.log(`headline[${i}] style: ${h.getAttribute("style") || ""}`);
      console.log(`headline[${i}] text: ${h.text.substring(0, 80)}`);
    });
  }
}

// Find how many elements with position:absolute
const allWithPos = root.querySelectorAll("[style*='position: absolute']");
console.log("\n=== Elements with position:absolute ===");
console.log("Count:", allWithPos.length);
if (allWithPos.length > 0) {
  const sample = allWithPos.slice(0, 3);
  sample.forEach((el, i) => {
    console.log(`  [${i}] class: ${el.getAttribute("class")} style: ${el.getAttribute("style")?.substring(0, 100)}`);
  });
}
