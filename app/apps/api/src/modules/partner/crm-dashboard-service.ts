import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

export async function listCustomers(context: PartnerContext) {
  return prisma.customer.findMany({
    where: { storeId: context.storeId },
    orderBy: [{ lastOrderAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      totalSpentCents: true,
      isInactive: true,
      lastOrderAt: true,
    },
  });
}

export async function getCustomerById(context: PartnerContext, id: string) {
  return prisma.customer.findFirst({
    where: {
      storeId: context.storeId,
      id,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      totalSpentCents: true,
      isInactive: true,
      lastOrderAt: true,
    },
  });
}

export async function updateCustomer(
  context: PartnerContext,
  id: string,
  input: { name?: string; isInactive?: boolean },
) {
  const customer = await prisma.customer.findFirst({
    where: {
      storeId: context.storeId,
      id,
    },
    select: { id: true },
  });

  if (!customer) {
    return null;
  }

  return prisma.customer.update({
    where: { id: customer.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.isInactive !== undefined ? { isInactive: input.isInactive } : {}),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      totalSpentCents: true,
      isInactive: true,
      lastOrderAt: true,
    },
  });
}

export type ReportFilters = {
  from?: string;
  to?: string;
};

export async function getPartnerReports(context: PartnerContext, filters: ReportFilters) {
  const now = new Date();
  const toDate = filters.to ? new Date(filters.to) : now;
  const fromDate = filters.from ? new Date(filters.from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: {
      storeId: context.storeId,
      placedAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      items: true,
    },
  });

  const totalRevenueCents = orders.reduce((sum: number, o: { totalCents: number }) => sum + o.totalCents, 0);
  const totalOrders = orders.length;
  const averageTicketCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

  // Novos clientes no período
  const newCustomers = await prisma.customer.count({
    where: {
      storeId: context.storeId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
  });

  // Top produtos por quantidade vendida
  const productMap = new Map<string, { name: string; quantity: number; revenueCents: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const existing = productMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenueCents += item.totalPriceCents;
      } else {
        productMap.set(item.productId, {
          name: item.productName,
          quantity: item.quantity,
          revenueCents: item.totalPriceCents,
        });
      }
    }
  }

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Receita por dia
  const revenueByDayMap = new Map<string, number>();
  for (const order of orders) {
    const dayKey = order.placedAt.toISOString().slice(0, 10);
    revenueByDayMap.set(dayKey, (revenueByDayMap.get(dayKey) ?? 0) + order.totalCents);
  }

  const revenueByDay = Array.from(revenueByDayMap.entries())
    .map(([date, revenueCents]) => ({ date, revenueCents }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    totalRevenueCents,
    totalOrders,
    averageTicketCents,
    newCustomers,
    topProducts,
    revenueByDay,
  };
}

export async function getDashboardSummary(context: PartnerContext) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayOrders, customers, totalCustomers] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId: context.storeId,
        placedAt: {
          gte: startOfToday,
        },
      },
      select: {
        totalCents: true,
        customerId: true,
      },
    }),
    prisma.customer.findMany({
      where: { storeId: context.storeId },
      select: {
        id: true,
        createdAt: true,
      },
    }),
    prisma.customer.count({
      where: { storeId: context.storeId },
    }),
  ]);

  const revenueCents = todayOrders.reduce((sum: number, order: { totalCents: number }) => sum + order.totalCents, 0);
  const averageTicketCents = todayOrders.length > 0 ? Math.round(revenueCents / todayOrders.length) : 0;
  const recurringCustomerIds = new Set(todayOrders.map((order: { customerId: string }) => order.customerId));
  const newCustomers = customers.filter((customer: { createdAt: Date }) => customer.createdAt >= startOfToday).length;

  return {
    ordersToday: todayOrders.length,
    revenueCents,
    averageTicketCents,
    recurringCustomers: recurringCustomerIds.size,
    newCustomers: Math.min(newCustomers, totalCustomers),
  };
}
