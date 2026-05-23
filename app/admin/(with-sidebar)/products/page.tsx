import { createServiceRoleClient } from "@/lib/supabase/admin";
import ProductsAdminClient from "./ProductsAdminClient";

export const metadata = { title: "Admin — Products" };

export default async function AdminProductsPage() {
  const supabase = createServiceRoleClient();
  const { data: products } = await supabase
    .from("affiliate_products")
    .select("*")
    .order("sort_order");

  return <ProductsAdminClient products={products ?? []} />;
}
