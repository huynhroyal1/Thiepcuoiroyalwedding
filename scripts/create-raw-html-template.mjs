/**
 * Script tạo raw-html template từ HTML file
 * Chạy: node scripts/create-raw-html-template.mjs <template-id> <html-file-path>
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "..", "scripts", "imported-templates", "content");

const templates = [
  {
    id: "mehappy-h01-new",
    name: "H01 - Navy Gold",
    description: "Template H01 từ ladipage — phong cách Navy Gold sang trọng.",
    htmlFile: "h01.clean.html",
    plan: "pro",
    thumbnail: "https://static.ladipage.net/675faed0e377b9028f9ce15b/z6447276828302_0b9a1eb67b19200c5cd80ded65d3f802-20250327074020-ujbgk.jpg"
  },
  {
    id: "mehappy-lovestory-pro-new",
    name: "LoveStory Pro - Romantic",
    description: "Template LoveStory Pro — phong cách Romantic lãng mạn.",
    htmlFile: "lovestory-pro.clean.html",
    plan: "pro",
    thumbnail: "https://w.ladicdn.com/s1000x750/5c728619c417ab07e5194baa/btgdyvwq-20241030025238-awaay.jpeg"
  },
  {
    id: "mehappy-th01-pro-new",
    name: "TH01 Pro - Luxury",
    description: "Template TH01 Pro — phong cách Luxury sang trọng.",
    htmlFile: "th01-pro.clean.html",
    plan: "pro",
    thumbnail: "https://static.ladipage.net/675faed0e377b9028f9ce15b/z6447276828302_0b9a1eb67b19200c5cd80ded65d3f802-20250327074020-ujbgk.jpg"
  }
];

function cleanHtml(html) {
  // Bỏ footer/brand nếu có
  let out = html.trim();
  
  // Bỏ các branding common
  out = out.replace(/meWedding\s*\|\s*Nền tảng tạo Thiệp cưới Online MIỄN PHÍ/gi, "");
  out = out.replace(/Powered by meHappy/gi, "");
  out = out.replace(/chungdoi\.com/gi, "");
  
  // Đóng div nếu thiếu
  const openDivs = (out.match(/<div/gi) || []).length;
  const closeDivs = (out.match(/<\/div>/gi) || []).length;
  const diff = openDivs - closeDivs;
  if (diff > 0) {
    out += "</div>".repeat(diff);
  }
  
  return out;
}

function createTemplate(template) {
  const htmlPath = join(__dirname, "..", "scripts", "imported-templates", "inbox", template.htmlFile);
  
  if (!existsSync(htmlPath)) {
    console.log(`❌ Không tìm thấy: ${htmlPath}`);
    return;
  }
  
  const html = readFileSync(htmlPath, "utf8");
  const cleanedHtml = cleanHtml(html);
  
  const content = {
    type: "raw-html",
    html: cleanedHtml
  };
  
  const outputPath = join(CONTENT_DIR, `${template.id}.json`);
  writeFileSync(outputPath, JSON.stringify(content, null, 2), "utf8");
  
  console.log(`✅ Đã tạo: ${template.id}.json (${Math.round(cleanedHtml.length / 1024)} KB HTML)`);
}

console.log("=== Tạo raw-html templates ===\n");

for (const template of templates) {
  createTemplate(template);
}

console.log("\nHoàn tất! Chạy `npm run seed:templates` để import vào database.");
