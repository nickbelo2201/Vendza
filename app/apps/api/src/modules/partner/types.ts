export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "pix" | "cash" | "card_online" | "card_on_delivery";

export type PartnerOrderFilters = {
  status?: string;
  search?: string;
};

export type PartnerOrderStatusUpdate = {
  status: OrderStatus;
  note?: string;
};

export type PartnerManualOrder = {
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  address: {
    line1: string;
    number?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  payment: {
    method: PaymentMethod;
  };
  note?: string;
};

export type PartnerProductUpsert = {
  name: string;
  slug: string;
  categoryId?: string;
  listPriceCents: number;
  salePriceCents?: number;
};

export type PartnerProductUpdate = Partial<PartnerProductUpsert> & {
  description?: string;
  imageUrl?: string | null;
  isFeatured?: boolean;
};

export type PartnerInventoryMovement = {
  productId: string;
  quantityDelta: number;
  reason: string;
};

export type PartnerCustomerUpdate = {
  name?: string;
  isInactive?: boolean;
};

export type PartnerStoreSettingsUpdate = {
  name?: string;
  whatsappPhone?: string;
  minimumOrderValueCents?: number;
};

export type PartnerStoreHourInput = {
  dayOfWeek?: number;
  weekday?: number;
  opensAt: string;
  closesAt: string;
  isClosed?: boolean;
};

export type PartnerDeliveryZoneInput = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: string;
  neighborhoods: string[];
  radiusKm: number;
  isActive?: boolean;
  minimumOrderValueCents?: number;
};
