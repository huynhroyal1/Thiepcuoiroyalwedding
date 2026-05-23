import { createServiceRoleClient } from "@/lib/supabase/admin";
import OrdersAdminClient from "./OrdersAdminClient";

export const metadata = { title: "Admin — Orders" };

export default async function AdminOrdersPage() {
  const supabase = createServiceRoleClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, profiles:profiles(full_name)")
    .order("created_at", { ascending: false });

  return <OrdersAdminClient orders={orders ?? []} />;
}
