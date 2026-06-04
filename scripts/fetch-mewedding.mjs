/**
 * Fetch HTML từ mewedding.vn
 * Chạy: node scripts/fetch-mewedding.mjs
 */
import { writeFileSync } from 'fs';

const url = process.argv[2] || 'https://mwd.mewedding.vn/giao-dien-lightly-pro';
const outPath = process.argv[3] || './scripts/imported-templates/inbox/mewedding-lightly.raw.html';

console.log(`Fetching: ${url}`);

fetch(url)
  .then(r => r.text())
  .then(html => {
    writeFileSync(outPath, html, 'utf8');
    console.log(`Saved to: ${outPath} (${html.length} chars)`);
  })
  .catch(e => console.error('Error:', e.message));
