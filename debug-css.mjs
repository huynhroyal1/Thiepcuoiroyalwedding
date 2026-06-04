import { parse } from "node-html-parser";
import { readFileSync } from "fs";

const html = readFileSync("./scripts/imported-templates/inbox/mewedding-foreign-basic.raw.html", "utf8");
const root = parse(html, { comment: false });

// Collect all CSS rules
const styleTags = root.querySelectorAll("style");
let allCss = "";
styleTags.forEach(t => { allCss += t.innerHTML + "\n"; });

// Find rules for SECTION1
console.log("=== Rules for SECTION1 ===");
const section1Rules = allCss.match(/#[Ss][Ee][Cc][Tt][Ii][Oo][Nn]1[^}]+\{[^}]+\}/g);
if (section1Rules) {
  section1Rules.slice(0, 5).forEach(r => console.log(r.substring(0, 200)));
}

// Find rules for .ladi-section
console.log("\n=== Rules for .ladi-section ===");
const ladiSectionRules = allCss.match(/\.ladi-section[^{]*\{[^}]+\}/g);
if (ladiSectionRules) {
  console.log("Found:", ladiSectionRules.length, "rules");
  ladiSectionRules.slice(0, 5).forEach(r => console.log(r.substring(0, 200)));
}

// Find rules for .ladi-container
console.log("\n=== Rules for .ladi-container ===");
const ladiContainerRules = allCss.match(/\.ladi-container[^{]*\{[^}]+\}/g);
if (ladiContainerRules) {
  console.log("Found:", ladiContainerRules.length, "rules");
  ladiContainerRules.slice(0, 5).forEach(r => console.log(r.substring(0, 200)));
}

// Find rules for #HEADLINE3
console.log("\n=== Rules for #HEADLINE3 ===");
const headline3Rules = allCss.match(/#HEADLINE3[^{]*\{[^}]+\}/g);
if (headline3Rules) {
  headline3Rules.slice(0, 3).forEach(r => console.log(r.substring(0, 300)));
}

// Find any rules with width/height/top/left
console.log("\n=== Rules with width ===");
const widthRules = allCss.match(/#[A-Z][A-Z0-9]+[^{]*\{[^}]*width[^}]*\}/gi);
if (widthRules) {
  console.log("Found:", widthRules.length, "rules with width");
  widthRules.slice(0, 5).forEach(r => console.log(r.substring(0, 200)));
}

// Look at specific SECTION styles from the 45KB CSS
console.log("\n=== Search for SECTION1 specific styles ===");
const section1Specific = allCss.match(/SECTION1\s*\{[^}]+\}/gi);
if (section1Specific) {
  section1Specific.slice(0, 5).forEach(r => console.log(r.substring(0, 300)));
}

// Find where section width/height are defined
console.log("\n=== All SECTION rules ===");
const sectionRules = allCss.match(/#[Ss][Ee][Cc][Tt][Ii][Oo][Nn]\d+[^{]*\{[^}]*\}/g);
if (sectionRules) {
  console.log("Total SECTION rules:", sectionRules.length);
  // Filter to ones with dimension properties
  const withDims = sectionRules.filter(r => r.includes('width') || r.includes('height') || r.includes('position'));
  console.log("With dimensions:", withDims.length);
  withDims.slice(0, 5).forEach(r => console.log(r.substring(0, 300)));
}
