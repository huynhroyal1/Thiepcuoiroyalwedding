import { z } from "zod";

export const rsvpSchema = z.object({
  cardId: z.string().uuid(),
  guestName: z.string().min(1).max(200),
  attending: z.coerce.boolean(),
  guestCount: z.coerce.number().int().min(1).max(50).optional(),
  note: z.string().max(500).optional().nullable(),
  guestId: z.string().uuid().optional().nullable(),
});

export const wishSchema = z.object({
  cardId: z.string().uuid(),
  guestName: z.string().min(1).max(120),
  message: z.string().min(1).max(500),
});

export const giftSchema = z.object({
  cardId: z.string().uuid(),
  guestName: z.string().max(200).optional().nullable(),
  amount: z.coerce.number().int().min(0).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const createPaymentSchema = z.object({
  plan: z.enum(["basic", "pro", "vip"]),
  cardId: z.string().uuid(),
});

export const createFeaturePaymentSchema = z.object({
  cardId: z.string().uuid(),
  featureKeys: z.array(z.string().min(1)).min(1),
});
