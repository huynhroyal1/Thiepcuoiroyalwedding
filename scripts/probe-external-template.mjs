/**
 * Probe external template page structure.
 * node scripts/probe-external-template.mjs <url>
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const url =
  process.argv[2] ||
  "https://vesey.vn/mau-thiep/ngay-trong-dai/tao-thiep-simple/";
const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "imported-templates/inbox/vesey-simple-probe.html");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });

await page.evaluate(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let y = 0;
  const max = Math.max(document.body.scrollHeight, 3000);
  while (y < max) {
    window.scrollTo(0, y);
    await wait(150);
    y += 400;
  }
  window.scrollTo(0, 0);
  await wait(500);
});

const report = await page.evaluate(() => {
  const q = (sel) => document.querySelectorAll(sel).length;
  const pick = (sel) => {
    const el = document.querySelector(sel);
    return el
      ? { tag: el.tagName, class: el.className?.slice?.(0, 80), id: el.id, h: el.offsetHeight }
      : null;
  };
  const samples = [
    "#content-wrapper",
    ".content-wrapper",
    ".sections-wrapper",
    "[data-node-id]",
    ".demo-page",
    "iframe",
    ".invitation",
    ".wedding-card",
    "#app",
    "#root",
    "main",
  ].map((sel) => ({ sel, count: q(sel), first: pick(sel) }));

  let html = null;
  let source = null;
  const cw = document.getElementById("content-wrapper") || document.querySelector(".content-wrapper");
  if (cw) {
    html = cw.outerHTML;
    source = "content-wrapper";
  } else {
    const main = document.querySelector("main");
    const app = document.querySelector("#app, #root, [data-v-app]");
    const target = main || app || document.body;
    html = target.innerHTML;
    source = main ? "main" : app ? "app" : "body-inner";
  }

  return {
    title: document.title,
    url: location.href,
    samples,
    htmlSource: source,
    htmlLen: html?.length ?? 0,
    dataNodeId: q("[data-node-id]"),
    sectionsWrapper: q(".sections-wrapper"),
    htmlSnippet: html?.slice(0, 2000),
    html,
  };
});

await browser.close();

if (report.html) writeFileSync(out, report.html, "utf8");

console.log(JSON.stringify({ ...report, html: undefined, htmlSnippet: report.htmlSnippet }, null, 2));
console.log("\nWrote", Math.round((report.htmlLen || 0) / 1024), "KB →", out);
