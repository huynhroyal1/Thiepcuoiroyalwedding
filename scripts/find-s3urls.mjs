import fs from 'fs';

const html = fs.readFileSync('e:/wep/New folder (2)/ban co thiep moi/tet.html', 'utf8');

// Tìm tất cả image URLs - nhiều patterns
const patterns = [
  /https?:\/\/[^\s"'<>]+\.webp/gi,
  /https?:\/\/[^\s"'<>]+\.jpg/gi,
  /https?:\/\/[^\s"'<>]+\.png/gi,
];

let allUrls = [];
patterns.forEach(p => {
  const matches = html.match(p) || [];
  allUrls = allUrls.concat(matches);
});

console.log('Total image URLs found:', allUrls.length);
const unique = [...new Set(allUrls)];
console.log('Unique:', unique.length);
unique.forEach(u => console.log(u.substring(0, 120)));
