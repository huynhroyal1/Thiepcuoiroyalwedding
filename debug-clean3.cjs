const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.raw.html', 'utf8');
let modified = html;

console.log('Original style count:', (modified.match(/<style[^>]*>/gi) || []).length);

// Test each replacement
console.log('\n1. Remove CDATA:');
modified = html.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');
console.log('  style_ladi found:', modified.includes('style_ladi'));

// Reset
modified = html;
console.log('\n2. Remove ladipage scripts:');
modified = modified.replace(/<script\b[^>]*>[\s\S]*?ladipage[\s\S]*?<\/script>/gi, '');
modified = modified.replace(/<script\b[^>]*src=["'][^"']*ladipage[^"']*["'][^>]*><\/script>/gi, '');
console.log('  style_ladi found:', modified.includes('style_ladi'));

// Reset
modified = html;
console.log('\n3. Remove noscript:');
modified = modified.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '');
console.log('  style_ladi found:', modified.includes('style_ladi'));

// Reset
modified = html;
console.log('\n4. Remove meta tags:');
modified = modified.replace(/<meta\b[^>]*>/gi, '');
console.log('  style_ladi found:', modified.includes('style_ladi'));

// Check for any style removal
modified = html;
const styleMatch = modified.match(/<style id="style_ladi"[^>]*>[\s\S]*?<\/style>/i);
if (styleMatch) {
  console.log('\nstyle_ladi content length:', styleMatch[0].length);
  console.log('Contains ladicdn:', styleMatch[0].includes('ladicdn'));
}
