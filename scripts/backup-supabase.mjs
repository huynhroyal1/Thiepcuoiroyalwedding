/**
 * Script backup Supabase Database → Local files
 * Chạy: node scripts/backup-supabase.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, '..', 'supabase', 'backups');

// Config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
  'templates',
  'wedding_cards',
  'users',
  'rsvps',
  'wishes',
];

async function backupTable(supabase, tableName) {
  console.log(`📦 Đang backup: ${tableName}...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    console.error(`   ❌ Lỗi: ${error.message}`);
    return false;
  }
  
  if (!data || data.length === 0) {
    console.log(`   ⚠️  Bảng trống`);
    return true;
  }
  
  // Lưu JSON
  const jsonPath = path.join(BACKUP_DIR, `${tableName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`   ✅ ${data.length} rows → ${tableName}.json`);
  
  // Lưu CSV
  const csvPath = path.join(BACKUP_DIR, `${tableName}.csv`);
  const csv = convertToCSV(data);
  fs.writeFileSync(csvPath, csv, 'utf8');
  console.log(`   ✅ → ${tableName}.csv`);
  
  return true;
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(h => {
      let val = row[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') val = JSON.stringify(val);
      val = String(val);
      // Escape quotes
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

async function main() {
  console.log('=== Backup Supabase Database ===\n');
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Thiếu config trong .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  // Tạo thư mục backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  // Backup timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const datedBackupDir = path.join(BACKUP_DIR, timestamp);
  fs.mkdirSync(datedBackupDir, { recursive: true });
  
  console.log(`📁 Backup vào: ${datedBackupDir}\n`);
  
  let successCount = 0;
  
  for (const table of TABLES) {
    const ok = await backupTable(supabase, table);
    if (ok) successCount++;
  }
  
  console.log(`\n✅ Hoàn tất! Đã backup ${successCount}/${TABLES.length} bảng`);
  console.log(`📁 Files: ${BACKUP_DIR}/`);
  
  // Tạo file manifest
  const manifest = {
    backup_date: new Date().toISOString(),
    tables: TABLES,
    supabase_url: SUPABASE_URL,
    record_counts: {}
  };
  
  fs.writeFileSync(
    path.join(datedBackupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  
  console.log(`\n📝 Manifest: ${datedBackupDir}/manifest.json`);
}

main().catch(console.error);
