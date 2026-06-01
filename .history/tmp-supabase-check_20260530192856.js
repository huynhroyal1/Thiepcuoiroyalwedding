const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).reduce((acc, line) => {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
(async () => {
  const { data, error } = await supabase
    .from('wedding_cards')
    .select('id,slug,template_id,status,content_json,updated_at,wedding_date,bride_name,groom_name')
    .eq('slug','quyenmo')
    .maybeSingle();
  console.log('error=', error);
  if (data) {
    console.log({
      id: data.id,
      slug: data.slug,
      template_id: data.template_id,
      status: data.status,
      wedding_date: data.wedding_date,
      bride_name: data.bride_name,
      groom_name: data.groom_name,
      content_json_type: typeof data.content_json,
      content_json_keys: data.content_json ? Object.keys(data.content_json).slice(0, 10) : null,
    });
  }
})();
