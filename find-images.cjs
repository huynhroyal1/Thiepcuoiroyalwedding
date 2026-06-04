const fs = require('fs');
const j = JSON.parse(fs.readFileSync('./scripts/imported-templates/content/mewedding-lightly.json', 'utf8'));
const html = j.html;
// Find image URLs
const matches = html.match(/https:\/\/[^\s"'<>)]+\.(jpg|jpeg|png|gif|webp)/gi) || [];
const unique = [...new Set(matches)];
console.log('Image URLs found:', unique.length);
unique.forEach(u => console.log(u.substring(0, 120)));
