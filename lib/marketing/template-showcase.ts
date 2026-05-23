import type { TemplateRow } from "@/types";
import type { TemplateShowcaseItem } from "@/lib/marketing/types";
import { templatePreviewHref } from "@/lib/marketing/template-preview-url";

const FALLBACK_IMAGE =
  "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1928/67d91017-be4f-46d2-95e3-95283716d77d-full.webp";

function livePreviewHref(t: TemplateRow): string {
  return templatePreviewHref(t);
}

export function templateToShowcaseItem(t: TemplateRow, index: number): TemplateShowcaseItem {
  const tier = (t.plan_required === "vip" || t.plan_required === "pro" ? t.plan_required : "basic") as
    | "basic"
    | "pro"
    | "vip";
  return {
    id: t.id,
    image: t.thumbnail_url ?? FALLBACK_IMAGE,
    title: t.name,
    desc: t.description ?? "Mẫu thiệp cưới trên Royal Wedding.",
    tags: t.style_tags ?? [],
    tier,
    hot: (t.sort_order ?? 0) >= 100,
    newHot: index < 4 && (t.sort_order ?? 0) < 100,
    previewHref: livePreviewHref(t),
  };
}
