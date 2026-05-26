import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const url = "https://vesey.vn/mau-thiep/ngay-trong-dai/tao-thiep-simple/";
const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "imported-templates/inbox/vesey-simple-iframe.html");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForSelector("iframe.gjs-frame", { timeout: 60000 });

const frame = page.frameLocator("iframe.gjs-frame").first();
await frame.locator("body").waitFor({ timeout: 60000 });

const report = await frame.locator("body").evaluate((body) => {
  const doc = body.ownerDocument;
  const q = (sel) => doc.querySelectorAll(sel).length;
  const html = body.innerHTML;
  return {
    bodyClass: body.className,
    childCount: body.children.length,
    dataNodeId: q("[data-node-id]"),
    sectionsWrapper: q(".sections-wrapper"),
    contentWrapper: q("#content-wrapper, .content-wrapper"),
    images: q("img"),
    textBlocks: q("p, h1, h2, h3, span"),
    htmlLen: html.length,
    snippet: html.slice(0, 1500),
    outerBody: body.outerHTML.slice(0, 3000),
  };
});

const fullHtml = await frame.locator("body").evaluate((body) => body.outerHTML);
writeFileSync(out, fullHtml, "utf8");
await browser.close();

console.log(JSON.stringify(report, null, 2));
console.log("Saved", Math.round(fullHtml.length / 1024), "KB");
