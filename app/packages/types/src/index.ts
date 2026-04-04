export const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export const paymentMethods = [
  "pix",
  "cash",
  "card_on_delivery",
  "card_online",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];

export interface ApiEnvelope<T> {
  data: T;
  meta: {
    requestedAt: string;
  };
}

export interface MoneyBreakdown {
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
}

export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceCents: number;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface OrderTrackingSummary extends MoneyBreakdown {
  publicId: string;
  status: OrderStatus;
  placedAt: string;
}
