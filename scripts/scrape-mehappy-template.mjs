/**
 * Scrape rendered MeHappy template HTML (content-wrapper) via Playwright.
 * Usage: node scripts/scrape-mehappy-template.mjs 44 [outfile]
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const id = process.argv[2] || "44";
const out =
  process.argv[3] ||
  join(__dirname, "imported-templates/inbox", `mehappy-template-${id}.raw.html`);

const url = `https://mehappy.vn/view/template/${id}`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });

await page.waitForSelector("#content-wrapper, .content-wrapper", {
  timeout: 120000,
});

// Cuộn trang để MeHappy lazy-load toàn bộ section
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

const html = await page.evaluate(() => {
  document.querySelectorAll(".sections-wrapper").forEach((el) => {
    el.style.removeProperty("display");
    if (getComputedStyle(el).display === "none") el.style.display = "block";
  });
  const el =
    document.getElementById("content-wrapper") ||
    document.querySelector(".content-wrapper");
  return el ? el.outerHTML : null;
});

await browser.close();

if (!html || html.length < 500) {
  console.error("Không lấy được content-wrapper hoặc HTML quá ngắn.");
  process.exit(1);
}

writeFileSync(out, html, "utf8");
console.log(`Saved ${Math.round(html.length / 1024)} KB → ${out}`);
