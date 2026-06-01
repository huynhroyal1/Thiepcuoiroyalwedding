// Script để cập nhật tất cả style_tags và description chứa MeHappy trong database
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTemplates() {
  // Update style_tags: "Import MeHappy" -> "Import Royal Wedding"
  const { data: data1, error: error1 } = await supabase
    .from("templates")
    .update({ style_tags: supabase.rpc("jsonb_set", { 
      x: {}, 
      path: "{}", 
      value: "Import Royal Wedding" 
    }) })
    .like("style_tags", '%"Import MeHappy"%');

  // Đếm số templates có "Import MeHappy"
  const { data: countData } = await supabase
    .from("templates")
    .select("id, style_tags")
    .ilike("style_tags", '%"Import MeHappy"%');

  console.log(`Found ${countData?.length || 0} templates with "Import MeHappy" in style_tags`);

  // Update trực tiếp qua SQL
  const { data, error } = await supabase.rpc("exec_sql", {
    sql: `
      UPDATE templates 
      SET style_tags = REPLACE(style_tags::text, '"Import MeHappy"', '"Import Royal Wedding"')::jsonb
      WHERE style_tags::text LIKE '%"Import MeHappy"%';
    `
  });

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Updated templates successfully!");
  }

  // Kiểm tra lại
  const { data: remaining } = await supabase
    .from("templates")
    .select("id")
    .ilike("style_tags", '%"Import MeHappy"%');

  console.log(`Remaining templates with "Import MeHappy": ${remaining?.length || 0}`);
}

updateTemplates();
