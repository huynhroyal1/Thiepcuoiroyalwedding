import { createServiceRoleClient } from "@/lib/supabase/admin";
import VideoCatalogAdminClient from "./VideoCatalogAdminClient";

export const metadata = { title: "Admin — Video Catalog" };

export default async function AdminVideoCatalogPage() {
  const supabase = createServiceRoleClient();
  const [{ data: catalog }, { data: orders }] = await Promise.all([
    supabase.from("video_catalog").select("*").order("sort_order"),
    supabase.from("video_orders").select("*, profiles:profiles(full_name)").order("created_at", { ascending: false }),
  ]);

  return <VideoCatalogAdminClient catalog={catalog ?? []} orders={orders ?? []} />;
}
