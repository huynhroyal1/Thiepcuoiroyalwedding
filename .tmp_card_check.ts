import { createPublicSupabase } from './lib/supabase/public';

async function main() {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from('wedding_cards')
    .select('id, slug, content_json, template_id, status')
    .eq('slug', 'quyenmo')
    .maybeSingle();
  console.log(JSON.stringify({
    error: error?.message ?? null,
    data: data
      ? {
          id: data.id,
          slug: data.slug,
          template_id: data.template_id,
          status: data.status,
          content_json_type: typeof data.content_json,
          content_json_preview: JSON.stringify(data.content_json).slice(0, 1000),
        }
      : null,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
