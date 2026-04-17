import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function addCustomerTag(context: PartnerContext, customerId: string, label: string) {
  // Garantir que o cliente pertence à loja
  const customer = await prisma.customer.findFirst({
    where: { storeId: context.storeId, id: customerId },
    select: { id: true },
  });
  if (!customer) return null;

  return prisma.customerTag.upsert({
    where: { customerId_label: { customerId, label } },
    create: { customerId, label },
    update: {},
    select: { id: true, label: true, createdAt: true },
  });
}

export async function removeCustomerTag(context: PartnerContext, customerId: string, label: string) {
  const customer = await prisma.customer.findFirst({
    where: { storeId: context.storeId, id: customerId },
    select: { id: true },
  });
  if (!customer) return false;

  const deleted = await prisma.customerTag.deleteMany({
    where: { customerId, label },
  });
  return deleted.count > 0;
}

export async function listCustomerTags(context: PartnerContext, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { storeId: context.storeId, id: customerId },
    select: { id: true },
  });
  if (!customer) return null;

  return prisma.customerTag.findMany({
    where: { customerId },
    select: { id: true, label: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Notas ───────────────────────────────────────────────────────────────────

export async function addCustomerNote(
  context: PartnerContext,
  customerId: string,
  body: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { storeId: context.storeId, id: customerId },
    select: { id: true },
  });
  if (!customer) return null;

  return prisma.customerNote.create({
    data: { customerId, body },
    select: { id: true, body: true, createdAt: true },
  });
}

export async function listCustomerNotes(context: PartnerContext, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { storeId: context.storeId, id: customerId },
    select: { id: true },
  });
  if (!customer) return null;

  return prisma.customerNote.findMany({
    where: { customerId },
    select: { id: true, body: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

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
  // Ao receber só a data (ex: "2026-04-16"), new Date() cria meia-noite UTC.
  // Para o "to", precisamos cobrir o dia inteiro até 23:59:59.999Z.
  const toDate = filters.to
    ? (() => { const d = new Date(filters.to); d.setUTCHours(23, 59, 59, 999); return d; })()
    : now;
  const fromDate = filters.from
    ? new Date(filters.from + "T00:00:00.000Z")
    : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 90) throw new Error("Período máximo para relatórios é 90 dias.");

  const whereAtivos = {
    storeId: context.storeId,
    placedAt: { gte: fromDate, lte: toDate },
    status: { not: "cancelled" as const },
  };
  const whereCancelados = {
    storeId: context.storeId,
    placedAt: { gte: fromDate, lte: toDate },
    status: "cancelled" as const,
  };

  // Busca paralela
  const [pedidosAtivos, pedidosCancelados, novosClientes] = await Promise.all([
    prisma.order.findMany({
      where: whereAtivos,
      select: {
        id: true,
        customerId: true,
        totalCents: true,
        paymentMethod: true,
        placedAt: true,
        items: { select: { productName: true, quantity: true, totalPriceCents: true } },
      },
    }),
    prisma.order.count({ where: whereCancelados }),
    prisma.customer.count({
      where: { storeId: context.storeId, createdAt: { gte: fromDate, lte: toDate } },
    }),
  ]);

  // Métricas básicas
  const totalOrders = pedidosAtivos.length;
  const totalRevenueCents = pedidosAtivos.reduce((s: number, o: { totalCents: number }) => s + o.totalCents, 0);
  const averageTicketCents = totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0;

  // Taxa de cancelamento
  const totalWithCancelled = totalOrders + pedidosCancelados;
  const cancellationRate =
    totalWithCancelled > 0
      ? Math.round((pedidosCancelados / totalWithCancelled) * 100 * 10) / 10
      : 0;

  // Taxa de recompra — clientes que já tinham pedido antes do período
  const customerIdsNoPeriodo = [...new Set(pedidosAtivos.map((o: { customerId: string }) => o.customerId))];
  let repeatCustomers = 0;
  if (customerIdsNoPeriodo.length > 0) {
    const antigos = await prisma.order.findMany({
      where: {
        storeId: context.storeId,
        placedAt: { lt: fromDate },
        status: { not: "cancelled" as const },
        customerId: { in: customerIdsNoPeriodo },
      },
      select: { customerId: true },
      distinct: ["customerId"],
    });
    repeatCustomers = antigos.length;
  }
  const repeatRate =
    totalOrders > 0
      ? Math.min(100, Math.round((repeatCustomers / totalOrders) * 100 * 10) / 10)
      : 0;

  // Receita por dia
  const revenueByDayMap = new Map<string, number>();
  for (const o of pedidosAtivos) {
    const day = o.placedAt.toISOString().slice(0, 10);
    revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + o.totalCents);
  }
  const revenueByDay = [...revenueByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenueCents]) => ({ date, revenueCents }));

  // Top produtos
  const prodMap = new Map<string, { quantity: number; revenueCents: number }>();
  for (const o of pedidosAtivos) {
    for (const item of o.items) {
      const cur = prodMap.get(item.productName) ?? { quantity: 0, revenueCents: 0 };
      prodMap.set(item.productName, {
        quantity: cur.quantity + item.quantity,
        revenueCents: cur.revenueCents + item.totalPriceCents,
      });
    }
  }
  const topProducts = [...prodMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Distribuição de formas de pagamento
  const payMap = new Map<string, number>();
  for (const o of pedidosAtivos) {
    payMap.set(o.paymentMethod, (payMap.get(o.paymentMethod) ?? 0) + 1);
  }
  const paymentDistribution = [...payMap.entries()]
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  // Vendas por hora
  const hourMap = new Map<number, { count: number; revenueCents: number }>();
  for (const o of pedidosAtivos) {
    const h = o.placedAt.getHours();
    const cur = hourMap.get(h) ?? { count: 0, revenueCents: 0 };
    hourMap.set(h, { count: cur.count + 1, revenueCents: cur.revenueCents + o.totalCents });
  }
  const salesByHour = [...hourMap.entries()]
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => a.hour - b.hour);

  return {
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    totalRevenueCents,
    totalOrders,
    averageTicketCents,
    newCustomers: novosClientes,
    topProducts,
    revenueByDay,
    cancelledOrders: pedidosCancelados,
    cancellationRate,
    repeatCustomers,
    repeatRate,
    paymentDistribution,
    salesByHour,
  };
}

export async function getDashboardSummary(context: PartnerContext) {
  // "Pedido do dia" = criado entre 00:00 e 23:59 no horário de Brasília (America/Sao_Paulo, UTC-3).
  // Usamos toLocaleDateString com o timezone correto para obter a data local e construir
  // a meia-noite equivalente em UTC. Brasil não usa mais horário de verão desde 2019 (fixo UTC-3).
  const agora = new Date();
  const dataHoje = agora.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // "YYYY-MM-DD"
  const startOfToday = new Date(`${dataHoje}T03:00:00.000Z`); // 00:00 Brasília = 03:00 UTC

  const [todayOrders, newCustomers] = await Promise.all([
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
    prisma.customer.count({
      where: { storeId: context.storeId, createdAt: { gte: startOfToday } },
    }),
  ]);

  const revenueCents = todayOrders.reduce((sum: number, order: { totalCents: number }) => sum + order.totalCents, 0);
  const averageTicketCents = todayOrders.length > 0 ? Math.round(revenueCents / todayOrders.length) : 0;
  const recurringCustomerIds = new Set(todayOrders.map((order: { customerId: string }) => order.customerId));

  return {
    ordersToday: todayOrders.length,
    revenueCents,
    averageTicketCents,
    recurringCustomers: recurringCustomerIds.size,
    newCustomers,
  };
}
