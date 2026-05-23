/**
 * Seed / cập nhật mẫu thiệp import từ website khác — CHỈ bảng templates.
 *
 * Cấu hình: scripts/imported-templates/manifest.json
 * Craft JSON: scripts/imported-templates/content/{content_file}
 *
 * npm run seed:templates
 * npm run seed:templates -- --id=mehappy-radiant
 * npm run seed:templates -- --metadata-only
 * npm run seed:templates -- --dry-run
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { cleanMehappyHtml, mehappyHtmlToContentJson } from "./imported-templates/clean-mehappy-html.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "imported-templates");
const MANIFEST_PATH = join(ROOT, "manifest.json");
const CONTENT_DIR = join(ROOT, "content");

const PLANS = new Set(["basic", "pro", "vip"]);

function parseArgs(argv) {
  const out = { id: null, metadataOnly: false, dryRun: false };
  for (const arg of argv) {
    if (arg.startsWith("--id=")) out.id = arg.slice(5).trim();
    if (arg === "--metadata-only") out.metadataOnly = true;
    if (arg === "--dry-run") out.dryRun = true;
  }
  return out;
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`Không tìm thấy manifest: ${MANIFEST_PATH}`);
  }
  const raw = readFileSync(MANIFEST_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.templates)) {
    throw new Error("manifest.json cần mảng templates[]");
  }
  return data;
}

/** Minimal Craft.js tree check (enough for seed guard). */
function looksLikeCraftJson(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
  if (obj.type === "raw-html" && typeof obj.html === "string") return true;
  const keys = Object.keys(obj);
  if (keys.length === 0) return false;
  const sample = obj[keys[0]];
  return sample && typeof sample === "object" && ("type" in sample || "props" in sample);
}

function contentHint(contentJson) {
  if (!contentJson) return "metadata";
  if (contentJson.type === "raw-html" && typeof contentJson.html === "string") {
    return `raw-html (${Math.round(contentJson.html.length / 1024)} KB)`;
  }
  return `${Object.keys(contentJson).length} nodes`;
}

function loadContentJson(entry) {
  const file = entry.content_file?.trim();
  if (!file) return { content: undefined, warning: null };

  const path = join(CONTENT_DIR, file);
  if (!existsSync(path)) {
    return {
      content: undefined,
      warning: `  ⚠ ${entry.id}: chưa có file content/${file} — chỉ upsert metadata`,
    };
  }

  const raw = readFileSync(path, "utf8");

  if (file.endsWith(".html") || entry.content_type === "raw-html" && file.endsWith(".html")) {
    return { content: mehappyHtmlToContentJson(raw), warning: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    if (entry.content_type === "raw-html") {
      return { content: mehappyHtmlToContentJson(raw), warning: null };
    }
    throw new Error(`${entry.id}: JSON lỗi trong content/${file} — ${e.message}`);
  }

  if (parsed?.type === "raw-html" && typeof parsed.html === "string") {
    parsed.html = cleanMehappyHtml(parsed.html);
    return { content: parsed, warning: null };
  }

  if (!looksLikeCraftJson(parsed)) {
    throw new Error(`${entry.id}: content/${file} không phải Craft.js hay raw-html hợp lệ`);
  }

  return { content: parsed, warning: null };
}

function toDbRow(entry, contentJson) {
  const plan = PLANS.has(entry.plan_required) ? entry.plan_required : "basic";
  const row = {
    id: entry.id,
    name: entry.name,
    description: entry.description ?? null,
    thumbnail_url: entry.thumbnail_url ?? null,
    preview_url: entry.preview_url ?? `/thiep/mau/${entry.id}`,
    plan_required: plan,
    style_tags: Array.isArray(entry.style_tags) ? entry.style_tags : [],
    sort_order: Number.isFinite(entry.sort_order) ? entry.sort_order : 0,
    is_active: entry.is_active !== false,
  };
  if (contentJson !== undefined) {
    row.content_json = contentJson;
  }
  return row;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} admin
 * @param {{ id?: string | null, metadataOnly?: boolean, dryRun?: boolean }} opts
 */
export async function upsertImportedTemplates(admin, opts = {}) {
  const { id: filterId, metadataOnly = false, dryRun = false } = opts;
  const manifest = loadManifest();

  let entries = manifest.templates;
  if (filterId) {
    entries = entries.filter((t) => t.id === filterId);
    if (entries.length === 0) {
      throw new Error(`Không có template id="${filterId}" trong manifest.json`);
    }
  }

  const seen = new Set();
  for (const e of entries) {
    if (!e.id || typeof e.id !== "string") {
      throw new Error("Mỗi template cần id (string)");
    }
    if (seen.has(e.id)) throw new Error(`Trùng id trong manifest: ${e.id}`);
    seen.add(e.id);
    if (!e.name) throw new Error(`Template ${e.id} thiếu name`);
  }

  console.log(`\n=== Seed imported templates (${manifest.source ?? "external"}) ===`);
  if (filterId) console.log(`  Lọc: --id=${filterId}`);
  if (metadataOnly) console.log("  Chế độ: metadata-only (không ghi content_json)");
  if (dryRun) console.log("  Chế độ: dry-run (không ghi DB)\n");

  const results = { upserted: 0, skippedContent: 0, warnings: [] };

  for (const entry of entries) {
    let contentJson;
    if (!metadataOnly) {
      const { content, warning } = loadContentJson(entry);
      contentJson = content;
      if (warning) {
        results.warnings.push(warning);
        results.skippedContent += 1;
        console.log(warning);
      }
    }

    const row = toDbRow(entry, metadataOnly ? undefined : contentJson);
    const nodeHint = contentHint(row.content_json);

    if (dryRun) {
      console.log(`  [dry-run] ${entry.id} — ${entry.name} (${nodeHint})`);
      results.upserted += 1;
      continue;
    }

    const { error } = await admin.from("templates").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`Upsert ${entry.id}: ${error.message}`);

    console.log(`  ✓ ${entry.name} (${entry.id}) — ${nodeHint}`);
    results.upserted += 1;
  }

  console.log(`\nHoàn tất: ${results.upserted} mẫu`);
  if (results.skippedContent > 0) {
    console.log(
      `  ${results.skippedContent} mẫu chưa có file content — thêm JSON vào scripts/imported-templates/content/ rồi chạy lại.`
    );
  }
  console.log("  Chỉ cập nhật bảng templates — user / wedding_cards không đổi.\n");

  return results;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local");
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    await upsertImportedTemplates(admin, args);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isDirectRun) {
  main();
}
