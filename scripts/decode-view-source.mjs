/**
 * Script decode file view-source HTML (Chrome format) thành clean HTML
 * 
 * Format view-source của Chrome:
 * <table><tbody><tr><td class="line-number" value="1"></td><td class="line-content"><span class="...">content</span></td></tr>...
 * 
 * Cách dùng:
 * node scripts/decode-view-source.mjs --file=./inbox/th01-pro.raw.html --id=th01-pro
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// projectRoot = parent of scripts folder
const projectRoot = join(__dirname, "..");

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

function decodeViewSource(html) {
  // Tìm tất cả td.line-content
  const lineContentRegex = /<td class="line-content"[^>]*>([\s\S]*?)<\/td>/g;
  const lines = [];
  let match;
  
  while ((match = lineContentRegex.exec(html)) !== null) {
    let line = match[1];
    
    // Xóa các span formatting (html-tag, html-attribute-name, html-attribute-value, html-doctype, html-comment)
    line = line.replace(/<span class="html-(?:tag|attribute-name|attribute-value|doctype|comment|string|punctuation)[^>]*>/gi, "");
    line = line.replace(/<\/span>/gi, "");
    
    // Decode HTML entities
    line = decodeHtmlEntities(line);
    
    if (line.trim()) {
      lines.push(line.trim());
    }
  }
  
  // Ghép các dòng lại thành HTML hoàn chỉnh
  let cleanHtml = lines.join("\n");
  
  // Xóa các thẻ không cần thiết ở đầu
  cleanHtml = cleanHtml.replace(/^<!DOCTYPE[^>]*>/i, "").trim();
  cleanHtml = cleanHtml.replace(/^<html[^>]*>/i, "").trim();
  cleanHtml = cleanHtml.replace(/^<head[^>]*>/i, "").trim();
  cleanHtml = cleanHtml.replace(/^<\/head>/i, "").trim();
  
  return cleanHtml;
}

function extractImages(html) {
  const regex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif|svg)/gi;
  return [...new Set(html.match(regex) || [])];
}

function extractTexts(html) {
  const texts = [];
  
  // Lấy từ data-text attributes
  const dataTextRegex = /data-text="([^"]+)"/g;
  let m;
  while ((m = dataTextRegex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t && t.length > 1 && t.length < 500) texts.push(t);
  }
  
  // Lấy text từ các thẻ p, h1-h6, span
  const tagRegex = /<(?:p|h[1-6]|span|div)[^>]*>([^<]{2,200})<\/(?:p|h[1-6]|span|div)>/gi;
  while ((m = tagRegex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t && !/<[^>]+>/.test(t)) texts.push(t);
  }
  
  return [...new Set(texts)];
}

function extractStyles(html) {
  const styles = [];
  
  // Inline styles
  const inlineRegex = /style="([^"]+)"/g;
  let m;
  while ((m = inlineRegex.exec(html)) !== null) {
    styles.push({ type: "inline", value: m[1] });
  }
  
  // CSS trong thẻ style
  const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((m = styleBlockRegex.exec(html)) !== null) {
    styles.push({ type: "block", value: m[1].substring(0, 500) });
  }
  
  return styles;
}

function parseArgs(argv) {
  const out = { file: null, id: null };
  for (const arg of argv) {
    if (arg.startsWith("--file=")) out.file = arg.slice(7).trim();
    if (arg.startsWith("--id=")) out.id = arg.slice(6).trim();
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (!args.file) {
  console.error("Usage: node decode-view-source.mjs --file=<path> --id=<template-id>");
  console.error("Example: node decode-view-source.mjs --file=./inbox/th01-pro.raw.html --id=th01-pro");
  process.exit(1);
}

const filePath = args.file;

console.log(`\n=== Decode View-Source HTML ===`);
console.log(`File: ${filePath}`);

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const rawHtml = readFileSync(filePath, "utf8");
const templateId = args.id || filePath.split(/[/\\]/).pop().replace(".raw.html", "").replace(/[^a-z0-9-]/gi, "-");

console.log(`Raw size: ${rawHtml.length} chars`);

// Decode
const cleanHtml = decodeViewSource(rawHtml);

// Lưu clean HTML
const cleanPath = join(projectRoot, "scripts/imported-templates/inbox", `${templateId}.clean.html`);
writeFileSync(cleanPath, cleanHtml, "utf8");
console.log(`✓ Clean HTML saved: ${cleanPath}`);
console.log(`  Clean size: ${cleanHtml.length} chars`);

// Phân tích
const titleMatch = cleanHtml.match(/<title>([^<]+)<\/title>/i);
const pageTitle = titleMatch ? titleMatch[1] : "Untitled";

const images = extractImages(cleanHtml);
const texts = extractTexts(cleanHtml);
const styles = extractStyles(cleanHtml);

// Đếm elements
const divCount = (cleanHtml.match(/<div/gi) || []).length;
const sectionCount = (cleanHtml.match(/<section/gi) || []).length;
const imgCount = (cleanHtml.match(/<img/gi) || []).length;
const btnCount = (cleanHtml.match(/<button/gi) || []).length;
const inputCount = (cleanHtml.match(/<input/gi) || []).length;

console.log(`\n=== Page Analysis ===`);
console.log(`Title: ${pageTitle}`);
console.log(`Divs: ${divCount}, Sections: ${sectionCount}, Imgs: ${imgCount}, Buttons: ${btnCount}, Inputs: ${inputCount}`);
console.log(`Images found: ${images.length}`);
console.log(`Texts found: ${texts.length}`);
console.log(`Styles found: ${styles.length}`);

console.log(`\n=== Sample Texts ===`);
texts.slice(0, 25).forEach((t, i) => console.log(`${i + 1}. "${t}"`));

console.log(`\n=== Sample Images ===`);
images.slice(0, 15).forEach((img, i) => console.log(`${i + 1}. ${img.substring(0, 90)}`));

// Lưu analysis
const analysis = {
  templateId,
  pageTitle,
  elements: { divs: divCount, sections: sectionCount, imgs: imgCount, buttons: btnCount, inputs: inputCount },
  images: images.slice(0, 80),
  texts: texts.slice(0, 80),
  styles: styles.slice(0, 30)
};

const analysisPath = join(projectRoot, "scripts/imported-templates/inbox", `${templateId}-analysis.json`);
writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), "utf8");
console.log(`\n✓ Analysis saved: ${analysisPath}`);
