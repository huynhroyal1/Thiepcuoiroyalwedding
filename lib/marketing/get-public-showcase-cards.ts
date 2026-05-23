import type { CoupleShowcaseItem } from "@/lib/marketing/types";
import { createPublicSupabase } from "@/lib/supabase/public";
import { canOpenVisualEditor } from "@/lib/editor/contentJsonKind";

const FALLBACK_COVER =
  "https://s3-hcm-r2.s3cloud.vn/thiepcuoi-mehappy/users/1928/67d91017-be4f-46d2-95e3-95283716d77d-full.webp";

function formatWeddingDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

type TemplateJoin = {
  name: string | null;
  thumbnail_url: string | null;
  plan_required: string | null;
};

type CardRow = {
  id: string;
  slug: string;
  bride_name: string | null;
  groom_name: string | null;
  wedding_date: string | null;
  plan: string | null;
  cover_image_url: string | null;
  view_count: number | null;
  template_id: string | null;
  paid_at: string | null;
  content_json: Record<string, unknown> | null;
  show_in_showcase: boolean;
  templates?: TemplateJoin | TemplateJoin[] | null;
};

function resolveTemplate(join: CardRow["templates"]): TemplateJoin | null {
  if (!join) return null;
  if (Array.isArray(join)) return join[0] ?? null;
  return join;
}

function isEligibleShowcaseCard(row: CardRow): boolean {
  if (!row.show_in_showcase) return false;
  if (!row.paid_at) return false;
  if (!canOpenVisualEditor(row.content_json)) return false;
  return true;
}

function rowToShowcaseItem(row: CardRow): CoupleShowcaseItem {
  const tpl = resolveTemplate(row.templates);
  const bride = row.bride_name?.trim() || "Cô dâu";
  const groom = row.groom_name?.trim() || "Chú rể";
  const tplName = tpl?.name;
  const planLabel = (row.plan ?? "basic").toUpperCase();
  const meta = tplName ? `Mẫu: ${tplName} — Gói ${planLabel}` : `Gói ${planLabel}`;

  return {
    id: row.slug || row.id,
    image: row.cover_image_url ?? tpl?.thumbnail_url ?? FALLBACK_COVER,
    title: `Đám cưới ${groom} & ${bride}`,
    date: formatWeddingDate(row.wedding_date),
    meta,
    invitationUrl: `/thiep/${row.slug}`,
  };
}

/** Real client wedding cards opted into the community page (/cac-cap-doi). */
export async function getPublicShowcaseCards(limit = 60): Promise<CoupleShowcaseItem[]> {
  try {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from("wedding_cards")
      .select(
        "id, slug, bride_name, groom_name, wedding_date, plan, cover_image_url, view_count, template_id, paid_at, content_json, show_in_showcase"
      )
      .eq("status", "active")
      .eq("show_in_showcase", true)
      .not("paid_at", "is", null)
      .not("content_json", "is", null)
      .order("view_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const rows = ((data ?? []) as CardRow[]).filter(isEligibleShowcaseCard);
    if (rows.length === 0) return [];

    const templateIds = Array.from(
      new Set(rows.map((row) => row.template_id).filter((id): id is string => Boolean(id)))
    );
    const templateById = new Map<string, TemplateJoin>();

    if (templateIds.length > 0) {
      const { data: templates, error: tplError } = await supabase
        .from("templates")
        .select("id, name, thumbnail_url, plan_required")
        .in("id", templateIds);

      if (tplError) throw tplError;

      for (const tpl of templates ?? []) {
        templateById.set(tpl.id, {
          name: tpl.name,
          thumbnail_url: tpl.thumbnail_url,
          plan_required: tpl.plan_required,
        });
      }
    }

    return rows.map((row) =>
      rowToShowcaseItem({
        ...row,
        templates: row.template_id ? templateById.get(row.template_id) ?? null : null,
      })
    );
  } catch {
    return [];
  }
}
