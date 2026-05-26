import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(
  join(__dirname, "imported-templates/inbox/mehappy-user-paste.raw.html"),
  "utf8"
);

const demoStart = raw.indexOf('<div class="demo-page">');
const mainEnd = raw.indexOf("</main>", demoStart);
if (demoStart < 0 || mainEnd < 0) {
  console.error("Không tìm thấy demo-page hoặc </main>");
  process.exit(1);
}

let html = raw.slice(demoStart, mainEnd + "</main>".length);

// Theme assets (relative paths from chungdoi / mehappy host)
const assetBase = process.env.BOHO_ASSET_BASE || "https://mehappy.vn";
html = html.replace(/src="\/images\//g, `src="${assetBase}/images/`);

const out = join(__dirname, "imported-templates/inbox/mehappy-boho-floral-green.raw.html");
writeFileSync(out, html, "utf8");
console.log("Wrote", Math.round(html.length / 1024), "KB →", out);
