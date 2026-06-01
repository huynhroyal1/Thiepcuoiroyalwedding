/**
 * Migration Script: Chuyển ảnh từ CDN MeHappy sang Supabase Storage
 * 
 * 1. Đọc tất cả templates từ manifest
 * 2. Trích xuất URLs từ CDN MeHappy
 * 3. Tải ảnh về local
 * 4. Upload lên Supabase Storage
 * 5. Cập nhật URLs trong content files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, 'imported-templates/content');
const TEMP_DIR = path.join(__dirname, 'imported-templates/.temp-images');

// Config Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'wedding-images'; // Bucket mặc định

// CDN MeHappy patterns cần thay thế
const CDN_PATTERNS = [
  'https://s3-hcm-r2.s3cloud.vn/',
  'https://cdn.chungdoi.com/',
  'https://mehappy.vn/',
];

async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        const redirectUrl = response.headers.location;
        file.close();
        downloadImage(redirectUrl, destPath).then(resolve).catch(reject);
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
  const folderPath = path.dirname(remotePath);
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`${folderPath}/${fileName}`, fileBuffer, {
      contentType: getMimeType(fileName),
      upsert: true
    });
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  // Lấy public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${folderPath}/${fileName}`);
  
  return urlData.publicUrl;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return types[ext] || 'application/octet-stream';
}

function extractImageUrls(htmlContent) {
  const urls = new Set();
  
  // Match img src
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    urls.add(match[1]);
  }
  
  // Match background images
  const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(htmlContent)) !== null) {
    urls.add(match[1]);
  }
  
  // Match srcset
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(htmlContent)) !== null) {
    const srcsetUrls = match[1].split(',').map(s => s.trim().split(' ')[0]);
    srcsetUrls.forEach(u => urls.add(u));
  }
  
  return urls;
}

function isMeHappyCdnUrl(url) {
  return CDN_PATTERNS.some(pattern => url.startsWith(pattern));
}

async function main() {
  console.log('=== Migration: MeHappy CDN → Supabase Storage ===\n');
  
  // 1. Kiểm tra config
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
    process.exit(1);
  }
  
  // 2. Tạo thư mục temp
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  
  // 3. Đọc tất cả content files
  const contentFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.json') || f.endsWith('.html'));
  
  console.log(`📁 Tìm thấy ${contentFiles.length} files\n`);
  
  // 4. Trích xuất tất cả URLs từ MeHappy CDN
  const allUrls = new Map(); // url -> newUrl
  
  for (const file of contentFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const urls = extractImageUrls(content);
    
    for (const url of urls) {
      if (isMeHappyCdnUrl(url) && !allUrls.has(url)) {
        allUrls.set(url, null); // placeholder
      }
    }
  }
  
  console.log(`🔗 Tìm thấy ${allUrls.size} URLs từ MeHappy CDN\n`);
  
  if (allUrls.size === 0) {
    console.log('✅ Không có ảnh nào cần migrate!');
    return;
  }
  
  // 5. Tải và upload từng ảnh
  let processed = 0;
  let failed = 0;
  
  for (const [oldUrl] of allUrls) {
    processed++;
    const fileName = path.basename(oldUrl.split('?')[0]);
    const tempPath = path.join(TEMP_DIR, `${Date.now()}-${fileName}`);
    
    try {
      console.log(`📥 [${processed}/${allUrls.size}] Đang tải: ${fileName}`);
      
      // Download
      await downloadImage(oldUrl, tempPath);
      
      // Generate storage path
      const timestamp = Date.now();
      const storagePath = `mehappy-cdn/${timestamp}-${fileName}`;
      
      // Upload
      const newUrl = await uploadToSupabase(tempPath, storagePath);
      allUrls.set(oldUrl, newUrl);
      
      console.log(`   ✅ Uploaded: ${newUrl.substring(0, 80)}...`);
      
      // Xóa file tạm
      fs.unlinkSync(tempPath);
      
    } catch (err) {
      failed++;
      console.log(`   ❌ Lỗi: ${err.message}`);
    }
  }
  
  console.log(`\n📊 Kết quả:`);
  console.log(`   ✅ Thành công: ${allUrls.size - failed}`);
  console.log(`   ❌ Thất bại: ${failed}`);
  
  // 6. Cập nhật URLs trong content files
  console.log(`\n🔄 Đang cập nhật content files...`);
  
  let updatedFiles = 0;
  
  for (const file of contentFiles) {
    const filePath = path.join(CONTENT_DIR, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const [oldUrl, newUrl] of allUrls) {
      if (newUrl && content.includes(oldUrl)) {
        content = content.split(oldUrl).join(newUrl);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedFiles++;
      console.log(`   ✅ ${file}`);
    }
  }
  
  console.log(`\n✅ Hoàn tất!`);
  console.log(`   📁 Files đã cập nhật: ${updatedFiles}`);
  console.log(`   📊 URLs đã migrate: ${allUrls.size - failed}`);
  
  // Cleanup
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

main().catch(console.error);
