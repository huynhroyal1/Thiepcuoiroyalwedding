import { type NextRequest, NextResponse } from "next/server";
import { isCardSubscriptionActive } from "@/lib/plans/is-card-subscription-active";
import { getPlanConfigWithClient } from "@/lib/plans/plan-config";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabase, response } = await createMiddlewareSupabase(request);

  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (
    user &&
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/goi-dich-vu")
  ) {
    const [{ data: card }, planConfig] = await Promise.all([
      supabase
        .from("wedding_cards")
        .select("paid_at, plan")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      getPlanConfigWithClient(supabase),
    ]);

    if (!isCardSubscriptionActive(card, planConfig)) {
      const paywall = new URL("/dashboard/goi-dich-vu", request.url);
      paywall.searchParams.set("paywall", "1");
      return NextResponse.redirect(paywall);
    }
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .single();
    if (error || profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname === "/login" || pathname === "/register") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
