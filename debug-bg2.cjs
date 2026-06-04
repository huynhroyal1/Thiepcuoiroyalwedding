const fs = require('fs');
const html = fs.readFileSync('./scripts/imported-templates/inbox/mewedding-lightly.raw.html', 'utf8');

// Check for LadiCDN URLs in CSS
const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
let ladicdnUrls = [];
styleMatches.forEach(s => {
  const urls = s.match(/https?:\/\/[^\s"'<>)]+/g) || [];
  urls.forEach(u => {
    if (u.includes('ladicdn')) {
      ladicdnUrls.push(u);
    }
  });
});
const unique = [...new Set(ladicdnUrls)];
console.log('LadiCDN URLs in CSS:', unique.length);
unique.slice(0, 10).forEach(u => console.log(' -', u.substring(0, 100)));

// Check data URLs (SVG icons)
const dataUrls = html.match(/data:image\/svg\+xml[^"')]+/gi) || [];
console.log('\nData URL SVGs:', dataUrls.length);

// Check if images are in data attributes instead
const dataImageAttr = html.match(/data-image=["'][^"']+["']/gi) || [];
console.log('data-image attributes:', dataImageAttr.length);

// Check for actual image tags with src
const imgTags = html.match(/<img[^>]+>/gi) || [];
console.log('\nimg tags:', imgTags.length);
imgTags.slice(0, 5).forEach(t => {
  const src = t.match(/src=["'][^"']+["']/i);
  if (src) console.log(' - src:', src[0].substring(0, 80));
});
