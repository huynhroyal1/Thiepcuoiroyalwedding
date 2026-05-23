# Import mẫu thiệp từ website khác

Chỉ cập nhật bảng **`templates`** — không đụng user, thiệp khách, cài đặt site.

## Mẫu MeHappy — Craft kéo-thả (khuyến nghị)

10 mẫu MeHappy đã chuyển sang **Craft.js** (7 section, chỉnh kéo-thả trong admin editor):

```bash
# Tạo lại file content/*.json từ preset Craft + theme màu
npm run generate:mehappy-craft

# Xóa bản raw-html cũ trên DB + seed lại Craft
npm run reseed:mehappy-craft
```

Metadata: `manifest.json` · Craft JSON: `content/{id}.json` · Theme: `lib/editor/presets/mehappy-craft-themes.mjs`

## Cách nhanh — HTML MeHappy (copy từ trình duyệt)

Dùng khi cần lưu HTML gốc làm tham chiếu; **để kéo-thả** chạy `generate:mehappy-craft` sau khi thêm vào manifest.

```bash
npm run import:mehappy-html -- \
  --id=mehappy-xxx \
  --name="Tên mẫu" \
  --plan=pro \
  --file=scripts/imported-templates/inbox/mau.raw.html \
  --seed

npm run generate:mehappy-craft
npm run seed:templates -- --id=mehappy-xxx
```

## Cách thủ công — manifest + seed

### 1. Thêm metadata vào `manifest.json`

```json
{
  "id": "mehappy-bustle",
  "name": "Giao diện Bustle",
  "content_file": "mehappy-bustle.json",
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
npm run seed:templates -- --id=mehappy-classy-vogue
npm run seed:templates -- --metadata-only
npm run seed:templates -- --dry-run
```

## Lưu ý

- Mẫu **Craft** mở trình editor admin `/admin/templates/{id}/editor` — kéo-thả đầy đủ
- Layout Craft dựa trên preset Premium Save The Date + theme màu theo từng mẫu (không phải convert pixel-perfect từ HTML MeHappy)
- Ảnh cover lấy từ `thumbnail_url` trong manifest; ảnh khác vẫn CDN MeHappy tạm thời
- Mẫu Craft nội bộ (`save-the-date-*`) do `npm run seed:premium-template` quản lý

## Mẫu MeHappy Craft (10)

| ID | Tên | Gói | Loại |
|----|-----|-----|------|
| `mehappy-classy-vogue` | Classy Vogue Gold | VIP | Craft |
| `mehappy-thiep-moi-xanh` | Thiệp Mời Cưới Xanh | PRO | Craft |
| `mehappy-save-the-date-hong` | Save The Date Hồng | PRO | Craft |
| `mehappy-viceroy-classic` | Thiệp Viceroy Classic | PRO | Craft |
| `mehappy-classy-vogue-envelope` | Classy Vogue Phong Bì | VIP | Craft |
| `mehappy-save-date-arch` | Save The Date Arch | PRO | Craft |
| `mehappy-floral-wedding` | Thiệp Floral Wedding | PRO | Craft |
| `mehappy-teal-wedding` | Thiệp Teal Wedding | PRO | Craft |
| `mehappy-save-date-rose` | Save The Date Rose | PRO | Craft |
| `mehappy-viceroy-elegant` | Thiệp Viceroy Elegant | PRO | Craft |
