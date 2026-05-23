/**
 * Tạo Craft.js JSON (kéo-thả) cho các mẫu MeHappy đã import raw-html.
 *
 * npm run generate:mehappy-craft
 */

import { writeFileSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  buildMehappyCraftJson,
  MEHAPPY_RAW_HTML_IDS,
} from "../lib/editor/presets/mehappy-craft-themes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "imported-templates");
const MANIFEST_PATH = join(ROOT, "manifest.json");
const CONTENT_DIR = join(ROOT, "content");

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
}

function saveManifest(manifest) {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function main() {
  const manifest = loadManifest();
  let generated = 0;

  console.log("\n=== Generate MeHappy Craft templates ===\n");

  for (const entry of manifest.templates) {
    if (!MEHAPPY_RAW_HTML_IDS.includes(entry.id)) continue;

    const contentJson = buildMehappyCraftJson(entry.id, entry);
    const nodeCount = Object.keys(contentJson).length;
    const outPath = join(CONTENT_DIR, `${entry.id}.json`);

    writeFileSync(outPath, `${JSON.stringify(contentJson, null, 2)}\n`, "utf8");

    delete entry.content_type;
    entry.description = (entry.description ?? "")
      .replace(/\(import MeHappy\)\.?/gi, "")
      .replace(/import MeHappy \(HTML\)[^.]*\.?/gi, "")
      .trim();
    if (!entry.description.includes("Craft")) {
      entry.description = `${entry.description} — chỉnh kéo-thả Craft.js (7 section đầy đủ).`.trim();
    }
    if (Array.isArray(entry.style_tags)) {
      entry.style_tags = entry.style_tags.map((t) =>
        t === "Import MeHappy" ? "Craft kéo-thả" : t
      );
    }

    console.log(`  ✓ ${entry.id} — ${nodeCount} nodes → content/${entry.id}.json`);
    generated += 1;
  }

  saveManifest(manifest);
  console.log(`\nHoàn tất: ${generated} file Craft.js\n`);
}

main();
