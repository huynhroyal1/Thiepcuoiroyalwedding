const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.raw.html', 'utf8');
// Find iframe with srcdoc
const iframeMatch = html.match(/<iframe[^>]*srcdoc[^>]*>/i);
console.log('Iframe with srcdoc:', iframeMatch ? iframeMatch[0].substring(0, 200) : 'NOT FOUND');

// Find all ladicdn URLs
const ladicdnUrls = html.match(/https:\/\/w\.ladicdn\.com[^\s"'<>)]+/g) || [];
const unique = [...new Set(ladicdnUrls)];
console.log('\nLadiCDN URLs found:', unique.length);
unique.forEach(u => console.log(u.substring(0, 100)));
