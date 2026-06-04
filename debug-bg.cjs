const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.raw.html', 'utf8');

// Check for background-image in raw HTML
const bgMatches = html.match(/background-image:\s*url\([^)]+\)/gi) || [];
console.log('background-image matches:', bgMatches.length);
if (bgMatches.length > 0) {
  bgMatches.slice(0, 5).forEach(m => console.log(' -', m.substring(0, 100)));
}

// Check for ladicdn in raw
const ladicdnInRaw = html.match(/ladicdn/g) || [];
console.log('\nLadiCDN mentions in raw HTML:', ladicdnInRaw.length);

// Check for ladicdn in styles
const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('\nStyle tags found:', styleMatches.length);
let ladicdnInStyles = 0;
styleMatches.forEach(s => {
  if (s.includes('ladicdn')) ladicdnInStyles++;
  const urls = s.match(/https?:\/\/[^\s"'<>)]+/g) || [];
  urls.forEach(u => {
    if (u.includes('ladicdn')) ladicdnInStyles++;
  });
});
console.log('LadiCDN in styles:', ladicdnInStyles);
