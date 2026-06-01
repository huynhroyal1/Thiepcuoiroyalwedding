/**
 * Clone template Brightly VIP từ view-source HTML đã hydrate
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONTENT_DIR = "scripts/imported-templates/content";

const template = {
  id: "mehappy-brightly-vip-2",
  name: "Brightly VIP (Raw HTML)",
  description: "Template Brightly VIP — phong cách tươi sáng, hiện đại. Clone từ view-source.",
  htmlFile: "view-source_https___mehappy.vn_view_template_7.html",
  plan: "vip",
  thumbnail: "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/7392765d-4553-44d5-9404-1547948a3cd5.webp",
  sortOrder: 132
};

function extractBody(html) {
  // Lấy phần body từ HTML đã render
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1];
  return null;
}

function cleanHtml(html) {
  let out = html.trim();
  
  console.log("   1. Xóa script tags (trừ inline handlers)...");
  out = out.replace(/<script(?![^>]*\ssrc=)[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<script[^>]*\ssrc="[^"]*"[^>]*><\/script>/gi, "");
  
  console.log("   2. Xóa noscript...");
  out = out.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  console.log("   3. Xóa comments...");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  
  console.log("   4. Xóa Monica extension...");
  out = out.replace(/<div[^>]*monica-id[^>]*>[\s\S]*?<\/div>/gi, "");
  out = out.replace(/monica-id="[^"]*"/gi, "");
  
  console.log("   5. Xóa Next.js route announcer...");
  out = out.replace(/<next-route-announcer[^>]*>[\s\S]*?<\/next-route-announcer>/gi, "");
  
  console.log("   6. Xóa hidden divs...");
  out = out.replace(/<div[^>]*hidden[^>]*>[\s\S]*?<\/div>/gi, "");
  
  console.log("   7. Fix đường dẫn tương đối...");
  out = out.replace(/href="\.\//g, 'href="https://mehappy.vn/');
  out = out.replace(/src="\.\//g, 'src="https://mehappy.vn/');
  
  console.log("   8. Xóa mehappy branding...");
  out = out.replace(/meWedding[^-]*-[^-]*[^-]*/gi, "");
  
  console.log("   9. Xóa Next.js preloads...");
  out = out.replace(/<link[^>]*rel="preload"[^>]*>/gi, "");
  
  console.log("   10. Xóa hidden wrapper...");
  out = out.replace(/<div[^>]*__next[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi, "</div>");
  
  return out;
}

console.log("=== Clone Brightly VIP (Raw HTML) ===\n");

const htmlPath = "E:/wep/New folder (2)/ban co thiep moi/view-source_https___mehappy.vn_view_template_7.html";
const outputPath = "E:/wep/New folder (2)/ban co thiep moi/Huynh_Royal_16_05_2026 (3)/tet/Huynh_Royal_24_05_2026/scripts/imported-templates/content/mehappy-brightly-vip-2.json";

if (!existsSync(htmlPath)) {
  console.log(`❌ Không tìm thấy: ${htmlPath}`);
  process.exit(1);
}

console.log("📖 Đọc file HTML...");
const html = readFileSync(htmlPath, "utf8");
console.log(`   Kích thước ban đầu: ${Math.round(html.length / 1024)} KB`);

console.log("🔧 Trích xuất body...");
let bodyHtml = extractBody(html);
if (!bodyHtml) {
  console.log("❌ Không tìm thấy body tag");
  process.exit(1);
}
console.log(`   Body size: ${Math.round(bodyHtml.length / 1024)} KB`);

console.log("🧹 Clean HTML...");
const cleanedHtml = cleanHtml(bodyHtml);
console.log(`   Sau clean: ${Math.round(cleanedHtml.length / 1024)} KB`);

console.log("📦 Wrap trong container...");
const wrappedHtml = `<div class="brightly-page" style="max-width:100%;overflow-x:hidden;">${cleanedHtml}</div>`;

console.log("💾 Tạo file JSON...");
const content = { type: "raw-html", html: wrappedHtml };
writeFileSync(outputPath, JSON.stringify(content, null, 2), "utf8");
console.log(`   Đã lưu: ${outputPath}`);

console.log("\n✅ Hoàn tất!");
console.log(`   Template: ${template.name}`);
console.log(`   ID: ${template.id}`);
console.log("\nTiếp theo: Thêm vào manifest.json và chạy npm run seed:templates");
