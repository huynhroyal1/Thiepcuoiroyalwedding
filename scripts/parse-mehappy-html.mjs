/**
 * Script phân tích HTML source từ meWedding và chuyển thành Craft.js JSON
 * 
 * Cách dùng:
 * node scripts/parse-mehappy-html.mjs --file=./inbox/lovestory-pro.raw.html --id=mehappy-lovestory-pro
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INBOX_DIR = join(__dirname, "imported-templates/inbox");
const CONTENT_DIR = join(__dirname, "imported-templates/content");

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

if (!args.file) {
  console.error("Usage: node parse-mehappy-html.mjs --file=<path> --id=<template-id> [--name=<name>]");
  process.exit(1);
}

// Resolve path relative to project root, not scripts folder
const projectRoot = join(__dirname, "..");
const filePath = args.file.startsWith("/") || args.file.match(/^[A-Za-z]:/) 
  ? args.file 
  : join(projectRoot, args.file);

console.log(`\n=== Parse meWedding HTML ===`);
console.log(`File: ${filePath}`);

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const html = readFileSync(filePath, "utf8");

// Trích xuất title
const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
const pageTitle = titleMatch ? titleMatch[1] : "Untitled";

// Trích xuất tất cả ảnh
const imageRegex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif)/gi;
const images = [...new Set(html.match(imageRegex) || [])];

console.log(`Page title: ${pageTitle}`);
console.log(`Images found: ${images.length}`);

// Trích xuất text từ các thẻ p, h1, h2, h3, span, div
const textBlocks = [];
const textRegex = /<p[^>]*>([^<]+)<\/p>|<h[1-6][^>]*>([^<]+)<\/h[1-6]>|<span[^>]*>([^<]+)<\/span>/gi;
let match;
while ((match = textRegex.exec(html)) !== null) {
  const text = (match[1] || match[2] || match[3] || "").trim();
  if (text && text.length > 2 && text.length < 500) {
    textBlocks.push(text);
  }
}

// Trích xuất sections/containers
const sectionRegex = /<section[^>]*id=["']([^"']+)["'][^>]*>|class=["'][^"']*(?:section|cover|event|gallery|gift|rsvp|footer|hero|about|story)[^"']*["'][^>]*>/gi;
const sections = [...new Set((html.match(sectionRegex) || []).map(s => {
  const idMatch = s.match(/id=["']([^"']+)["']/);
  const classMatch = s.match(/class=["']([^"']+)["']/);
  return idMatch ? idMatch[1] : (classMatch ? classMatch[1].split(" ").pop() : "unknown");
}))];

console.log(`Sections found: ${sections.length}`);
console.log(`Text blocks: ${textBlocks.length}`);

// Tạo template ID từ file name nếu không có
const templateId = args.id || filePath.split("/").pop().replace(".raw.html", "").replace(/[^a-z0-9-]/gi, "-");
const templateName = args.name || pageTitle;

// Trích xuất background images
const bgRegex = /background-image:\s*url\(["']?([^"'()]+)["']?\)/gi;
const backgrounds = [...new Set((html.match(bgRegex) || []).map(b => b.replace(/background-image:\s*url\(['"]?/, "").replace(/['"]?\)/, "")))];

console.log(`Background images: ${backgrounds.length}`);

// Xuất kết quả
const result = {
  templateId,
  templateName,
  pageTitle,
  sections: sections.slice(0, 20),
  textBlocks: textBlocks.slice(0, 50),
  images: images.slice(0, 30),
  backgrounds: backgrounds.slice(0, 10)
};

console.log(`\n=== Sample Text Blocks ===`);
textBlocks.slice(0, 20).forEach((t, i) => console.log(`${i + 1}. ${t.substring(0, 80)}...`));

console.log(`\n=== Sample Images ===`);
images.slice(0, 10).forEach((img, i) => console.log(`${i + 1}. ${img.substring(0, 80)}`));

// Lưu kết quả phân tích
const analysisPath = join(projectRoot, "scripts/imported-templates/inbox", `${templateId}-analysis.json`);
writeFileSync(analysisPath, JSON.stringify(result, null, 2), "utf8");
console.log(`\n✓ Analysis saved to: ${analysisPath}`);
