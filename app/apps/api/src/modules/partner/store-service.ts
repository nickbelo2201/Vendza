import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

type StoreSettingsInput = {
  name?: string;
  whatsappPhone?: string;
  minimumOrderValueCents?: number;
};

type StoreHourInput = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed?: boolean;
};

type DeliveryZoneInput = {
  id?: string;
  label: string;
  feeCents: number;
  etaMinutes: string;
  neighborhoods: string[];
  radiusKm: number;
};

function mapStoreSettings(store: {
  id: string;
  slug: string;
  name: string;
  whatsappPhone: string;
  status: string;
  timezone: string;
  minimumOrderValueCents: number;
}) {
  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    whatsappPhone: store.whatsappPhone,
    status: store.status,
    timezone: store.timezone,
    minimumOrderValueCents: store.minimumOrderValueCents,
    paymentMethods: ["pix", "cash", "card_online", "card_on_delivery"],
    designGate: true,
  };
}

function parseEtaMinutes(value: string | undefined) {
  if (!value) {
    return 45;
  }

  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 45;
}

function parseNeighborhoods(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapDeliveryZone(zone: {
  id: string;
  label: string;
  deliveryFeeCents: number;
  estimatedDeliveryMinutes: number;
  neighborhoodsJson: unknown;
  radiusMeters: number | null;
}) {
  return {
    id: zone.id,
    label: zone.label,
    feeCents: zone.deliveryFeeCents,
    etaMinutes: `${zone.estimatedDeliveryMinutes}`,
    neighborhoods: parseNeighborhoods(zone.neighborhoodsJson),
    radiusKm: zone.radiusMeters ? Number((zone.radiusMeters / 1000).toFixed(2)) : 0,
  };
}

export async function getStoreSettings(context: PartnerContext) {
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: context.storeId },
    select: {
      id: true,
      slug: true,
      name: true,
      whatsappPhone: true,
      status: true,
      timezone: true,
      minimumOrderValueCents: true,
    },
  });

  return mapStoreSettings(store);
}

export async function updateStoreSettings(context: PartnerContext, input: StoreSettingsInput) {
  const store = await prisma.store.update({
    where: { id: context.storeId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.whatsappPhone !== undefined ? { whatsappPhone: input.whatsappPhone } : {}),
      ...(input.minimumOrderValueCents !== undefined
        ? { minimumOrderValueCents: input.minimumOrderValueCents }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      whatsappPhone: true,
      status: true,
      timezone: true,
      minimumOrderValueCents: true,
    },
  });

  return mapStoreSettings(store);
}

export async function getStoreHours(context: PartnerContext) {
  const hours = await prisma.storeHour.findMany({
    where: { storeId: context.storeId },
    orderBy: { weekday: "asc" },
  });

  return hours.map((item: { weekday: number; opensAt: string; closesAt: string; isClosed: boolean }) => ({
    dayOfWeek: item.weekday,
    opensAt: item.opensAt,
    closesAt: item.closesAt,
    isClosed: item.isClosed,
  }));
}

export async function updateStoreHours(context: PartnerContext, input: StoreHourInput[]) {
  await prisma.$transaction(
    input.map((item: StoreHourInput) =>
      prisma.storeHour.upsert({
        where: {
          storeId_weekday: {
            storeId: context.storeId,
            weekday: item.dayOfWeek,
          },
        },
        update: {
          opensAt: item.opensAt,
          closesAt: item.closesAt,
          isClosed: item.isClosed ?? false,
        },
        create: {
          storeId: context.storeId,
          weekday: item.dayOfWeek,
          opensAt: item.opensAt,
          closesAt: item.closesAt,
          isClosed: item.isClosed ?? false,
        },
      }),
    ),
  );

  return getStoreHours(context);
}

export async function getDeliveryZones(context: PartnerContext) {
  const zones = await prisma.deliveryZone.findMany({
    where: { storeId: context.storeId },
    orderBy: { createdAt: "asc" },
  });

  return zones.map(mapDeliveryZone);
}

export async function updateDeliveryZones(context: PartnerContext, input: DeliveryZoneInput[]) {
  await prisma.$transaction(async (tx: any) => {
    await tx.deliveryZone.deleteMany({
      where: { storeId: context.storeId },
    });

    if (input.length === 0) {
      return;
    }

    await tx.deliveryZone.createMany({
      data: input.map((zone) => ({
        ...(zone.id ? { id: zone.id } : {}),
        storeId: context.storeId,
        label: zone.label,
        neighborhoodsJson: zone.neighborhoods,
        radiusMeters: Math.round(zone.radiusKm * 1000),
        deliveryFeeCents: zone.feeCents,
        minimumOrderValueCents: 0,
        estimatedDeliveryMinutes: parseEtaMinutes(zone.etaMinutes),
        isActive: true,
      })),
    });
  });

  return getDeliveryZones(context);
}
