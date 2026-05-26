/**
 * Scrape + import nhiều mẫu MeHappy.
 * Usage: node scripts/batch-import-mehappy.mjs [--seed]
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import { cleanMehappyHtml } from "./imported-templates/clean-mehappy-html.mjs";
import { mehappyHtmlToCraftContentJson } from "../lib/editor/mehappy-html-to-craft.mjs";
import { mehappyHtmlToContentJson } from "./imported-templates/clean-mehappy-html.mjs";
import { upsertImportedTemplates } from "./seed-imported-templates.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "imported-templates");
const INBOX = join(ROOT, "inbox");
const CONTENT_DIR = join(ROOT, "content");
const MANIFEST_PATH = join(ROOT, "manifest.json");

const TEMPLATES = [
  {
    mehappyId: 131,
    id: "mehappy-romantic-vip",
    name: "Giao diện Romantic - Gói VIP",
    plan: "vip",
    sortOrder: 110,
  },
  {
    mehappyId: 79,
    id: "mehappy-en01-vip",
    name: "Giao diện thiệp cưới EN01 - Gói VIP",
    plan: "vip",
    sortOrder: 111,
  },
  {
    mehappyId: 24,
    id: "mehappy-da05-vip",
    name: "Giao diện thiệp cưới DA05 - Gói VIP",
    plan: "vip",
    sortOrder: 112,
  },
  {
    mehappyId: 6,
    id: "mehappy-at01-pro",
    name: "Giao diện AT01 - Gói PRO",
    plan: "pro",
    sortOrder: 113,
  },
  {
    mehappyId: 16,
    id: "mehappy-brightly-basic",
    name: "Giao diện Brightly - Gói Basic",
    plan: "basic",
    sortOrder: 114,
  },
];

const seed = process.argv.includes("--seed");

async function scrapeTemplate(page, mehappyId) {
  const url = `https://mehappy.vn/view/template/${mehappyId}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForSelector("#content-wrapper, .content-wrapper, .demo-page", {
    timeout: 120000,
  });
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
  return page.evaluate(() => {
    document.querySelectorAll(".sections-wrapper").forEach((el) => {
      el.style.removeProperty("display");
      if (getComputedStyle(el).display === "none") el.style.display = "block";
    });
    const craft =
      document.getElementById("content-wrapper") ||
      document.querySelector(".content-wrapper");
    if (craft) return { kind: "craft", html: craft.outerHTML };
    const demo = document.querySelector(".demo-page");
    if (demo) {
      const main = demo.closest("main") || demo.parentElement;
      return { kind: "raw", html: main ? main.innerHTML : demo.outerHTML };
    }
    return null;
  });
}

function guessThumbnail(html) {
  const m = html.match(/src="(https:\/\/s3-hcm-r2\.s3cloud\.vn\/[^"]+\.(?:webp|jpg|png))"/i);
  return m?.[1] ?? null;
}

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  const manifest = loadManifest();

  for (const t of TEMPLATES) {
    console.log(`\n--- #${t.mehappyId} ${t.name} ---`);
    const scraped = await scrapeTemplate(page, t.mehappyId);
    if (!scraped?.html || scraped.html.length < 500) {
      console.error(`  ✗ Scrape thất bại`);
      continue;
    }

    let html = scraped.html;
    if (scraped.kind === "raw") {
      html = html.replace(/src="\/images\//g, 'src="https://mehappy.vn/images/');
    }

    const inboxPath = join(INBOX, `mehappy-template-${t.mehappyId}.raw.html`);
    writeFileSync(inboxPath, html, "utf8");
    console.log(`  Scrape: ${Math.round(html.length / 1024)} KB (${scraped.kind})`);

    const isCraft = scraped.kind === "craft" && /data-node-id/.test(html);
    const cleaned = isCraft ? cleanMehappyHtml(html) : cleanMehappyHtml(html);
    const contentJson = isCraft
      ? mehappyHtmlToCraftContentJson(cleaned)
      : mehappyHtmlToContentJson(html);

    writeFileSync(join(CONTENT_DIR, `${t.id}.html`), cleaned, "utf8");
    writeFileSync(
      join(CONTENT_DIR, `${t.id}.json`),
      `${JSON.stringify(contentJson, null, 2)}\n`,
      "utf8"
    );

    const nodeCount = isCraft ? Object.keys(contentJson).length : 1;
    const entry = {
      id: t.id,
      name: t.name,
      description: `Mẫu import từ MeHappy template #${t.mehappyId} — ${
        isCraft ? "kéo-thả chỉnh text, ảnh, ngày giờ." : "HTML đầy đủ trong trình sửa."
      }`,
      thumbnail_url: guessThumbnail(cleaned || html),
      preview_url: null,
      plan_required: t.plan,
      style_tags: ["Import MeHappy", "Sang trọng"],
      sort_order: t.sortOrder,
      is_active: true,
      content_type: isCraft ? "craft" : "raw-html",
      content_file: `${t.id}.json`,
    };

    const idx = manifest.templates.findIndex((x) => x.id === t.id);
    if (idx >= 0) manifest.templates[idx] = { ...manifest.templates[idx], ...entry };
    else manifest.templates.push(entry);

    console.log(`  Import: ${t.id} — ${isCraft ? "craft" : "raw-html"}, ${nodeCount} nodes`);
  }

  await browser.close();
  saveManifest(manifest);

  if (seed) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("\nThiếu SUPABASE env — chạy với --env-file=.env.local");
      process.exit(1);
    }
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    for (const t of TEMPLATES) {
      await upsertImportedTemplates(admin, { id: t.id });
      console.log(`  Seed ✓ ${t.id}`);
    }
  } else {
    console.log("\nSeed: node --env-file=.env.local scripts/batch-import-mehappy.mjs --seed");
  }

  console.log("\nHoàn tất batch import.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
