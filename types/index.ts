export type UserRole = "user" | "admin";

export type Plan = "basic" | "pro" | "vip";

export type CardStatus = "draft" | "active" | "expired";

export type ConfettiEffect = "none" | "hearts" | "snow" | "petals";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  payout_bank_code?: string | null;
  payout_account_number?: string | null;
  payout_account_name?: string | null;
  created_at: string;
}

export interface WeddingCard {
  id: string;
  user_id: string;
  slug: string;
  plan: Plan;
  status: CardStatus;
  bride_name: string;
  bride_parents: string | null;
  groom_name: string;
  groom_parents: string | null;
  wedding_date: string;
  ceremony_time: string | null;
  reception_time: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_maps_url: string | null;
  love_story: string | null;
  hashtag: string | null;
  background_music_url: string | null;
  cover_image_url: string | null;
  template_id: string;
  primary_color: string;
  font_family: string;
  confetti_effect: ConfettiEffect;
  paid_at: string | null;
  payment_order_id: string | null;
  show_gift_box: boolean;
  gift_bank_name: string | null;
  gift_account_number: string | null;
  gift_account_name: string | null;
  gift_qr_url: string | null;
  remove_branding: boolean;
  custom_domain: string | null;
  view_count: number;
  show_in_showcase: boolean;
  content_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WeddingPhoto {
  id: string;
  card_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Guest {
  id: string;
  card_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  group_label: string | null;
  token: string;
  avatar_url: string | null;
  is_vip: boolean;
  created_at: string;
}

export interface RsvpRow {
  id: string;
  card_id: string;
  guest_id: string | null;
  guest_name: string;
  attending: boolean;
  guest_count: number;
  note: string | null;
  created_at: string;
}

export interface WishRow {
  id: string;
  card_id: string;
  guest_name: string;
  message: string;
  is_approved: boolean;
  created_at: string;
}

export interface GiftLogRow {
  id: string;
  card_id: string;
  guest_name: string | null;
  amount: number | null;
  note: string | null;
  created_at: string;
}

export interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  plan_required: Plan;
  style_tags: string[] | null;
  is_active: boolean;
  sort_order: number;
  content_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string | null;
}

export interface OrderRow {
  id: string;
  user_id: string;
  card_id: string | null;
  payos_order_id: string;
  plan: Plan;
  order_type?: string;
  feature_keys?: string[] | null;
  amount: number;
  status: "pending" | "paid" | "cancelled";
  created_at: string;
  paid_at: string | null;
}

export type TemplateId = "classic-white" | "golden-luxury" | "minimal-modern";

// ─── Bride/Groom Profiles ────────────────────────────────────────────────────
export interface BrideGroomProfile {
  id: string;
  card_id: string;
  role: "bride" | "groom";
  full_name: string | null;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  hometown: string | null;
  maps_url: string | null;
  description: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Guest Groups ────────────────────────────────────────────────────────────
export interface GuestGroup {
  id: string;
  card_id: string;
  name: string;
  color: string;
  created_at: string;
}

// Extended Guest (with new columns)
export interface GuestExtended extends Guest {
  group_id: string | null;
  gift_type: "cash" | "gold" | "gift" | null;
  gift_amount: number | null;
  invite_sent: boolean;
  attending: boolean | null;
  num_guests: number;
}

// ─── Wedding Plans / Tasks ───────────────────────────────────────────────────
export interface WeddingPlan {
  id: string;
  card_id: string;
  name: string;
  note: string | null;
  budget: number;
  created_at: string;
}

export interface PlanTaskGroup {
  id: string;
  plan_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export type TaskStatus = "pending" | "in_progress" | "done";

export interface PlanTask {
  id: string;
  group_id: string;
  title: string;
  status: TaskStatus;
  due_date: string | null;
  sort_order: number;
  created_at: string;
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export interface BudgetPlan {
  id: string;
  card_id: string;
  name: string;
  total_budget: number;
  note: string | null;
  created_at: string;
}

export interface BudgetCategory {
  id: string;
  plan_id: string;
  name: string;
  description: string | null;
  estimated: number;
  actual: number;
  created_at: string;
}

// ─── Video ───────────────────────────────────────────────────────────────────
export type VideoPackage = "basic" | "pro" | "vip";
export type VideoOrderStatus =
  | "created"
  | "pending_payment"
  | "paid"
  | "in_progress"
  | "delivered"
  | "completed"
  | "canceled";

export interface VideoCatalog {
  id: string;
  name: string;
  description: string | null;
  price: number;
  package: VideoPackage;
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface VideoOrder {
  id: string;
  user_id: string;
  card_id: string | null;
  catalog_id: string | null;
  title: string;
  package: VideoPackage;
  status: VideoOrderStatus;
  price: number;
  note: string | null;
  delivered_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Referral ────────────────────────────────────────────────────────────────
export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  created_at: string;
}

export type CommissionStatus = "pending" | "available" | "paid" | "canceled";

export interface Commission {
  id: string;
  referral_id: string;
  order_id: string | null;
  amount: number;
  status: CommissionStatus;
  paid_at: string | null;
  created_at: string;
}

export type WithdrawalStatus = "pending" | "approved" | "paid" | "rejected";

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_code: string | null;
  account_number: string | null;
  account_name: string | null;
  status: WithdrawalStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Affiliate Products ──────────────────────────────────────────────────────
export interface AffiliateProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  link_url: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Website Settings ────────────────────────────────────────────────────────
export interface WebsiteSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface ContactSettings {
  email: string;
  phone: string;
  address: string;
  tax_url: string;
  working_hours: string;
}

export interface SocialSettings {
  facebook: string;
  tiktok: string;
  youtube: string;
  zalo: string;
  instagram: string;
}

export interface SeoSettings {
  title: string;
  description: string;
  og_image: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

// ─── Feature Catalog ─────────────────────────────────────────────────────────
export interface FeatureCatalogItem {
  key: string;
  name: string;
  description: string | null;
  price: number;
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
}
