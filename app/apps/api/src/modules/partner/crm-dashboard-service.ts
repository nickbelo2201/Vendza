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

export async function listCustomers(
  context: PartnerContext,
  params?: { page?: number; pageSize?: number; search?: string },
) {
  const page = params?.page ?? 1;
  const pageSize = Math.min(params?.pageSize ?? 50, 200);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { storeId: context.storeId };

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: pageSize,
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
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
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

/**
 * Converte uma data no formato "YYYY-MM-DD" para o início do dia em Brasília (UTC-3).
 * Ex: "2026-04-22" → 2026-04-22T03:00:00.000Z (= 00:00 Brasília)
 */
function inicioDiaBrasilia(dateStr: string): Date {
  return new Date(`${dateStr}T03:00:00.000Z`);
}

/**
 * Retorna a data de hoje no fuso horário de Brasília, formato "YYYY-MM-DD".
 */
function hojeEmBrasilia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/**
 * Converte um Date para o formato "YYYY-MM-DD" no fuso horário de Brasília.
 */
function dataParaBrasilia(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/**
 * Retorna a hora (0-23) no fuso horário de Brasília para um Date.
 */
function horaEmBrasilia(d: Date): number {
  return parseInt(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }), 10);
}

export async function getPartnerReports(context: PartnerContext, filters: ReportFilters) {
  // Critério de "período" usa America/Sao_Paulo para alinhar com getDashboardSummary.
  // Datas recebidas como "YYYY-MM-DD" representam dias em Brasília.
  const hojeStr = hojeEmBrasilia();

  const toStr = filters.to ?? hojeStr;
  const fromStr = filters.from ?? (() => {
    // 30 dias atrás a partir de hoje em Brasília
    const d = new Date(inicioDiaBrasilia(toStr).getTime() - 30 * 24 * 60 * 60 * 1000);
    return dataParaBrasilia(d);
  })();

  // Converter para range UTC: início do dia Brasília até início do dia seguinte Brasília
  const fromDate = inicioDiaBrasilia(fromStr);
  const toDate = (() => {
    // Fim do dia "to" em Brasília = início do dia seguinte em Brasília - 1ms
    const nextDay = new Date(inicioDiaBrasilia(toStr).getTime() + 24 * 60 * 60 * 1000);
    return new Date(nextDay.getTime() - 1);
  })();

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
      take: 5000,
      select: {
        id: true,
        customerId: true,
        customerName: true,
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

  // Receita por dia — agrupada pela data em Brasília (America/Sao_Paulo)
  const revenueByDayMap = new Map<string, number>();
  for (const o of pedidosAtivos) {
    const day = dataParaBrasilia(o.placedAt);
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

  // Vendas por hora — hora em Brasília (America/Sao_Paulo)
  const hourMap = new Map<number, { count: number; revenueCents: number }>();
  for (const o of pedidosAtivos) {
    const h = horaEmBrasilia(o.placedAt);
    const cur = hourMap.get(h) ?? { count: 0, revenueCents: 0 };
    hourMap.set(h, { count: cur.count + 1, revenueCents: cur.revenueCents + o.totalCents });
  }
  const salesByHour = [...hourMap.entries()]
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => a.hour - b.hour);

  // Top clientes por faturamento no período
  const clienteMap = new Map<string, {
    name: string;
    totalOrders: number;
    totalRevenueCents: number;
    firstOrderDate: Date;
    lastOrderDate: Date;
  }>();
  for (const o of pedidosAtivos) {
    const cur = clienteMap.get(o.customerId);
    if (cur) {
      cur.totalOrders += 1;
      cur.totalRevenueCents += o.totalCents;
      if (o.placedAt < cur.firstOrderDate) cur.firstOrderDate = o.placedAt;
      if (o.placedAt > cur.lastOrderDate) cur.lastOrderDate = o.placedAt;
    } else {
      clienteMap.set(o.customerId, {
        name: o.customerName ?? "—",
        totalOrders: 1,
        totalRevenueCents: o.totalCents,
        firstOrderDate: o.placedAt,
        lastOrderDate: o.placedAt,
      });
    }
  }
  const topClientes = [...clienteMap.values()]
    .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents)
    .slice(0, 20)
    .map((c) => ({
      name: c.name,
      totalOrders: c.totalOrders,
      totalRevenueCents: c.totalRevenueCents,
      firstOrderDate: c.firstOrderDate.toISOString(),
      lastOrderDate: c.lastOrderDate.toISOString(),
    }));

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
    topClientes,
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
