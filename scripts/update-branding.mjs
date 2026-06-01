import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateBranding() {
  console.log('Starting branding update...\n');

  // Update description: "import từ MeHappy" -> "import từ Royal Wedding"
  const { data: descData, error: descError } = await supabase
    .from('templates')
    .update({ 
      description: supabase.sql`
        REPLACE(description, 'MeHappy', 'Royal Wedding')
      `
    })
    .ilike('description', '%import từ MeHappy%');

  if (descError) {
    console.error('Description update error:', descError);
  } else {
    console.log('✓ Updated descriptions');
  }

  // Count remaining MeHappy in style_tags
  const { data: remainingTags } = await supabase
    .from('templates')
    .select('id, style_tags')
    .or(`style_tags.ilike.%Import MeHappy%,style_tags.ilike.%Import meHappy%`);

  console.log(`\nTemplates with "Import MeHappy" tag: ${remainingTags?.length || 0}`);
  
  if (remainingTags && remainingTags.length > 0) {
    for (const t of remainingTags) {
      const newTags = (t.style_tags || []).map(tag => 
        tag === 'Import MeHappy' || tag === 'Import meHappy' ? 'Import Royal Wedding' : tag
      );
      
      await supabase
        .from('templates')
        .update({ style_tags: newTags })
        .eq('id', t.id);
    }
    console.log('✓ Updated style_tags');
  }

  // Verify
  const { data: verify } = await supabase
    .from('templates')
    .select('id')
    .or(`style_tags.ilike.%Import MeHappy%,description.ilike.%MeHappy%`)
    .limit(5);

  console.log(`\nRemaining with MeHappy: ${verify?.length || 0}`);
  console.log('\n✅ Branding update complete!');
}

updateBranding().catch(console.error);
