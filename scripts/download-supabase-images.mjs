/**
 * Download toàn bộ ảnh từ Supabase Storage bucket "wedding-images"
 * về 2 thư mục:
 *   1. public/uploads/mehappy/   (deploy cùng web)
 *   2. supabase/storage-backup/  (backup offline)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Thư mục lưu
const UPLOADS_DIR = path.join(ROOT, 'public', 'uploads', 'mehappy');
const BACKUP_DIR = path.join(ROOT, 'supabase', 'storage-backup');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'wedding-images';

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
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
    });
    
    request.on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function downloadAllImages() {
  console.log('=== Download Images từ Supabase Storage ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Thiếu config trong .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Tạo thư mục
  for (const dir of [UPLOADS_DIR, BACKUP_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Tạo: ${dir}`);
    }
  }
  
  // List all files trong bucket
  console.log('📋 Đang liệt kê files trong bucket...');
  
  let allFiles = [];
  let page = null;
  
  do {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('mehappy-cdn', { limit: 100, search: page });
    
    if (error) {
      console.error('❌ Lỗi list files:', error.message);
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      allFiles.push(...data.filter(f => f.id && !f.metadata?.mimetype?.startsWith('folder')));
    }
    
    page = data && data.length === 100 ? data[data.length - 1].name : null;
  } while (page);
  
  console.log(`   Tìm thấy ${allFiles.length} files\n`);
  
  if (allFiles.length === 0) {
    console.log('⚠️  Không có files để download');
    return;
  }
  
  // Download từng file
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const fileName = file.name;
    const uploadsPath = path.join(UPLOADS_DIR, fileName);
    const backupPath = path.join(BACKUP_DIR, fileName);
    
    try {
      // Get signed URL hoặc public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(`mehappy-cdn/${fileName}`);
      
      const fileUrl = urlData.publicUrl;
      
      console.log(`📥 [${i + 1}/${allFiles.length}] ${fileName}`);
      
      // Download vào public/uploads
      await downloadFile(fileUrl, uploadsPath);
      
      // Copy vào backup
      fs.copyFileSync(uploadsPath, backupPath);
      
      success++;
      
    } catch (err) {
      console.log(`   ❌ Lỗi: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n✅ Hoàn tất!`);
  console.log(`   📁 public/uploads/mehappy/ - ${success} files`);
  console.log(`   📁 supabase/storage-backup/ - ${success} files`);
  console.log(`   ❌ Thất bại: ${failed}`);
  
  // Tạo file manifest
  const manifest = {
    download_date: new Date().toISOString(),
    bucket: BUCKET_NAME,
    total_files: allFiles.length,
    success,
    failed,
    storage_url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}`
  };
  
  fs.writeFileSync(
    path.join(BACKUP_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  
  console.log(`\n📝 Manifest: ${BACKUP_DIR}/manifest.json`);
}

downloadAllImages().catch(console.error);
