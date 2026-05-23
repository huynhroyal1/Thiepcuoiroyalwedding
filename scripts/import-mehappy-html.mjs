/**
 * Import một file HTML MeHappy → manifest + content → seed DB.
 *
 * npm run import:mehappy-html -- --id=mehappy-classy-vogue --name="Classy Vogue" --plan=vip --file=./path/to.html
 * npm run import:mehappy-html -- --id=mehappy-classy-vogue --file=./path/to.html --seed
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { cleanMehappyHtml, mehappyHtmlToContentJson } from "./imported-templates/clean-mehappy-html.mjs";
import { mehappyHtmlToCraftContentJson } from "../lib/editor/mehappy-html-to-craft.mjs";
import { upsertImportedTemplates } from "./seed-imported-templates.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "imported-templates");
const MANIFEST_PATH = join(ROOT, "manifest.json");
const CONTENT_DIR = join(ROOT, "content");

function parseArgs(argv) {
  const out = {
    id: null,
    name: null,
    plan: "pro",
    file: null,
    thumbnail: null,
    description: null,
    previewUrl: null,
    sortOrder: 200,
    seed: false,
    dryRun: false,
    craft: true,
  };
  for (const arg of argv) {
    if (arg.startsWith("--id=")) out.id = arg.slice(5).trim();
    if (arg.startsWith("--name=")) out.name = arg.slice(7).trim();
    if (arg.startsWith("--plan=")) out.plan = arg.slice(7).trim();
    if (arg.startsWith("--file=")) out.file = arg.slice(7).trim();
    if (arg.startsWith("--thumbnail=")) out.thumbnail = arg.slice(12).trim();
    if (arg.startsWith("--description=")) out.description = arg.slice(14).trim();
    if (arg.startsWith("--preview-url=")) out.previewUrl = arg.slice(14).trim();
    if (arg.startsWith("--sort-order=")) out.sortOrder = Number(arg.slice(13));
    if (arg === "--seed") out.seed = true;
    if (arg === "--dry-run") out.dryRun = true;
    if (arg === "--raw-html") out.craft = false;
    if (arg === "--craft") out.craft = true;
  }
  return out;
}

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function guessThumbnail(html) {
  const m = html.match(/src="(https:\/\/s3-hcm-r2\.s3cloud\.vn\/[^"]+\.(?:webp|jpg|png))"/i);
  return m?.[1] ?? null;
}

function guessNameFromHtml(html) {
  const groom = html.match(/data-node-id="6z0sv12rEM"[\s\S]*?<span[^>]*>([^<]+)</i);
  const bride = html.match(/data-node-id="HxTlSAlkha"[\s\S]*?<span[^>]*>([^<]+)</i);
  if (groom?.[1] && bride?.[1]) {
    return `${groom[1].trim()} & ${bride[1].trim()}`;
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id || !args.file) {
    console.error(
      "Usage: npm run import:mehappy-html -- --id=mehappy-xxx --file=./template.html [--name=...] [--plan=vip] [--seed]"
    );
    process.exit(1);
  }

  const htmlPath = resolve(process.cwd(), args.file);
  if (!existsSync(htmlPath)) {
    console.error(`Không tìm thấy file: ${htmlPath}`);
    process.exit(1);
  }

  const rawHtml = readFileSync(htmlPath, "utf8");
  const cleaned = cleanMehappyHtml(rawHtml);
  const contentJson = args.craft
    ? mehappyHtmlToCraftContentJson(cleaned)
    : mehappyHtmlToContentJson(rawHtml);

  const htmlOut = join(CONTENT_DIR, `${args.id}.html`);
  const jsonOut = join(CONTENT_DIR, `${args.id}.json`);

  if (!args.dryRun) {
    writeFileSync(htmlOut, cleaned, "utf8");
    writeFileSync(jsonOut, `${JSON.stringify(contentJson, null, 2)}\n`, "utf8");
  }

  const manifest = loadManifest();
  const entry = {
    id: args.id,
    name: args.name ?? guessNameFromHtml(cleaned) ?? args.id,
    description:
      args.description ??
      (args.craft
        ? "Mẫu import từ MeHappy — chuyển Craft.js kéo-thả, giữ layout & text gốc."
        : "Mẫu import từ MeHappy (HTML) — hiển thị qua InvitationHTMLViewer."),
    thumbnail_url: args.thumbnail ?? guessThumbnail(cleaned),
    preview_url: args.previewUrl ?? null,
    plan_required: args.plan,
    style_tags: ["Import MeHappy", "Sang trọng"],
    sort_order: args.sortOrder,
    is_active: true,
    content_type: args.craft ? "craft" : "raw-html",
    content_file: `${args.id}.json`,
  };

  const idx = manifest.templates.findIndex((t) => t.id === args.id);
  if (idx >= 0) manifest.templates[idx] = { ...manifest.templates[idx], ...entry };
  else manifest.templates.push(entry);

  if (!args.dryRun) saveManifest(manifest);

  console.log(`\n=== Import MeHappy HTML: ${args.id} ===`);
  console.log(`  File nguồn: ${htmlPath}`);
  console.log(`  HTML đã lưu: content/${args.id}.html (${Math.round(cleaned.length / 1024)} KB)`);
  const nodeCount = args.craft ? Object.keys(contentJson).length : 1;
  console.log(
    `  content_json: content/${args.id}.json (${args.craft ? `craft, ${nodeCount} nodes` : "raw-html"})`
  );
  console.log(`  Manifest: ${entry.name} — gói ${entry.plan_required}`);

  if (args.dryRun) {
    console.log("\n[dry-run] Không ghi file / DB.\n");
    return;
  }

  if (args.seed) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("\nChạy với --env-file=.env.local hoặc npm run seed:templates -- --id=...");
      process.exit(1);
    }
    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await upsertImportedTemplates(admin, { id: args.id });
  } else {
    console.log(`\nChạy seed: npm run seed:templates -- --id=${args.id}\n`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
