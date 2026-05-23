import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { FeatureCatalogItem } from "@/types";
import FeaturesAdminClient from "./FeaturesAdminClient";

export default async function AdminFeaturesPage() {
  const admin = createServiceRoleClient();

  const { data: features } = await admin
    .from("feature_catalog")
    .select("key, name, description, price, thumbnail_url, is_active, sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tính năng Add-on</h1>
        <p className="text-sm text-gray-500 mt-1">
          {(features ?? []).length} tính năng — bấm Sửa để chỉnh giá/tên. Key là duy nhất; tạo mới chỉ khi key chưa có (migration đã seed sẵn ~25 mục).
        </p>
      </div>
      <FeaturesAdminClient
        initialFeatures={(features ?? []) as FeatureCatalogItem[]}
      />
    </div>
  );
}
