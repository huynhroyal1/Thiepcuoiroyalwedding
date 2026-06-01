import fs from 'fs';

// Check tet.html
const tetHtml = fs.readFileSync('e:/wep/New folder (2)/ban co thiep moi/tet.html', 'utf8');
console.log('=== tet.html ===');
console.log('Size:', Math.round(tetHtml.length / 1024), 'KB');

// Find actual image tags
const imgTags = tetHtml.match(/<img[^>]+>/gi) || [];
console.log('<img> tags:', imgTags.length);

// Find URLs with image extensions
const imgUrls = tetHtml.match(/https?:\/\/[^"'\s>]*\.(jpg|jpeg|png|webp|gif)/gi) || [];
console.log('Image URLs:', imgUrls.length);
const uniqueUrls = [...new Set(imgUrls)];
console.log('Unique image URLs:', uniqueUrls.length);
uniqueUrls.slice(0, 10).forEach(u => console.log(' ', u.substring(0, 100)));

// Check if images are inside the HTML body
const bodyMatch = tetHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
if (bodyMatch) {
  const bodyContent = bodyMatch[1];
  const bodyImgs = bodyContent.match(/<img[^>]+>/gi) || [];
  console.log('\nImages in body:', bodyImgs.length);
  
  const bodyImgUrls = bodyContent.match(/https?:\/\/[^"'\s>]*\.(jpg|jpeg|png|webp|gif)/gi) || [];
  console.log('Image URLs in body:', bodyImgUrls.length);
  if (bodyImgUrls.length > 0) {
    console.log('First few:', bodyImgUrls.slice(0, 5));
  }
}
