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
