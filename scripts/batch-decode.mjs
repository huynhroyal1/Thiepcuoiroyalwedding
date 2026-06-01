/**
 * Batch decode tất cả file HTML trong inbox
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const INBOX_DIR = join(__dirname, "..", "scripts", "imported-templates", "inbox");

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
  const lineContentRegex = /<td class="line-content"[^>]*>([\s\S]*?)<\/td>/g;
  const lines = [];
  let match;
  
  while ((match = lineContentRegex.exec(html)) !== null) {
    let line = match[1];
    line = line.replace(/<span class="html-(?:tag|attribute-name|attribute-value|doctype|comment|string|punctuation)[^>]*>/gi, "");
    line = line.replace(/<\/span>/gi, "");
    line = decodeHtmlEntities(line);
    if (line.trim()) lines.push(line.trim());
  }
  
  let cleanHtml = lines.join("\n");
  cleanHtml = cleanHtml.replace(/^<!DOCTYPE[^>]*>/i, "").trim();
  cleanHtml = cleanHtml.replace(/^<html[^>]*>/i, "").trim();
  cleanHtml = cleanHtml.replace(/^<head[^>]*>/i, "").trim();
  cleanHtml = cleanHtml.replace(/^<\/head>/i, "").trim();
  
  return cleanHtml;
}

function extractInfo(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1] : "Untitled";
  
  // Extract images
  const imageRegex = /https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif)/gi;
  const images = [...new Set(html.match(imageRegex) || [])];
  
  // Extract main texts
  const texts = [];
  const dataTextRegex = /data-text="([^"]+)"/g;
  let m;
  while ((m = dataTextRegex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t && t.length > 1 && t.length < 300) texts.push(t);
  }
  
  // Extract from p, h tags
  const tagRegex = /<(?:p|h[1-6])[^>]*>([^<]{2,200})<\/(?:p|h[1-6])>/gi;
  while ((m = tagRegex.exec(html)) !== null) {
    const t = m[1].trim();
    if (t && !/<[^>]+>/.test(t)) texts.push(t);
  }
  
  return {
    pageTitle,
    images: images.slice(0, 50),
    texts: [...new Set(texts)].slice(0, 50)
  };
}

function getTemplateId(filename) {
  return filename
    .replace(".raw.html", "")
    .replace(/^view-source_https?___/, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .toLowerCase();
}

// Get all raw HTML files
const files = readdirSync(INBOX_DIR).filter(f => f.endsWith(".raw.html"));

console.log(`\n=== Batch Decode ${files.length} files ===\n`);

const results = [];

for (const file of files) {
  const filePath = join(INBOX_DIR, file);
  const templateId = getTemplateId(file);
  
  console.log(`Processing: ${file} → ${templateId}`);
  
  try {
    const rawHtml = readFileSync(filePath, "utf8");
    const cleanHtml = decodeViewSource(rawHtml);
    
    // Save clean HTML
    const cleanPath = join(INBOX_DIR, `${templateId}.clean.html`);
    writeFileSync(cleanPath, cleanHtml, "utf8");
    
    // Extract info
    const info = extractInfo(cleanHtml);
    
    results.push({
      templateId,
      filename: file,
      ...info
    });
    
    console.log(`  ✓ Title: ${info.pageTitle}`);
    console.log(`  ✓ Images: ${info.images.length}`);
    console.log(`  ✓ Texts: ${info.texts.length}`);
    
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}`);
  }
}

// Save all results
writeFileSync(
  join(INBOX_DIR, "all-templates-analysis.json"),
  JSON.stringify(results, null, 2),
  "utf8"
);

console.log(`\n=== Done! ${results.length} templates analyzed ===`);
