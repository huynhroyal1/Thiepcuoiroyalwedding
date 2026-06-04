/**
 * Debug: Read template from Supabase and check content
 * Usage: node scripts/debug-template.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", "mewedding-foreign-basic")
    .single();

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  if (!data) {
    console.log("Template not found in database!");
    return;
  }

  const cj = data.content_json;
  const cjType = typeof cj;
  console.log("Template found:");
  console.log("  name:", data.name);
  console.log("  content_type:", data.content_type);
  console.log("  content_json type:", cjType);
  if (cj && typeof cj === "object") {
    const keys = Object.keys(cj);
    console.log("  content_json keys:", keys.length);
    console.log("  ROOT.type:", JSON.stringify(cj.ROOT?.type));
    console.log("  ROOT.nodes:", JSON.stringify(cj.ROOT?.nodes?.slice(0, 5)));
    const textBlocks = keys.filter(k => k !== "ROOT" && cj[k]?.type?.resolvedName === "TextBlock");
    console.log("  TextBlock count:", textBlocks.length);
    if (textBlocks.length > 0) {
      const sample = textBlocks.slice(0, 3).map(k => `${k}: "${cj[k]?.props?.content?.toString().substring(0, 30)}" left=${cj[k]?.props?.left} top=${cj[k]?.props?.top}`);
      console.log("  Sample text blocks:", sample);
    }
  } else {
    console.log("  content_json value:", String(cj).substring(0, 200));
  }
}

main().catch(console.error);
