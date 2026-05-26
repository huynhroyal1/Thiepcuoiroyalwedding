import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const transcript =
  process.argv[2] ||
  "C:/Users/Moderator/.cursor/projects/e-wep-New-folder-2-ban-co-thiep-moi-Huynh-Royal-16-05-2026-3-tet-Huynh-Royal-24-05-2026/agent-transcripts/92d27955-b98e-4b79-96b1-cac0554404a2/92d27955-b98e-4b79-96b1-cac0554404a2.jsonl";
const out =
  process.argv[3] ||
  join(__dirname, "imported-templates/inbox/mehappy-user-paste.raw.html");

const lines = readFileSync(transcript, "utf8").trim().split("\n");
const last = JSON.parse(lines[lines.length - 1]);
const text = last.message?.content?.find((c) => c.type === "text")?.text || "";

let html = "";
const cw = text.match(/<div[^>]*id="content-wrapper"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i);
if (cw) {
  html = cw[0];
} else {
  const body = text.match(/<body[\s\S]*/);
  html = body ? body[0] : text;
}

writeFileSync(out, html, "utf8");
console.log("Wrote", Math.round(html.length / 1024), "KB →", out);
console.log("content-wrapper:", /content-wrapper/.test(html));
console.log("data-node-id:", (html.match(/data-node-id/g) || []).length);
