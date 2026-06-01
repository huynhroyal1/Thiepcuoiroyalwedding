/**
 * Migration: Chuyển thumbnail từ CDN MeHappy → Supabase Storage
 * 
 * 1. Đọc manifest.json
 * 2. Trích xuất thumbnail URLs
 * 3. Download + Upload lên Supabase
 * 4. Cập nhật manifest.json
 * 5. Seed lại database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'scripts', 'imported-templates', 'manifest.json');
const TEMP_DIR = path.join(ROOT, 'supabase', '.temp-thumbnails');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'wedding-images';

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('No URL'));
    
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function uploadToSupabase(localPath, remotePath) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const fileBuffer = fs.readFileSync(localPath);
  const fileName = path.basename(remotePath);
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`thumbnails/${fileName}`, fileBuffer, {
      contentType: 'image/webp',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`thumbnails/${fileName}`);
  
  return urlData.publicUrl;
}

async function main() {
  console.log('=== Migration: MeHappy Thumbnails → Supabase Storage ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Thiếu config trong .env.local');
    process.exit(1);
  }
  
  // Tạo thư mục temp
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  // Đọc manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const templates = manifest.templates;
  
  console.log(`📋 Tìm thấy ${templates.length} templates\n`);
  
  // Filter templates có thumbnail từ MeHappy
  const mehappyTemplates = templates.filter(t => 
    t.thumbnail_url && t.thumbnail_url.includes('s3cloud.vn')
  );
  
  console.log(`🔗 Có ${mehappyTemplates.length} thumbnails cần migrate\n`);
  
  if (mehappyTemplates.length === 0) {
    console.log('✅ Không có thumbnail nào cần migrate!');
    return;
  }
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < mehappyTemplates.length; i++) {
    const template = mehappyTemplates[i];
    const oldUrl = template.thumbnail_url;
    const fileName = `${template.id}-thumbnail.webp`;
    const tempPath = path.join(TEMP_DIR, fileName);
    
    try {
      console.log(`📥 [${i + 1}/${mehappyTemplates.length}] ${template.name}`);
      console.log(`   Old: ${oldUrl.substring(0, 70)}...`);
      
      // Download
      await downloadFile(oldUrl, tempPath);
      
      // Upload
      const newUrl = await uploadToSupabase(tempPath, `thumbnails/${fileName}`);
      
      // Cập nhật manifest
      template.thumbnail_url = newUrl;
      
      console.log(`   ✅ New: ${newUrl.substring(0, 70)}...`);
      
      // Xóa file temp
      fs.unlinkSync(tempPath);
      
      success++;
      
    } catch (err) {
      failed++;
      console.log(`   ❌ Lỗi: ${err.message}`);
    }
  }
  
  // Lưu manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  
  console.log(`\n📊 Kết quả:`);
  console.log(`   ✅ Thành công: ${success}`);
  console.log(`   ❌ Thất bại: ${failed}`);
  
  if (success > 0) {
    console.log(`\n🔄 Đang seed lại database...`);
    
    const { execSync } = await import('child_process');
    try {
      execSync('node scripts/seed-imported-templates.mjs', {
        cwd: ROOT,
        env: { ...process.env },
        stdio: 'inherit'
      });
      console.log(`\n✅ Hoàn tất! Database đã được seed lại.`);
    } catch (e) {
      console.log(`\n⚠️  Seed thủ công: npm run seed:templates`);
    }
  }
  
  // Cleanup
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

main().catch(console.error);
