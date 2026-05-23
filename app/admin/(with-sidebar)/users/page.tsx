import { createServiceRoleClient } from "@/lib/supabase/admin";
import UsersTable, { type UserRow } from "./UsersTable";

type ProfileCard = UserRow["wedding_cards"][number];

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const admin = createServiceRoleClient();

  const [{ data: profiles }, { data: authData }] = await Promise.all([
    admin
      .from("profiles")
      .select("*, wedding_cards(id, plan, status, slug, bride_name, groom_name)")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailMap = Object.fromEntries(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const rows: UserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    phone: p.phone,
    role: p.role,
    created_at: p.created_at,
    email: emailMap[p.id] ?? "",
    wedding_cards: ((p.wedding_cards ?? []) as ProfileCard[]).map((c) => ({
      id: c.id,
      plan: c.plan,
      status: c.status,
      slug: c.slug,
      bride_name: c.bride_name,
      groom_name: c.groom_name,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý Users</h1>
        <p className="text-sm text-neutral-500">{rows.length} tài khoản</p>
      </div>
      <UsersTable initialRows={rows} />
    </div>
  );
}
