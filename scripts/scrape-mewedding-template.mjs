/**
 * Scrape rendered meWedding template HTML via Playwright.
 * Usage: node scripts/scrape-mewedding-template.mjs {id} [outfile]
 * Example: node scripts/scrape-mewedding-template.mjs foreign-basic
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));

const id = process.argv[2] || "foreign-basic";
const out =
  process.argv[3] ||
  join(__dirname, "imported-templates/inbox", `mewedding-${id}.raw.html`);

// Đảm bảo thư mục tồn tại
const outDir = dirname(out);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// meWedding sử dụng URL pattern khác - thử nhiều pattern
const urlPatterns = [
  `https://www.mewedding.vn/giao-dien-${id}`,
  `https://mewedding.vn/giao-dien-${id}`,
];

let url = null;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

for (const pattern of urlPatterns) {
  try {
    console.log(`Trying: ${pattern}`);
    await page.goto(pattern, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Check if page loaded
    const title = await page.title();
    if (title && !title.includes("404") && !title.includes("Not Found")) {
      url = pattern;
      console.log(`✓ Found at: ${url}`);
      break;
    }
  } catch (e) {
    console.log(`  ✗ Failed: ${e.message.split('\n')[0]}`);
  }
}

if (!url) {
  console.error(`Could not find template: ${id}`);
  await browser.close();
  process.exit(1);
}

// Đợi trang load xong
await page.waitForTimeout(3000);

// Cuộn trang để lazy-load toàn bộ section
await page.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const step = Math.max(320, Math.floor(window.innerHeight * 0.85));
  let y = 0;
  const max = Math.max(document.body.scrollHeight, 4000);
  while (y < max) {
    window.scrollTo(0, y);
    await wait(180);
    y += step;
  }
  window.scrollTo(0, 0);
  await wait(400);
});

// Thử nhiều selector để tìm content wrapper
const selectors = [
  "#content-wrapper",
  ".content-wrapper",
  ".main-content",
  "#main-content",
  "main",
  ".template-content",
];

let html = null;
for (const sel of selectors) {
  try {
    const el = await page.$(sel);
    if (el) {
      html = await el.outerHTML();
      console.log(`✓ Found content with selector: ${sel}`);
      break;
    }
  } catch (e) {}
}

// Fallback: lấy toàn bộ body
if (!html) {
  html = await page.evaluate(() => document.body.innerHTML);
  console.log("⚠ Using full body HTML");
}

await browser.close();

// Lưu file
writeFileSync(out, html, "utf8");
console.log(`\n✓ Saved to: ${out}`);
console.log(`  Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log(`\nNext step:`);
console.log(`  npm run import:mehappy-html -- --id=mewedding-${id} --file=${out} --name="Template Name" --plan=basic --seed`);
