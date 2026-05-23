import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { TemplateRow } from "@/types";
import TemplatesClient from "./TemplatesClient";

export default async function AdminTemplatesPage() {
  const admin = createServiceRoleClient();

  const { data: templates } = await admin
    .from("templates")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mẫu thiệp</h1>
        <p className="text-sm text-gray-500 mt-1">
          {(templates ?? []).length} template trong hệ thống
        </p>
      </div>
      <TemplatesClient initialTemplates={(templates ?? []) as TemplateRow[]} />
    </div>
  );
}
