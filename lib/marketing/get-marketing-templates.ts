import type { TemplateRow } from "@/types";
import { createPublicSupabase } from "@/lib/supabase/public";
import { STATIC_TEMPLATES } from "@/lib/data/marketing-templates";

export async function getMarketingTemplates(): Promise<TemplateRow[]> {
  try {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: false });

    if (error) {
      console.error("[getMarketingTemplates] supabase error", error);
      return STATIC_TEMPLATES;
    }

    const results = (data ?? []) as TemplateRow[];
    // Nếu DB trả về rỗng thì dùng fallback tĩnh
    if (results.length === 0) {
      console.log("[getMarketingTemplates] DB returned 0 rows, using STATIC_TEMPLATES fallback");
      return STATIC_TEMPLATES;
    }

    return results;
  } catch (error) {
    console.error("[getMarketingTemplates] unexpected error", error);
    return STATIC_TEMPLATES;
  }
}
