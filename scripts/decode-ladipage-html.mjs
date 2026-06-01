/**
 * Script decode file view-source HTML thành clean HTML
 * Rồi phân tích cấu trúc LadiPage/meWedding để tạo Craft JSON
 * 
 * Cách dùng:
 * node scripts/decode-ladipage-html.mjs --file=./inbox/lovestory-pro.raw.html --id=mehappy-lovestory-pro
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function decodeHtmlEntities(str) {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractLineContent(html) {
  // Tìm tất cả text trong td.line-content
  const matches = html.match(/class="line-content"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)</g) || [];
  let decoded = "";
  
  for (const match of matches) {
    // Trích nội dung sau dấu >
    const content = match.replace(/^[^>]*>/, "");
    decoded += decodeHtmlEntities(content);
  }
  
  return decoded;
}

function extractCleanHtml(rawHtml) {
  // Method 1: Trích từ line-content spans
  let clean = extractLineContent(rawHtml);
  
  // Method 2: Nếu clean quá ngắn, thử decode toàn bộ body
  if (clean.length < 1000) {
    // Tìm tất cả text node
    const textMatches = rawHtml.match(/<span class="html-[^"]*"[^>]*>([^<]*)<\/span>/g) || [];
    clean = textMatches.map(m => {
      const content = m.replace(/<[^>]*>/g, "");
      return decodeHtmlEntities(content);
    }).join("");
  }
  
  return clean;
}

function parseArgs(argv) {
  const out = { file: null, id: null, name: null };
  for (const arg of argv) {
    if (arg.startsWith("--file=")) out.file = arg.slice(7).trim();
    if (arg.startsWith("--id=")) out.id = arg.slice(6).trim();
    if (arg.startsWith("--name=")) out.name = arg.slice(8).trim();
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const projectRoot = join(__dirname, "..");

if (!args.file) {
  console.error("Usage: node decode-ladipage-html.mjs --file=<path> --id=<template-id> [--name=<name>]");
  console.error("\nVí dụ:");
  console.error("  node decode-ladipage-html.mjs --file=./inbox/lovestory-pro.raw.html --id=mehappy-lovestory-pro");
  process.exit(1);
}

const filePath = args.file.startsWith("/") || args.file.match(/^[A-Za-z]:/) 
  ? args.file 
  : join(projectRoot, args.file);

console.log(`\n=== Decode LadiPage HTML ===`);
console.log(`File: ${filePath}`);

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const rawHtml = readFileSync(filePath, "utf8");
const templateId = args.id || filePath.split("/").pop().replace(".raw.html", "").replace(/[^a-z0-9-]/gi, "-");

// Decode
const cleanHtml = extractCleanHtml(rawHtml);

// Lưu clean HTML
const cleanPath = join(projectRoot, "scripts/imported-templates/inbox", `${templateId}.clean.html`);
writeFileSync(cleanPath, cleanHtml, "utf8");
console.log(`\n✓ Clean HTML saved: ${cleanPath}`);
console.log(`  Size: ${cleanHtml.length} chars`);

// Trích xuất thông tin
const titleMatch = cleanHtml.match(/<title>([^<]+)<\/title>/i);
const pageTitle = titleMatch ? titleMatch[1] : "Untitled";

// Trích xuất ảnh
const imageRegex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif|svg)/gi;
const images = [...new Set(cleanHtml.match(imageRegex) || [])];

// Trích xuất text chính
const mainTexts = [];
const textPatterns = [
  /<p[^>]*>([^<]+)<\/p>/gi,
  /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi,
  /<span[^>]*class="[^"]*(?:text|title|content|name|date|time|location)[^"]*"[^>]*>([^<]+)<\/span>/gi,
  /data-text="([^"]+)"/gi,
  /data-value="([^"]+)"/gi,
];

for (const pattern of textPatterns) {
  let match;
  while ((match = pattern.exec(cleanHtml)) !== null) {
    const text = (match[1] || "").trim();
    if (text && text.length > 2 && text.length < 300 && !/[<>]/.test(text)) {
      mainTexts.push(text);
    }
  }
}

// Trích xuất style inline và CSS
const inlineStyles = cleanHtml.match(/style="([^"]+)"/gi) || [];
const fontImports = cleanHtml.match(/@import\s+[^;]+;/gi) || [];
const googleFonts = cleanHtml.match(/fonts\.googleapis\.com[^"']*/gi) || [];

// Trích xuất dimensions/positions từ inline style
const positions = [];
const posRegex = /top:\s*(\d+)[px]*\s*;?\s*(?:left|right|margin)/gi;
for (const style of inlineStyles.slice(0, 50)) {
  const match = style.match(/top:\s*(\d+)[px]*/i);
  if (match) positions.push(parseInt(match[1]));
}

console.log(`\n=== Page Info ===`);
console.log(`Title: ${pageTitle}`);
console.log(`Images found: ${images.length}`);
console.log(`Main texts: ${mainTexts.length}`);
console.log(`Inline styles: ${inlineStyles.length}`);
console.log(`Font imports: ${fontImports.length}`);

console.log(`\n=== Sample Images (10) ===`);
images.slice(0, 10).forEach((img, i) => console.log(`${i + 1}. ${img.substring(0, 100)}`));

console.log(`\n=== Sample Texts (20) ===`);
const uniqueTexts = [...new Set(mainTexts)].slice(0, 30);
uniqueTexts.forEach((t, i) => console.log(`${i + 1}. ${t}`));

// Xuất analysis
const analysis = {
  templateId,
  pageTitle,
  images: images.slice(0, 50),
  texts: uniqueTexts.slice(0, 50),
  fonts: {
    googleFonts: googleFonts.slice(0, 10),
    fontImports: fontImports.slice(0, 5)
  },
  styles: inlineStyles.slice(0, 20)
};

const analysisPath = join(projectRoot, "scripts/imported-templates/inbox", `${templateId}-full-analysis.json`);
writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), "utf8");
console.log(`\n✓ Full analysis saved: ${analysisPath}`);
