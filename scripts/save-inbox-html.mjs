#!/usr/bin/env node
/** Lưu HTML từ stdin → scripts/imported-templates/inbox/{id}.raw.html */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const id = process.argv[2];
if (!id) {
  console.error("Usage: node scripts/save-inbox-html.mjs <template-id> < file.html");
  process.exit(1);
}

const chunks = [];
for await (const c of process.stdin) chunks.push(c);
const html = Buffer.concat(chunks).toString("utf8").trim();
const out = join(dirname(fileURLToPath(import.meta.url)), "imported-templates/inbox", `${id}.raw.html`);
writeFileSync(out, html, "utf8");
console.log(`Saved ${Math.round(html.length / 1024)} KB → ${out}`);
