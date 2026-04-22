import { prisma } from "@vendza/database";

import { invalidateStorefrontCache } from "../storefront/cache.js";
import { type PartnerContext } from "./context.js";

export type DeliveryZoneInput = {
  label: string;
  mode: "radius" | "neighborhoods";
  radiusKm?: number;
  neighborhoods?: string[];
  centerLat?: number;
  centerLng?: number;
  feeCents: number;
  etaMinutes: number;
  minimumOrderCents?: number;
  freeShippingAboveCents?: number;
};

function mapZona(zone: {
  id: string;
  label: string;
  mode: string;
  radiusMeters: number | null;
  neighborhoodsJson: unknown;
  centerLat: number | null;
  centerLng: number | null;
  deliveryFeeCents: number;
  estimatedDeliveryMinutes: number;
  minimumOrderValueCents: number;
  freeShippingAboveCents: number;
  isActive: boolean;
}) {
  return {
    id: zone.id,
    label: zone.label,
    mode: zone.mode,
    radiusKm: zone.radiusMeters ? zone.radiusMeters / 1000 : 0,
    neighborhoods: Array.isArray(zone.neighborhoodsJson) ? (zone.neighborhoodsJson as string[]) : [],
    centerLat: zone.centerLat,
    centerLng: zone.centerLng,
    feeCents: zone.deliveryFeeCents,
    etaMinutes: zone.estimatedDeliveryMinutes,
    minimumOrderCents: zone.minimumOrderValueCents,
    freeShippingAboveCents: zone.freeShippingAboveCents,
    isActive: zone.isActive,
  };
}

export async function listDeliveryZones(context: PartnerContext) {
  const zones = await prisma.deliveryZone.findMany({
    where: { storeId: context.storeId },
    orderBy: { createdAt: "asc" },
  });
  return zones.map(mapZona);
}

export async function createDeliveryZone(context: PartnerContext, input: DeliveryZoneInput) {
  const zone = await prisma.deliveryZone.create({
    data: {
      storeId: context.storeId,
      label: input.label,
      mode: input.mode === "radius" ? "radius" : "neighborhoods",
      radiusMeters: input.radiusKm != null ? Math.round(input.radiusKm * 1000) : null,
      neighborhoodsJson: Array.isArray(input.neighborhoods) ? input.neighborhoods : [],
      centerLat: input.centerLat ?? null,
      centerLng: input.centerLng ?? null,
      deliveryFeeCents: input.feeCents,
      estimatedDeliveryMinutes: input.etaMinutes,
      minimumOrderValueCents: input.minimumOrderCents ?? 0,
      freeShippingAboveCents: input.freeShippingAboveCents ?? 0,
      isActive: true,
    },
  });

  // Invalida cache do storefront para refletir nova zona de entrega
  await invalidateStorefrontCache(context.storeId);

  return mapZona(zone);
}

export async function updateDeliveryZone(
  context: PartnerContext,
  id: string,
  input: Partial<DeliveryZoneInput>,
) {
  const existing = await prisma.deliveryZone.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) return null;

  const zone = await prisma.deliveryZone.update({
    where: { id },
    data: {
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.mode !== undefined
        ? { mode: input.mode === "radius" ? "radius" : "neighborhoods" }
        : {}),
      ...(input.radiusKm !== undefined
        ? { radiusMeters: Math.round(input.radiusKm * 1000) }
        : {}),
      ...(input.neighborhoods !== undefined
        ? { neighborhoodsJson: input.neighborhoods }
        : {}),
      ...(input.centerLat !== undefined ? { centerLat: input.centerLat } : {}),
      ...(input.centerLng !== undefined ? { centerLng: input.centerLng } : {}),
      ...(input.feeCents !== undefined ? { deliveryFeeCents: input.feeCents } : {}),
      ...(input.etaMinutes !== undefined
        ? { estimatedDeliveryMinutes: input.etaMinutes }
        : {}),
      ...(input.minimumOrderCents !== undefined
        ? { minimumOrderValueCents: input.minimumOrderCents }
        : {}),
      ...(input.freeShippingAboveCents !== undefined
        ? { freeShippingAboveCents: input.freeShippingAboveCents }
        : {}),
    },
  });

  // Invalida cache do storefront para refletir zona de entrega atualizada
  await invalidateStorefrontCache(context.storeId);

  return mapZona(zone);
}

export async function deleteDeliveryZone(context: PartnerContext, id: string) {
  const existing = await prisma.deliveryZone.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) return null;

  const zone = await prisma.deliveryZone.update({
    where: { id },
    data: { isActive: false },
  });

  // Invalida cache do storefront para refletir zona de entrega removida
  await invalidateStorefrontCache(context.storeId);

  return mapZona(zone);
}
