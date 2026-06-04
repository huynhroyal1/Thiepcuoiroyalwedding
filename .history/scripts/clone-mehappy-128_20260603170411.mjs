/**
 * Clone template #128 từ mehappy.vn
 * 1. Scrape HTML bằng Playwright
 * 2. Chuyển HTML → Craft.js JSON
 * 3. Lưu file vào scripts/imported-templates/content/
 * 
 * Usage: node scripts/clone-mehappy-128.mjs
 */

import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mehappyHtmlToContentJson } from './imported-templates/clean-mehappy-html.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_ID = 128;
const TEMPLATE_KEY = `mehappy-template-${TEMPLATE_ID}`;
const URL = `https://mehappy.vn/view/template/${TEMPLATE_ID}`;
const OUTPUT_JSON = join(__dirname, 'imported-templates', 'content', `${TEMPLATE_KEY}.json`);
const OUTPUT_HTML = join(__dirname, 'imported-templates', 'content', `${TEMPLATE_KEY}.html`);

async function main() {
  console.log(`\n=== Clone Template #${TEMPLATE_ID} from ${URL} ===\n`);

  let browser;
  try {
    // 1. Launch Playwright & navigate
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    console.log(`[1/4] Opening ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Wait for template preview to render
    console.log('[1/4] Waiting for template render...');
    await page.waitForTimeout(2000);

    // 2. Extract rendered HTML
    console.log('[2/4] Scraping rendered HTML...');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    const renderedHtml = await page.evaluate(() => {
      // Try multiple selectors for template container
      const selectors = [
        '.template-viewer',
        '.template-preview',
        '[data-template-preview]',
        '.invitation-frame',
        '#template-container',
        '.craft-frame',
        '.preview-container',
        '[class*="preview"]'
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.outerHTML.length > 500) {
          console.log(`Found template at selector: ${sel}`);
          if (el.tagName === 'IFRAME') {
            try {
              return el.contentDocument?.documentElement?.outerHTML;
            } catch (e) {
              console.warn('Cannot access iframe content (CORS)', e);
            }
          } else {
            return el.outerHTML;
          }
        }
      }

      // Check for iframes
      const iframes = document.querySelectorAll('iframe');
      if (iframes.length > 0) {
        console.log(`Found ${iframes.length} iframes`);
        for (const iframe of iframes) {
          try {
            const content = iframe.contentDocument?.documentElement?.outerHTML;
            if (content && content.length > 500) {
              console.log('Got content from iframe');
              return content;
            }
          } catch (e) {
            // CORS error, skip
          }
        }
      }

      // Fallback: get full HTML
      console.log('Using document.documentElement as fallback');
      return document.documentElement.outerHTML;
    });

    if (!renderedHtml || renderedHtml.length < 100) {
      console.error('❌ HTML too short or empty:', renderedHtml?.length);
      process.exit(1);
    }

    console.log(`   ✓ Scraped ${renderedHtml.length} chars of HTML`);

    // Save raw HTML
    writeFileSync(OUTPUT_HTML, renderedHtml, 'utf8');
    console.log(`   ✓ Saved to ${OUTPUT_HTML}`);

    // 3. Convert HTML → Craft.js JSON
    console.log('[3/4] Converting HTML → Craft.js JSON...');
    const craftJson = mehappyHtmlToContentJson(renderedHtml);

    if (!craftJson || Object.keys(craftJson).length === 0) {
      console.error('❌ Conversion failed: empty Craft JSON');
      process.exit(1);
    }

    console.log(`   ✓ Generated ${Object.keys(craftJson).length} Craft nodes`);

    // 4. Save JSON
    console.log('[4/4] Saving Craft.js JSON...');
    writeFileSync(OUTPUT_JSON, JSON.stringify(craftJson, null, 2), 'utf8');
    console.log(`   ✓ Saved to ${OUTPUT_JSON}`);

    console.log('\n✅ Clone complete!');
    console.log(`\nNext step: Add to manifest.json & seed:\n`);
    console.log(`  npm run seed:templates -- --id=${TEMPLATE_KEY}\n`);

  } catch (err) {
    console.error('❌ Clone failed:', err.message || err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
