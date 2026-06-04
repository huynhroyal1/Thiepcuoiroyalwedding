// Check both templates from DB directly
// Usage: node check-templates-direct.mjs

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function main() {
  const templateIds = ['mehappy-pham-tuan-nguyen-them', 'mehappy-ds03-vip'];
  
  // Try direct fetch from API with debug
  for (const id of templateIds) {
    console.log(`\n\n========== ${id} ==========`);
    try {
      const res = await fetch(`http://localhost:3000/thiep/mau/${id}?debug=1`, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Response (first 3000 chars):', text.slice(0, 3000));
    } catch (err) {
      console.log('Fetch error:', err.message);
    }
  }
}

main();
