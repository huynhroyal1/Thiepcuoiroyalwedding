/**
 * Update MeHappy branding in database
 * Run: node --env-file=.env.local scripts/update-mehappy-text.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envFile = join(__dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envFile, "utf-8");
  for (const line of envContent.split("\n")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  }
} catch (e) {
  console.error("Could not load .env.local");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBranding() {
  console.log("🔄 Updating MeHappy branding in database...\n");

  // Update style_tags: "Import MeHappy" -> "Import Royal Wedding"
  const { data: allTemplates } = await supabase
    .from("templates")
    .select("id, style_tags, description");

  let updatedCount = 0;
  for (const t of allTemplates || []) {
    let needsUpdate = false;
    let newTags = null;
    let newDesc = null;

    // Check style_tags
    if (t.style_tags) {
      const tags = Array.isArray(t.style_tags) ? t.style_tags : [];
      const newTagsArr = tags.map(tag => {
        if (tag === "Import MeHappy") {
          needsUpdate = true;
          return "Import Royal Wedding";
        }
        if (tag === "Import meHappy") {
          needsUpdate = true;
          return "Import Royal Wedding";
        }
        return tag;
      });
      if (needsUpdate) newTags = newTagsArr;
    }

    // Check description
    if (t.description && t.description.includes("MeHappy")) {
      needsUpdate = true;
      newDesc = t.description.replace(/MeHappy/g, "Royal Wedding");
    }

    if (needsUpdate) {
      const updates = {};
      if (newTags) updates.style_tags = newTags;
      if (newDesc) updates.description = newDesc;
      
      await supabase
        .from("templates")
        .update(updates)
        .eq("id", t.id);
      
      updatedCount++;
    }
  }

  console.log(`✅ Updated ${updatedCount} templates`);

  // Verify
  const { data: remaining } = await supabase
    .from("templates")
    .select("id, style_tags, description")
    .or(`style_tags.ilike.%Import MeHappy%,description.ilike.%MeHappy%`);

  console.log(`\nRemaining with "MeHappy": ${remaining?.length || 0}`);
  
  if (remaining && remaining.length > 0) {
    for (const t of remaining.slice(0, 5)) {
      console.log(`  - ID: ${t.id}`);
    }
  }

  console.log("\n✨ Done!");
}

updateBranding().catch(console.error);
