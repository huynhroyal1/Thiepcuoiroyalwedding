import { createRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function requireAdmin() {
  const supabase = await createRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[requireAdmin] no user in server session (route handler)');
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) console.warn('[requireAdmin] user is not admin', { userId: user.id, role: profile?.role });
  return isAdmin ? user : null;
}
