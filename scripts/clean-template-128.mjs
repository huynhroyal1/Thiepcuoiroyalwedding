/**
 * Clean & extract template HTML from mehappy.vn template #128
 * Remove unnecessary styles, scripts, wrapper elements
 * Lấy chỉ phần template preview thực
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { mehappyHtmlToContentJson } from './imported-templates/clean-mehappy-html.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_KEY = 'mehappy-template-128';
const INPUT_HTML = join(__dirname, 'imported-templates', 'content', `${TEMPLATE_KEY}.html`);
const OUTPUT_JSON = join(__dirname, 'imported-templates', 'content', `${TEMPLATE_KEY}-cleaned.json`);

function cleanMehappyHtml(html) {
  const $ = cheerio.load(html);

  // Remove all <style> tags — too much noise
  $('style').remove();
  
  // Remove all <script> tags
  $('script').remove();
  
  // Remove <head> completely
  $('head').remove();
  
  // Find template wrapper / invitation-frame
  let content = null;
  
  // Try selectors
  const selectors = [
    '.invitation-preview',
    '.template-preview',
    '.craft-frame',
    '.preview-container',
    '[data-invitation-frame]',
    'main',
    '.container'
  ];
  
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length > 0) {
      content = $.html(el);
      console.log(`Found content at: ${sel} (${el.length} matches)`);
      break;
    }
  }
  
  // Fallback: get body content
  if (!content) {
    content = $('body').html();
    console.log('Using body content as fallback');
  }
  
  // Wrap in minimal HTML
  const cleaned = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
${content}
</body>
</html>`;
  
  return cleaned;
}

async function main() {
  console.log(`\n=== Clean & Convert ${TEMPLATE_KEY} ===\n`);
  
  try {
    // Read raw HTML
    console.log('[1/3] Reading raw HTML...');
    const rawHtml = readFileSync(INPUT_HTML, 'utf8');
    console.log(`   ✓ Loaded ${rawHtml.length} chars`);
    
    // Clean HTML
    console.log('[2/3] Cleaning HTML...');
    const cleanedHtml = cleanMehappyHtml(rawHtml);
    console.log(`   ✓ Cleaned to ${cleanedHtml.length} chars`);
    
    // Convert to Craft.js
    console.log('[3/3] Converting to Craft.js...');
    const craftJson = mehappyHtmlToContentJson(cleanedHtml);
    
    const nodeCount = Object.keys(craftJson).length;
    console.log(`   ✓ Generated ${nodeCount} Craft nodes`);
    
    if (nodeCount === 0 || (craftJson.type === 'raw-html')) {
      console.log('\n⚠ Conversion still fallback to raw-html');
      console.log('  Reason: HTML structure too complex or incompatible');
      console.log('  Saving cleaned version as raw-html...');
      
      const finalJson = {
        type: 'raw-html',
        html: cleanedHtml.replace(/<!DOCTYPE html>|<html>|<head>.*?<\/head>|<body>|<\/body>|<\/html>/gi, '')
      };
      writeFileSync(OUTPUT_JSON, JSON.stringify(finalJson, null, 2), 'utf8');
    } else {
      writeFileSync(OUTPUT_JSON, JSON.stringify(craftJson, null, 2), 'utf8');
    }
    
    console.log(`   ✓ Saved to ${OUTPUT_JSON}`);
    console.log('\n✅ Done! Cleaned JSON ready.\n');
    console.log('Next: mv cleaned → original, then re-seed:\n');
    console.log(`  npm run seed:templates -- --id=${TEMPLATE_KEY}\n`);
    
  } catch (err) {
    console.error('❌ Error:', err.message || err);
    process.exit(1);
  }
}

main();
