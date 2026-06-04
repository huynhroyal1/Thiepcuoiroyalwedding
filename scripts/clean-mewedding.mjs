/**
 * Clean HTML từ mewedding.vn - giữ nguyên CSS styles và images
 */
import { readFileSync, writeFileSync } from 'fs';

const inPath = process.argv[2] || './scripts/imported-templates/inbox/mewedding-lightly.raw.html';
const outJsonPath = process.argv[3] || './scripts/imported-templates/content/mewedding-lightly.json';
const outHtmlPath = process.argv[4] || './scripts/imported-templates/inbox/mewedding-lightly.clean.html';

let html = readFileSync(inPath, 'utf8');
console.log(`Read ${html.length} chars from ${inPath}`);

// 1. Remove tracking/analytics scripts
html = html.replace(/<script\b[^>]*>(?:google|facebook|analytics|tracking)[^<]*<\/script>/gi, '');

// 2. Remove CDATA sections
html = html.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');

// 3. Remove LadiPage runtime scripts - USE PROPER SCRIPT TAG REGEX
html = html.replace(/<script\b[^>]*src=["'][^"']*ladipage[^"']*["'][^>]*>\s*<\/script>/gi, '');
html = html.replace(/<script\b[^>]*>\s*[\s\S]*?["'](?:ladi\.run|ladi\.load|ladi\.send)[\s\S]*?<\/script>/gi, '');

// 4. Remove noscript
html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');

// 5. Fix relative URLs
html = html.replace(/src=["']\/(?!["']|\/)/g, 'src="https://mwd.mewedding.vn/');
html = html.replace(/href=["']\/(?!["']|\/)/g, 'href="https://mwd.mewedding.vn/');

// 6. Remove empty class attributes
html = html.replace(/\s+class=["']["']/g, '');

// 7. Remove "Bản quyền thuộc meWedding" text
html = html.replace(/Bản quyền[^<]*meWedding[^<]*/gi, '');

// 8. Get ALL style tags from the whole document
const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
console.log(`Found ${styleMatches.length} style tags`);

// 9. Get body content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
let bodyHtml = bodyMatch ? bodyMatch[1] : html;

// 10. Remove any remaining scripts from body
bodyHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

// 11. Combine: all styles + body
let finalHtml = `<style>${styleMatches.join('\n')}</style>\n${bodyHtml}`;

// 12. Wrap in container if needed
if (!finalHtml.trim().startsWith('<')) {
  finalHtml = `<div style="max-width:480px;margin:0 auto;">${finalHtml}</div>`;
}

// Save cleaned HTML
writeFileSync(outHtmlPath, finalHtml, 'utf8');
console.log(`Cleaned HTML saved to: ${outHtmlPath} (${finalHtml.length} chars)`);

// Count images in CSS
const imgUrls = finalHtml.match(/https:\/\/[^\s"'<>)]+\.(jpg|jpeg|png|gif|webp)/gi) || [];
const unique = [...new Set(imgUrls)];
console.log(`Images found: ${unique.length}`);

// Create raw-html JSON
const rawHtmlJson = {
  type: "raw-html",
  html: finalHtml
};

writeFileSync(outJsonPath, JSON.stringify(rawHtmlJson, null, 2), 'utf8');
console.log(`Raw HTML JSON saved to: ${outJsonPath}`);

// Show preview
console.log('\n--- Preview (first 500 chars) ---');
console.log(finalHtml.substring(0, 500));
