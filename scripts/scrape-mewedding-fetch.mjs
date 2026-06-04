/**
 * Download HTML từ meWedding bằng fetch (không cần Playwright)
 * Usage: node scripts/scrape-mewedding-fetch.mjs {id} [outfile]
 */
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const id = process.argv[2] || "foreign-basic";
const out =
  process.argv[3] ||
  join(__dirname, "imported-templates/inbox", `mewedding-${id}.raw.html`);

const outDir = dirname(out);
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

const url = `https://www.mewedding.vn/giao-dien-${id}`;

console.log(`Downloading: ${url}`);

const response = await fetch(url, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Upgrade-Insecure-Requests": "1",
  },
});

if (!response.ok) {
  console.error(`HTTP ${response.status}: ${response.statusText}`);
  process.exit(1);
}

const html = await response.text();
console.log(`Downloaded: ${(html.length / 1024).toFixed(1)} KB`);

// Tìm và trích xuất phần content wrapper
let contentHtml = html;

// Thử các selector
const selectors = [
  /id="content-wrapper"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/,
  /class="content-wrapper"[^>]*>([\s\S]*?)<div id="footer/,
  /<section[^>]*id="sections-wrapper"[^>]*>([\s\S]*?)<div id="footer/,
  /<div[^>]*id="app"[^>]*>([\s\S]*?)<div id="footer/,
];

for (const sel of selectors) {
  const match = html.match(sel);
  if (match && match[1] && match[1].length > 1000) {
    contentHtml = match[0];
    console.log(`✓ Extracted content using regex pattern`);
    break;
  }
}

// Nếu không trích xuất được, lưu full HTML
writeFileSync(out, contentHtml, "utf8");

console.log(`\n✓ Saved to: ${out}`);
console.log(`  Size: ${(contentHtml.length / 1024).toFixed(1)} KB`);
console.log(`\nNext step:`);
console.log(
  `  npm run import:mehappy-html -- --id=mewedding-${id} --file="${out}" --name="Foreign Basic" --plan=basic --seed`
);
