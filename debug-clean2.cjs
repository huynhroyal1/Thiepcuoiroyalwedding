const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.raw.html', 'utf8');
let modified = html;

// Apply the same replacements
modified = modified.replace(/<script\b[^>]*>(?:google|facebook|analytics|tracking)[^<]*<\/script>/gi, '');
modified = modified.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');
modified = modified.replace(/<script\b[^>]*>[\s\S]*?ladipage[\s\S]*?<\/script>/gi, '');
modified = modified.replace(/<script\b[^>]*src=["'][^"']*ladipage[^"']*["'][^>]*><\/script>/gi, '');
modified = modified.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');

const styleMatches = modified.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
console.log('Style tags after cleaning:', styleMatches.length);

// Check if the styles are still there
console.log('\nChecking for style_element (73K style):');
console.log(modified.includes('style_element') ? 'FOUND' : 'NOT FOUND');

console.log('\nChecking for style_ladi:');
console.log(modified.includes('style_ladi') ? 'FOUND' : 'NOT FOUND');
