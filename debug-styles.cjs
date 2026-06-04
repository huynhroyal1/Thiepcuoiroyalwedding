const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.raw.html', 'utf8');

// Find all style tags
const styleMatches = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
console.log('Style tags found in raw HTML:', styleMatches.length);
styleMatches.forEach((s, i) => {
  console.log(`\nStyle ${i+1} (${s.length} chars):`);
  console.log(s.substring(0, 200));
});

// Check if styles are in head vs body
const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
console.log('\n--- Head ---');
const headStyles = headMatch ? (headMatch[1].match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []) : [];
console.log('Styles in head:', headStyles.length);
console.log('\n--- Body ---');
const bodyStyles = bodyMatch ? (bodyMatch[1].match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []) : [];
console.log('Styles in body:', bodyStyles.length);
