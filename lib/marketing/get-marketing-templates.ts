export async function getMarketingTemplates(): Promise<TemplateRow[]> {
  try {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: false });

    if (error) throw error;
    return (data ?? []) as TemplateRow[];
  } catch {
    return [];
  }
}
