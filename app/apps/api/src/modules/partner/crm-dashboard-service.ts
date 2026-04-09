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
  const toDate = filters.to ? new Date(filters.to) : now;
  const fromDate = filters.from ? new Date(filters.from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Validação de range máximo de 90 dias
  const diffMs = toDate.getTime() - fromDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays > 90) {
    throw new Error("Período máximo para relatórios é 90 dias.");
  }

  type SummaryRow = { count: bigint; sum: bigint | null; avg: bigint | null };
  type TopProductRow = { name: string; quantity: bigint; revenue_cents: bigint };
  type RevenueByDayRow = { date: Date | string; revenue_cents: bigint };
  type CountRow = { count: bigint };
  type CancelledRow = { count: bigint };
  type RepeatRow = { count: bigint };
  type PaymentRow = { payment_method: string; count: bigint };
  type SalesByHourRow = { hour: number | bigint; count: bigint; revenue_cents: bigint };

  // Todas as queries em paralelo para melhor performance
  const [
    summaryRows,
    topProductRows,
    revenueByDayRows,
    newCustomerRows,
    cancelledRows,
    repeatRows,
    paymentRows,
    salesByHourRows,
  ] = await Promise.all([
    // Total de pedidos + faturamento + ticket médio
    prisma.$queryRaw`
      SELECT COUNT(*) as count, SUM(total_cents) as sum, AVG(total_cents) as avg
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at BETWEEN ${fromDate} AND ${toDate}
        AND status != 'cancelled'
    ` as Promise<SummaryRow[]>,

    // Top produtos
    prisma.$queryRaw`
      SELECT oi.product_name as name, SUM(oi.quantity) as quantity, SUM(oi.total_price_cents) as revenue_cents
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.store_id = ${context.storeId}::uuid
        AND o.placed_at BETWEEN ${fromDate} AND ${toDate}
        AND o.status != 'cancelled'
      GROUP BY oi.product_name
      ORDER BY SUM(oi.quantity) DESC
      LIMIT 10
    ` as Promise<TopProductRow[]>,

    // Receita por dia
    prisma.$queryRaw`
      SELECT DATE(placed_at) as date, SUM(total_cents) as revenue_cents
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at BETWEEN ${fromDate} AND ${toDate}
        AND status != 'cancelled'
      GROUP BY DATE(placed_at)
      ORDER BY date ASC
    ` as Promise<RevenueByDayRow[]>,

    // Novos clientes no período
    prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM customers
      WHERE store_id = ${context.storeId}::uuid
        AND created_at BETWEEN ${fromDate} AND ${toDate}
    ` as Promise<CountRow[]>,

    // Pedidos cancelados no período (para taxa de cancelamento)
    prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at BETWEEN ${fromDate} AND ${toDate}
        AND status = 'cancelled'
    ` as Promise<CancelledRow[]>,

    // Clientes que já compraram antes do período (taxa de recompra)
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT customer_id) as count
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at BETWEEN ${fromDate} AND ${toDate}
        AND status != 'cancelled'
        AND customer_id IN (
          SELECT customer_id FROM orders
          WHERE store_id = ${context.storeId}::uuid
            AND placed_at < ${fromDate}
            AND status != 'cancelled'
        )
    ` as Promise<RepeatRow[]>,

    // Distribuição de formas de pagamento
    prisma.$queryRaw`
      SELECT payment_method, COUNT(*) as count
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at BETWEEN ${fromDate} AND ${toDate}
        AND status != 'cancelled'
      GROUP BY payment_method
      ORDER BY count DESC
    ` as Promise<PaymentRow[]>,

    // Vendas por hora do dia
    prisma.$queryRaw`
      SELECT EXTRACT(HOUR FROM placed_at) as hour, COUNT(*) as count, SUM(total_cents) as revenue_cents
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at BETWEEN ${fromDate} AND ${toDate}
        AND status != 'cancelled'
      GROUP BY EXTRACT(HOUR FROM placed_at)
      ORDER BY hour ASC
    ` as Promise<SalesByHourRow[]>,
  ]);

  const summary = summaryRows[0];
  const totalOrders = Number(summary?.count ?? 0);
  const totalRevenueCents = Number(summary?.sum ?? 0);
  const averageTicketCents = totalOrders > 0 ? Math.round(Number(summary?.avg ?? 0)) : 0;

  const topProducts = topProductRows.map((row: TopProductRow) => ({
    name: row.name,
    quantity: Number(row.quantity),
    revenueCents: Number(row.revenue_cents),
  }));

  const revenueByDay = revenueByDayRows.map((row: RevenueByDayRow) => ({
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : String(row.date),
    revenueCents: Number(row.revenue_cents),
  }));

  const newCustomers = Number(newCustomerRows[0]?.count ?? 0);

  // Taxa de cancelamento
  const cancelledOrders = Number(cancelledRows[0]?.count ?? 0);
  const totalWithCancelled = totalOrders + cancelledOrders;
  const cancellationRate =
    totalWithCancelled > 0
      ? Math.round((cancelledOrders / totalWithCancelled) * 100 * 10) / 10
      : 0;

  // Taxa de recompra
  const repeatCustomers = Number(repeatRows[0]?.count ?? 0);
  const repeatRate =
    totalOrders > 0
      ? Math.min(100, Math.round((repeatCustomers / totalOrders) * 100 * 10) / 10)
      : 0;

  // Distribuição de formas de pagamento
  const paymentDistribution = paymentRows.map((row: PaymentRow) => ({
    method: row.payment_method,
    count: Number(row.count),
  }));

  // Vendas por hora do dia
  const salesByHour = salesByHourRows.map((row: SalesByHourRow) => ({
    hour: Number(row.hour),
    count: Number(row.count),
    revenueCents: Number(row.revenue_cents),
  }));

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
    cancelledOrders,
    cancellationRate,
    repeatCustomers,
    repeatRate,
    paymentDistribution,
    salesByHour,
  };
}

export async function getDashboardSummary(context: PartnerContext) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

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
