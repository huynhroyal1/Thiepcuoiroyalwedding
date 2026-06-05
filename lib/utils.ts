import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function mapsUrlToEmbed(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/embed")) return trimmed;
  if (trimmed.includes("maps.google.com") || trimmed.includes("goo.gl/maps") || trimmed.includes("goo.gl/maps")) return trimmed;
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}&output=embed`;
}

/**
 * Convert a Google Maps URL or address string to a Google Maps **directions** URL.
 * This is used for "Xem chỉ đường" buttons so clicking opens the directions view.
 */
export function mapsUrlToDirections(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "#";
  // Already a full Google Maps URL — extract search query
  if (trimmed.includes("maps.google.com") || trimmed.includes("goo.gl/maps")) {
    return trimmed;
  }
  // Embed URL — extract the q param
  const match = trimmed.match(/[?&]q=([^&]+)/);
  if (match) {
    return `https://www.google.com/maps/search/?api=1&query=${match[1]}`;
  }
  // Plain address or place name
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmed)}`;
}

export function planRank(plan: string): number {
  switch (plan) {
    case "vip":
      return 3;
    case "pro":
      return 2;
    default:
      return 1;
  }
}
