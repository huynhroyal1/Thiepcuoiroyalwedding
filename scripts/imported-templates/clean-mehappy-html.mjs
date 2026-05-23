/**
 * Chuẩn hóa HTML copy từ MeHappy trước khi lưu template Royal Wedding.
 */

/** Bỏ footer branding MeHappy và khoảng trắng thừa. */
export function cleanMehappyHtml(html) {
  let out = html.trim();

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
