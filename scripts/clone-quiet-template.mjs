/**
 * Script tạo raw-html template từ HTML file trình duyệt
 * Copy file HTML vào thư mục inbox/ trước
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync } from "fs";
import { dirname, join, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const INBOX_DIR = join(ROOT_DIR, "scripts", "imported-templates", "inbox");
const CONTENT_DIR = join(ROOT_DIR, "scripts", "imported-templates", "content");

// Template mới
const template = {
  id: "mehappy-quiet-vip",
  name: "Quiet - Gói VIP",
  description: "Template Quiet — phong cách tối giản, thanh lịch.",
  htmlFile: "Giao Diện Quiet - Gói VIP.html",
  plan: "vip",
  thumbnail: "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/admin/assets/quiet-thumbnail.webp",
  sortOrder: 130
};

function extractBody(html) {
  // Tìm phần body từ HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1]; // Trả về content bên trong body
  }
  return null;
}

function cleanHtml(html) {
  let out = html.trim();
  
  console.log("   Bước 1: Xóa script tags...");
  out = out.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  
  console.log("   Bước 2: Xóa noscript tags...");
  out = out.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");
  
  console.log("   Bước 3: Xóa style tags...");
  out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  
  console.log("   Bước 4: Xóa comments...");
  out = out.replace(/<!--[\s\S]*?-->/g, "");
  
  console.log("   Bước 5: Xóa inline event handlers...");
  out = out.replace(/\s+on\w+="[^"]*"/gi, "");
  out = out.replace(/\s+on\w+='[^']*'/gi, "");
  
  console.log("   Bước 6: Xóa data attributes không cần thiết...");
  out = out.replace(/\s+data-[a-z-]+="[^"]*"/gi, "");
  out = out.replace(/\s+data-[a-z-]+='[^']*'/gi, "");
  
  console.log("   Bước 7: Xóa Next.js specific elements...");
  out = out.replace(/<next-route-announcer[^>]*>[\s\S]*?<\/next-route-announcer>/gi, "");
  out = out.replace(/<template[^>]*shadowrootmode[^>]*>[\s\S]*?<\/template>/gi, "");
  
  console.log("   Bước 8: Xóa Monica widget...");
  out = out.replace(/<div[^>]*monica-id[^>]*>[\s\S]*?<\/div>/gi, "");
  out = out.replace(/<div[^>]*class="monica-widget[^>]*>[\s\S]*?<\/div>/gi, "");
  
  console.log("   Bước 9: Xóa link preconnect/preload...");
  out = out.replace(/<link[^>]*rel="(preconnect|preload)[^>]*>/gi, "");
  
  console.log("   Bước 10: Fix đường dẫn tương đối...");
  out = out.replace(/href="\.\//g, 'href="https://mehappy.vn/');
  out = out.replace(/src="\.\//g, 'src="https://mehappy.vn/');
  
  console.log("   Bước 11: Xóa branding...");
  out = out.replace(/meWedding\s*\|\s*Nền tảng[^<]*/gi, "");
  out = out.replace(/Powered by[^<]*/gi, "");
  
  console.log("   Bước 12: Xóa hidden elements...");
  out = out.replace(/<div[^>]*hidden[^>]*>[\s\S]*?<\/div>/gi, "");
  
  console.log("   Bước 13: Xóa các element không cần thiết...");
  out = out.replace(/<div[^>]*id="__next[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  out = out.replace(/<div[^>]*id="monica-content-root[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");
  
  // Xóa empty attributes
  out = out.replace(/\s+(monica-id|monica-version)="[^"]*"/gi, "");
  
  return out;
}

function wrapContent(html) {
  // Wrap trong div container với class phù hợp
  return `<div class="invitation-page" style="max-width:100%;overflow-x:hidden;">${html}</div>`;
}

console.log("=== Clone template: " + template.name + " ===\n");

const htmlPath = join(INBOX_DIR, template.htmlFile);

if (!existsSync(htmlPath)) {
  console.log(`❌ Không tìm thấy: ${htmlPath}`);
  console.log("Vui lòng copy file HTML vào thư mục inbox/ trước!");
  process.exit(1);
}

console.log("📖 Đọc file HTML...");
const html = readFileSync(htmlPath, "utf8");
console.log(`   Kích thước ban đầu: ${Math.round(html.length / 1024)} KB`);

console.log("🔧 Trích xuất và clean HTML...");
let bodyHtml = extractBody(html);

if (!bodyHtml) {
  console.log("⚠️ Không tìm thấy body, dùng toàn bộ HTML");
  bodyHtml = html;
}

const cleanedHtml = cleanHtml(bodyHtml);
console.log(`   Sau khi clean: ${Math.round(cleanedHtml.length / 1024)} KB`);

const wrappedHtml = wrapContent(cleanedHtml);
console.log(`   Sau khi wrap: ${Math.round(wrappedHtml.length / 1024)} KB`);

console.log("💾 Tạo file JSON...");
const content = {
  type: "raw-html",
  html: wrappedHtml
};

const outputPath = join(CONTENT_DIR, `${template.id}.json`);
writeFileSync(outputPath, JSON.stringify(content, null, 2), "utf8");
console.log(`   Đã lưu: ${template.id}.json`);

console.log("\n✅ Hoàn tất!");
console.log(`   Template: ${template.name}`);
console.log(`   ID: ${template.id}`);
console.log("\nTiếp theo: Thêm vào manifest.json và chạy npm run seed:templates");
