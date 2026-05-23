/**
 * Xóa 10 mẫu MeHappy raw-html khỏi DB, generate Craft JSON, seed lại.
 *
 * npm run reseed:mehappy-craft
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { MEHAPPY_RAW_HTML_IDS } from "../lib/editor/presets/mehappy-craft-themes.mjs";
import { upsertImportedTemplates } from "./seed-imported-templates.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env.local");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n=== Reseed MeHappy → Craft (kéo-thả) ===\n");

  console.log("1/3 Generate Craft JSON files…");
  execSync("node scripts/generate-mehappy-craft-templates.mjs", {
    cwd: join(__dirname, ".."),
    stdio: "inherit",
  });

  console.log("\n2/3 Xóa mẫu raw-html cũ khỏi DB…");
  for (const id of MEHAPPY_RAW_HTML_IDS) {
    const { error } = await admin.from("templates").delete().eq("id", id);
    if (error) {
      console.warn(`  ⚠ Không xóa được ${id}: ${error.message}`);
    } else {
      console.log(`  ✓ Đã xóa ${id}`);
    }
  }

  console.log("\n3/3 Seed lại 10 mẫu Craft…");
  for (const id of MEHAPPY_RAW_HTML_IDS) {
    await upsertImportedTemplates(admin, { id });
  }

  console.log("\n✓ Xong — mở Admin → Templates → icon editor để kéo-thả.\n");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
