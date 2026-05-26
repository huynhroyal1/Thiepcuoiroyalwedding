/**
 * Chuẩn hóa HTML copy từ MeHappy trước khi lưu template Royal Wedding.
 */

import { parse } from "node-html-parser";

/** MeHappy lazy-load ẩn section bằng display:none — bỏ để import đủ layout. */
export function unhideMehappySections(html) {
  const root = parse(html, { comment: false });
  for (const el of root.querySelectorAll(".sections-wrapper")) {
    const style = el.getAttribute("style") || "";
    const next = style.replace(/display\s*:\s*none\s*;?/gi, "").trim();
    if (next !== style) el.setAttribute("style", next);
  }
  return root.toString();
}

/** Bỏ footer branding MeHappy và khoảng trắng thừa. */
export function cleanMehappyHtml(html) {
  let out = unhideMehappySections(html.trim());

  // Footer "Powered by meHappy" / "meWedding"
  out = out.replace(
    /<div class="w-full">\s*<div data-node-id="1Sq7KBBoA7"[\s\S]*?<\/div>\s*<\/div>\s*(?=<div class="w-full"><\/div>|$)/gi,
    ""
  );
  out = out.replace(/meWedding\s*\|\s*Nền tảng tạo Thiệp cưới Online MIỄN PHÍ →/gi, "");
  out = out.replace(/Powered by meHappy Platform/gi, "");

  // Đóng wrapper nếu thiếu (phòng user copy thiếu tag cuối)
  if (!out.endsWith("</div>")) {
    out += "</div>";
  }

  return out;
}

/** Bọc thành content_json Royal Wedding (raw-html). */
export function mehappyHtmlToContentJson(html) {
  return {
    type: "raw-html",
    html: cleanMehappyHtml(html),
  };
}
