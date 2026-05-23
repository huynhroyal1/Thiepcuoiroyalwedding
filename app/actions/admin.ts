"use server";

import { revalidatePath } from "next/cache";
import { prepareContentForSave } from "@/lib/editor/prepareContentForSave";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: "Unauthorized" as string };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { supabase, user, error: "Forbidden" as string };
  }
  return { supabase, user, error: null };
}

export async function saveTemplateContentJson(
  templateId: string,
  contentJson: Record<string, unknown>
): Promise<{ error: string | null; savedAt?: string }> {
  const { supabase, error: authErr } = await requireAdmin();
  if (authErr) return { error: authErr };

  const prepared = prepareContentForSave(contentJson);
  const savedAt = new Date().toISOString();

  let { error } = await supabase
    .from("templates")
    .update({ content_json: prepared, updated_at: savedAt })
    .eq("id", templateId);

  if (error?.message?.includes("updated_at")) {
    ({ error } = await supabase
      .from("templates")
      .update({ content_json: prepared })
      .eq("id", templateId));
  }

  if (error) return { error: error.message };
  revalidatePath(`/admin/templates`);
  revalidatePath(`/admin/templates/${templateId}/editor`);
  revalidatePath("/kho-giao-dien");
  revalidatePath("/");
  revalidatePath(`/thiep/mau/${templateId}`);
  revalidatePath(`/thiep/mau/${templateId}`, "layout");
  return { error: null, savedAt };
}

export async function createTemplate(data: {
  name: string;
  description?: string;
  plan_required: string;
  sort_order?: number;
}): Promise<{ id: string | null; error: string | null }> {
  const { supabase, error: authErr } = await requireAdmin();
  if (authErr) return { id: null, error: authErr };

  const { data: created, error } = await supabase
    .from("templates")
    .insert({
      name: data.name,
      description: data.description ?? null,
      plan_required: data.plan_required,
      sort_order: data.sort_order ?? 0,
      is_active: false,
      content_json: null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  revalidatePath("/admin/templates");
  return { id: created.id, error: null };
}

export async function updateTemplate(
  templateId: string,
  data: {
    name?: string;
    description?: string;
    plan_required?: string;
    is_active?: boolean;
    thumbnail_url?: string;
    sort_order?: number;
  }
): Promise<{ error: string | null }> {
  const { supabase, error: authErr } = await requireAdmin();
  if (authErr) return { error: authErr };

  const { error } = await supabase
    .from("templates")
    .update(data)
    .eq("id", templateId);

  if (error) return { error: error.message };
  revalidatePath("/admin/templates");
  return { error: null };
}

export async function deleteTemplate(
  templateId: string
): Promise<{ error: string | null }> {
  const { supabase, error: authErr } = await requireAdmin();
  if (authErr) return { error: authErr };

  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", templateId);

  if (error) return { error: error.message };
  revalidatePath("/admin/templates");
  return { error: null };
}
