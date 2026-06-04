import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  return argv[2] || null;
}

async function main() {
  const id = parseArgs(process.argv);
  if (!id) {
    console.error('Usage: node --env-file=.env.local scripts/check-template-content.mjs <templateId>');
    process.exit(2);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in env');
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.from('templates').select('id, name, is_active, content_json, content_json::text, preview_url, template_id').eq('id', id).maybeSingle();
  if (error) {
    console.error('Supabase error:', error.message || error);
    process.exit(1);
  }

  if (!data) {
    console.log('Template not found:', id);
    process.exit(0);
  }

  console.log('Template:', { id: data.id, name: data.name, is_active: data.is_active, preview_url: data.preview_url });

  const cj = data.content_json;
  if (cj == null) {
    console.log('content_json: null');
    process.exit(0);
  }

  try {
    const str = JSON.stringify(cj);
    console.log('content_json size (chars):', str.length);
    const keys = Object.keys(cj instanceof Object ? cj : {});
    console.log('top-level keys count:', keys.length, 'sample keys:', keys.slice(0, 20));

    if ((cj && typeof cj === 'object' && 'type' in cj && cj.type === 'raw-html')) {
      console.log('Detected kind: raw-html');
    } else if (cj && typeof cj === 'object' && cj.ROOT) {
      console.log('Detected kind: craft (has ROOT)');
      console.log('ROOT nodes count:', Array.isArray(cj.ROOT?.nodes) ? cj.ROOT.nodes.length : 'unknown');
    }

    // Print small preview
    console.log('content_json preview (first 2000 chars):\n', str.substring(0, 2000));
  } catch (e) {
    console.error('Error serializing content_json:', e.message || e);
  }
}

main();
