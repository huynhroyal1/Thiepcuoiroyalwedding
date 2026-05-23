import { unstable_noStore as noStore } from "next/cache";
import { createPublicSupabase } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { TemplateRow } from "@/types";

/** Public: mẫu active. Admin: cả mẫu ẩn (xem trước khi chỉnh). */
export async function fetchTemplateForPreview(templateId: string): Promise<TemplateRow | null> {
  noStore();

  const publicSupabase = createPublicSupabase();
  const { data: active } = await publicSupabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (active) return active as TemplateRow;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;

  const { data: anyTemplate } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  return (anyTemplate as TemplateRow | null) ?? null;
}
