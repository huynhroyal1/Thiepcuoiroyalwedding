/**
 * Clone template Brightly VIP từ tet.html - GIỮ NGUYÊN images
 */

import fs from 'fs';

const SOURCE_FILE = "e:/wep/New folder (2)/ban co thiep moi/tet.html";
const OUTPUT_FILE = "scripts/imported-templates/content/mehappy-brightly-vip-full.json";

console.log("=== Clone Brightly VIP từ tet.html (GIỮ NGUYÊN images) ===\n");

// Đọc file nguồn
console.log("📖 Đọc file nguồn...");
const html = fs.readFileSync(SOURCE_FILE, 'utf8');
console.log(`   Kích thước: ${Math.round(html.length / 1024)} KB`);

// Trích xuất body
console.log("\n🔧 Trích xuất body...");
const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
let bodyHtml = bodyMatch ? bodyMatch[1] : html;
console.log(`   Body size: ${Math.round(bodyHtml.length / 1024)} KB`);

// Đếm images trước khi clean
const imgsBefore = bodyHtml.match(/<img[^>]+>/gi) || [];
console.log(`   Images trước clean: ${imgsBefore.length}`);

// Clean HTML - CHỈ xóa scripts, KHÔNG xóa content
console.log("\n🧹 Clean HTML (giữ images)...");

let cleaned = bodyHtml;

// 1. Xóa React hydration scripts (RÚT GỌN - giữ lại content)
cleaned = cleaned.replace(
  /<script[^>]*>[\s\S]*?self\.__next_f\.push\([\s\S]*?<\/script>/gi,
  ''
);
cleaned = cleaned.replace(
  /<script[^>]*>[\s\S]*?self\.__next_s\.push\([\s\S]*?<\/script>/gi,
  ''
);
cleaned = cleaned.replace(
  /<script[^>]*>[\s\S]*?__NEXT_DATA__[\s\S]*?<\/script>/gi,
  ''
);

// 2. Xóa external script tags (src) - KHÔNG xóa inline scripts
cleaned = cleaned.replace(
  /<script[^>]*\ssrc=["'][^"']*["'][^>]*><\/script>/gi,
  ''
);

// 3. Xóa Facebook/Google scripts
cleaned = cleaned.replace(
  /<script[^>]*src=["']https:\/\/connect\.facebook\.net[^"']*["'][^>]*><\/script>/gi,
  ''
);
cleaned = cleaned.replace(
  /<script[^>]*src=["']https:\/\/www\.googletagmanager\.com[^"']*["'][^>]*><\/script>/gi,
  ''
);
cleaned = cleaned.replace(
  /<script[^>]*id=["']google-analytics["'][^>]*>[\s\S]*?<\/script>/gi,
  ''
);
cleaned = cleaned.replace(
  /<script[^>]*id=["']meta-pixel["'][^>]*>[\s\S]*?<\/script>/gi,
  ''
);

// 4. Xóa noscript (quảng cáo)
cleaned = cleaned.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

// 5. Xóa comments
cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

// 6. Xóa hidden divs (chỉ div rỗng)
cleaned = cleaned.replace(/<div[^>]*hidden[^>]*><\/div>/gi, '');

// 7. Xóa Next.js route announcer
cleaned = cleaned.replace(/<next-route-announcer[^>]*>[\s\S]*?<\/next-route-announcer>/gi, '');

// 8. Xóa Monica extension UI
cleaned = cleaned.replace(/<div[^>]*monica-id[^>]*>[\s\S]*?<\/div>/gi, '');
cleaned = cleaned.replace(/monica-id=["'][^"']*["']/gi, '');
cleaned = cleaned.replace(/monica-version=["'][^"']*["']/gi, '');

// 9. Fix đường dẫn tương đối
cleaned = cleaned.replace(/href="\.\//g, 'href="https://mehappy.vn/');
cleaned = cleaned.replace(/src="\.\//g, 'src="https://mehappy.vn/');

// 10. Decode Next.js image URLs
cleaned = cleaned.replace(
  /src="\/(_next\/image\?url=)([^&"]+)/g,
  (match, prefix, url) => {
    const decoded = decodeURIComponent(url);
    return `src="${decoded}"`;
  }
);

// 11. Fix srcset URLs  
cleaned = cleaned.replace(
  /srcset="\/(_next\/image\?url=)([^&"]+)/g,
  (match, prefix, url) => {
    const decoded = decodeURIComponent(url);
    return `srcset="${decoded}`;
  }
);

// 12. Xóa các class không cần thiết (CSS modules đã load rồi)
cleaned = cleaned.replace(/class="geist_[^"]*"/gi, '');

// 13. Xóa data-nimg và data-width/height dư thừa
cleaned = cleaned.replace(/\s*data-nimg="[^"]*"/gi, '');
cleaned = cleaned.replace(/\s*data-width="[^"]*"/gi, '');
cleaned = cleaned.replace(/\s*data-height="[^"]*"/gi, '');

// 14. Wrap trong container
cleaned = `<div class="brightly-vip-page" style="max-width:100%;overflow-x:hidden;">\n${cleaned}\n</div>`;

console.log(`   Sau clean: ${Math.round(cleaned.length / 1024)} KB`);

// Đếm images sau khi clean
const imgsAfter = cleaned.match(/<img[^>]+>/gi) || [];
console.log(`   Images sau clean: ${imgsAfter.length}`);

// Tìm image URLs
const imgUrls = cleaned.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp|gif)/gi) || [];
console.log(`   Image URLs: ${imgUrls.length}`);
const uniqueUrls = [...new Set(imgUrls)];
console.log(`   Unique image URLs: ${uniqueUrls.length}`);

// Tạo JSON
const content = {
  type: "raw-html",
  html: cleaned
};

// Lưu file
console.log("\n💾 Lưu file...");
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(content, null, 2), 'utf8');
console.log(`   Đã lưu: ${OUTPUT_FILE}`);

// Cập nhật manifest
console.log("\n📝 Cập nhật manifest...");

const manifestPath = "scripts/imported-templates/manifest.json";
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Thêm template mới
const newTemplate = {
  id: "mehappy-brightly-vip-full",
  name: "Brightly VIP - Full",
  description: "Template Brightly VIP - clone từ HTML đầy đủ với images",
  thumbnail_url: "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/7392765d-4553-44d5-9404-1547948a3cd5.webp",
  preview_url: null,
  plan_required: "vip",
  style_tags: ["Import MeHappy", "Bright", "Modern", "Full HTML"],
  sort_order: 135,
  is_active: true,
  content_type: "raw-html",
  content_file: "mehappy-brightly-vip-full.json"
};

manifest.templates.push(newTemplate);
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
console.log("   Đã cập nhật manifest");

console.log("\n✅ Hoàn tất!");
console.log(`   Template: Brightly VIP - Full`);
console.log(`   Images: ${imgsAfter.length}`);
console.log(`   Unique URLs: ${uniqueUrls.length}`);
console.log("\nChạy: npm run seed:templates");
