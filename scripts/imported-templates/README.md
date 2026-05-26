# Import mẫu thiệp từ website khác

Chỉ cập nhật bảng **`templates`** — không đụng user, thiệp khách, cài đặt site.

## Lấy HTML từ URL MeHappy (trang Next.js)

Trang `https://mehappy.vn/view/template/{id}` render bằng JS — copy HTML thường thiếu `#content-wrapper`. Dùng Playwright:

```bash
npx playwright install chromium
npm run scrape:mehappy -- 44
# → scripts/imported-templates/inbox/mehappy-template-44.raw.html
```

## Cách nhanh — HTML MeHappy → Craft kéo-thả (mặc định)

Gửi HTML copy từ MeHappy (hoặc file sau `scrape:mehappy`); script **tự chuyển** sang Craft.js (giữ text, vị trí, font, ảnh, icon, `anim-hidden` → fadeInUp):

```bash
# Lưu HTML vào inbox/mehappy-xxx.raw.html rồi:
npm run import:mehappy-html -- \
  --id=mehappy-xxx \
  --name="Tên mẫu" \
  --plan=pro \
  --file=scripts/imported-templates/inbox/mehappy-xxx.raw.html \
  --seed

# Chỉ lưu HTML gốc (không kéo-thả):
npm run import:mehappy-html -- ... --raw-html
```

Converter: `lib/editor/mehappy-html-to-craft.mjs` · Scale 400→390px · **Không convert**: form RSVP, form lời chúc, danh sách lời chúc (cần thêm block sau hoặc chỉnh tay).

## Cách thủ công — manifest + seed

### 1. Thêm metadata vào `manifest.json`

```json
{
  "id": "mehappy-new-template",
  "name": "Tên mẫu mới",
  "content_file": "mehappy-new-template.json",
  "plan_required": "pro",
  "thumbnail_url": "https://...",
  "sort_order": 115,
  "is_active": true
}
```

- **Craft.js**: `content_file` trỏ tới `.json` (cây node Craft, có `ROOT` → `RootCanvas`)
- **raw-html** (legacy): `content_type: "raw-html"` — không hỗ trợ kéo-thả

### 2. Chạy seed

```bash
npm run seed:templates
npm run seed:templates -- --id=mehappy-new-template
npm run seed:templates -- --metadata-only
npm run seed:templates -- --dry-run
```

## Lưu ý

- Mẫu **Craft** mở trình editor admin `/admin/templates/{id}/editor` — kéo-thả đầy đủ
- File `manifest.json` hiện để trống; mỗi lần import mới script sẽ tự thêm entry tương ứng.
- Ảnh cover lấy từ `thumbnail_url` trong manifest; ảnh khác vẫn CDN MeHappy tạm thời
- Mẫu Craft nội bộ (`save-the-date-*`) do `npm run seed:premium-template` quản lý
