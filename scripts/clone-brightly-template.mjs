/**
 * Clone template Brightly - Gói VIP
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = ".";
const CONTENT_DIR = "scripts/imported-templates/content";

const template = {
  id: "mehappy-brightly-vip",
  name: "Brightly - Gói VIP",
  description: "Template Brightly — phong cách tươi sáng, hiện đại.",
  htmlFile: "Giao diện Brightly - Gói VIP.html",
  plan: "vip",
  thumbnail: "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/bc464547-3708-493b-9ac4-709dc2efecdc.webp",
  sortOrder: 131
};

function extractBody(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) return bodyMatch[1];
  return null;
}

function cleanHtml(html) {
  let out = html.trim();
  
  console.log("   1. Xóa script tags...");
  out = out.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  
  console.log("   2. Xóa noscript tags...");
  out = out.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  console.log("   3. Xóa Toastify styles...");
  out = out.replace(/<style[^>]*>[^>]*Toastify[^>]*<\/style>/gi, "");
  
  console.log("   4. Xóa comments...");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  
  console.log("   5. Xóa inline event handlers...");
  out = out.replace(/\s+on\w+="[^"]*"/gi, "");
  out = out.replace(/\s+on\w+='[^']*'/gi, "");
  
  console.log("   6. Xóa data attributes...");
  out = out.replace(/\s+data-[a-z-]+="[^"]*"/gi, "");
  
  console.log("   7. Xóa Next.js elements...");
  out = out.replace(/<next-route-announcer[^>]*>[\s\S]*?<\/next-route-announcer>/gi, "");
  out = out.replace(/<template[^>]*shadowrootmode[^>]*>[\s\S]*?<\/template>/gi, "");
  
  console.log("   8. Xóa Monica widget...");
  out = out.replace(/<div[^>]*monica-id[^>]*>[\s\S]*?<\/div>/gi, "");
  out = out.replace(/<div[^>]*class="monica-widget[^>]*>[\s\S]*?<\/div>/gi, "");
  
  console.log("   9. Xóa link preconnect/preload...");
  out = out.replace(/<link[^>]*rel="(preconnect|preload)[^>]*>/gi, "");
  
  console.log("   10. Fix đường dẫn tương đối...");
  out = out.replace(/href="\.\//g, 'href="https://mehappy.vn/');
  out = out.replace(/src="\.\//g, 'src="https://mehappy.vn/');
  
  console.log("   11. Xóa branding...");
  out = out.replace(/meWedding\s*\|\s*Nền tảng[^<]*/gi, "");
  out = out.replace(/Powered by[^<]*/gi, "");
  
  console.log("   12. Xóa hidden elements...");
  out = out.replace(/<div[^>]*hidden[^>]*>[\s\S]*?<\/div>/gi, "");
  out = out.replace(/<div[^>]*id="__next[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  
  return out;
}

console.log("=== Clone template: " + template.name + " ===\n");

const htmlPath = join(__dirname, "scripts", "imported-templates", "inbox", template.htmlFile);

if (!existsSync(htmlPath)) {
  console.log(`❌ Không tìm thấy: ${htmlPath}`);
  process.exit(1);
}

console.log("📖 Đọc file HTML...");
const html = readFileSync(htmlPath, "utf8");
console.log(`   Kích thước ban đầu: ${Math.round(html.length / 1024)} KB`);

console.log("🔧 Trích xuất và clean HTML...");
let bodyHtml = extractBody(html);
if (!bodyHtml) bodyHtml = html;

const cleanedHtml = cleanHtml(bodyHtml);
console.log(`   Sau khi clean: ${Math.round(cleanedHtml.length / 1024)} KB`);

const wrappedHtml = `<div class="invitation-page" style="max-width:100%;overflow-x:hidden;">${cleanedHtml}</div>`;

console.log("💾 Tạo file JSON...");
const content = { type: "raw-html", html: wrappedHtml };
const outputPath = join(__dirname, CONTENT_DIR, `${template.id}.json`);
writeFileSync(outputPath, JSON.stringify(content, null, 2), "utf8");
console.log(`   Đã lưu: ${template.id}.json`);

console.log("\n✅ Hoàn tất!");
console.log(`   Template: ${template.name}`);
console.log(`   ID: ${template.id}`);
console.log("\nTiếp theo: Thêm vào manifest.json và chạy npm run seed:templates");
