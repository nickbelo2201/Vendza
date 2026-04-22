import { prisma } from "@vendza/database";

import { invalidateStorefrontCache } from "../storefront/cache.js";
import type { PartnerContext } from "./context.js";

type StoreHourInput = {
  dayOfWeek: number;
  opensAt: string;
  closesAt: string;
  isClosed?: boolean;
};

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

  // Invalida cache do storefront para refletir horários atualizados
  await invalidateStorefrontCache(context.storeId);

  return getStoreHours(context);
}

