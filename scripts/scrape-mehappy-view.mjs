/**
 * Scrape rendered mehappy.vn template HTML via Playwright.
 * Usage: node scripts/scrape-mehappy-view.mjs {id} [outfile]
 * Example: node scripts/scrape-mehappy-view.mjs 128
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));

const id = process.argv[2] || "128";
const out =
  process.argv[3] ||
  join(__dirname, "imported-templates/inbox", `mehappy-${id}.raw.html`);

// Đảm bảo thư mục tồn tại
const outDir = dirname(out);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

// mehappy.vn uses /view/template/{id} pattern
const url = `https://mehappy.vn/view/template/${id}`;

console.log(`Opening: ${url}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  const title = await page.title();
  console.log(`Title: ${title}`);
} catch (e) {
  console.error(`Failed to load: ${e.message}`);
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
  ".ladi-section",
];

let html = null;
for (const sel of selectors) {
  try {
    const el = await page.$(sel);
    if (el) {
      html = await el.outerHTML();
      console.log(`Found content with selector: ${sel} (${html.length} chars)`);
      break;
    }
  } catch (e) {
    console.log(`Selector ${sel} failed: ${e.message}`);
  }
}

// Fallback: lấy toàn bộ body
if (!html || html.length < 1000) {
  html = await page.evaluate(() => document.body.innerHTML);
  console.log(`Using full body HTML (${html.length} chars)`);
}

await browser.close();

// Lưu file
writeFileSync(out, html, "utf8");
console.log(`\nSaved to: ${out}`);
console.log(`Size: ${(html.length / 1024).toFixed(1)} KB`);
console.log(`\nNext step:`);
console.log(`npm run import:mehappy-html -- --id=mehappy-ds03-vip --file=${out} --name="DS03 - Gói VIP" --plan=vip`);
