/**
 * Tạo bucket "wedding-images" trong Supabase Storage nếu chưa có
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('=== Tạo Supabase Storage Bucket ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Thiếu config trong .env.local');
    console.log('Cần có: NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const bucketName = 'wedding-images';
  
  // Kiểm tra bucket đã tồn tại chưa
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.find(b => b.id === bucketName);
  
  if (exists) {
    console.log(`✅ Bucket "${bucketName}" đã tồn tại`);
  } else {
    // Tạo bucket mới
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true, // Cho phép truy cập public
    });
    
    if (error) {
      console.error('❌ Lỗi tạo bucket:', error.message);
      process.exit(1);
    }
    
    console.log(`✅ Đã tạo bucket "${bucketName}"`);
  }
  
  // Set CORS policy (nếu cần)
  console.log('\n💡 Nếu gặp lỗi CORS, cần set policy trong Supabase Dashboard:');
  console.log('   Storage → wedding-images → Policies → Allow public access');
  
  console.log('\n✅ Sẵn sàng migrate ảnh!');
  console.log('\nChạy: node scripts/migrate-mehappy-images.mjs');
}

main();
