import { unstable_noStore as noStore } from "next/cache";
import { createPublicSupabase } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { TemplateRow } from "@/types";

/** Public: mẫu active. Admin: cả mẫu ẩn (xem trước khi chỉnh). */
export async function fetchTemplateForPreview(templateId: string, opts?: { forcePreview?: boolean }): Promise<TemplateRow | null> {
  noStore();

  const publicSupabase = createPublicSupabase();
  const { data: active } = await publicSupabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_active", true)
    .maybeSingle();

  if (active) return active as TemplateRow;
  console.log('[fetchTemplateForPreview] template not active or not found publicly:', templateId, 'forcePreview=', !!opts?.forcePreview, 'DEV_BYPASS=', process.env.DEV_BYPASS_TEMPLATE_PREVIEW);
  // If explicitly forced (dev only), attempt to return template even when not active
  const allowBypass = opts?.forcePreview || process.env.DEV_BYPASS_TEMPLATE_PREVIEW === '1';
  if (allowBypass) {
    const bypassSupabase = await createClient();
    const { data: bypassTemplate } = await bypassSupabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();
    if (bypassTemplate) {
      console.log('[fetchTemplateForPreview] returning bypassed template for', templateId);
      return bypassTemplate as TemplateRow;
    }
  }
  try {
    // attempt to log cookie presence (server route handler)
  } catch {}

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[fetchTemplateForPreview] no user in server session, cannot return admin template', templateId);
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    console.warn('[fetchTemplateForPreview] user not admin', { userId: user.id, role: profile?.role, templateId });
    return null;
  }

  const { data: anyTemplate } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  return (anyTemplate as TemplateRow | null) ?? null;
}
