import { createServiceRoleClient } from "@/lib/supabase/admin";
import ReferralsAdminClient from "./ReferralsAdminClient";

export const metadata = { title: "Admin — Referrals" };

export default async function AdminReferralsPage() {
  const supabase = createServiceRoleClient();
  const [{ data: refCodes }, { data: referrals }, { data: commissions }, { data: withdrawals }] = await Promise.all([
    supabase.from("referral_codes").select("*, profiles:profiles(full_name)").order("created_at", { ascending: false }),
    supabase.from("referrals").select("*, referrer:profiles!referrer_id(full_name), referred:profiles!referred_user_id(full_name)").order("created_at", { ascending: false }),
    supabase.from("commissions").select("*").order("created_at", { ascending: false }),
    supabase.from("withdrawal_requests").select("*, profiles:profiles(full_name)").order("created_at", { ascending: false }),
  ]);

  return (
    <ReferralsAdminClient
      refCodes={refCodes ?? []}
      referrals={referrals ?? []}
      commissions={commissions ?? []}
      withdrawals={withdrawals ?? []}
    />
  );
}
