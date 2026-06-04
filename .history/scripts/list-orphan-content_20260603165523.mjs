import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, 'imported-templates');

const contentFiles = readdirSync(join(ROOT, 'content'))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''));

const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const manifestIds = new Set(manifest.templates.map(t => t.content_file?.replace('.json', '')));

const orphans = contentFiles.filter(f => !manifestIds.has(f));

console.log(`\nContent files: ${contentFiles.length}`);
console.log(`Manifest entries: ${manifest.templates.length}`);
console.log(`Orphan files (có content nhưng không ở manifest): ${orphans.length}\n`);

if (orphans.length > 0) {
  console.log('Danh sách file orphaned:');
  orphans.forEach((id, i) => {
    console.log(`  ${i+1}. ${id}`);
  });
  console.log(`\nHướng dẫn fix: Thêm entry vào manifest.json hoặc chạy:`);
  console.log(`  npm run seed:templates -- --id=<template-id>`);
}
