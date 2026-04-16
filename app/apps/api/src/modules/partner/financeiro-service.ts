import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LABELS_STATUS: Record<string, string> = {
  pending: "Pendente",
  authorized: "Autorizado",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Estornado",
};

const LABELS_METODO: Record<string, string> = {
  pix: "Pix",
  cash: "Dinheiro",
  card_on_delivery: "Cartão na entrega",
  card_online: "Cartão online",
};

function calcComparacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100 * 10) / 10;
}

function formatarData(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function adicionarDias(d: Date, dias: number): Date {
  return new Date(d.getTime() + dias * 24 * 60 * 60 * 1000);
}

// ─── Tipos internos ──────────────────────────────────────────────────────────

type RowBigint = { count: bigint; sum: bigint | null };
type RowStatusMetodo = { chave: string; count: bigint; sum: bigint };
type RowDia = { data: Date | string; pago_cents: bigint; total_cents: bigint; pedidos: bigint };

// ─── getFinanceiroKpis ────────────────────────────────────────────────────────

export async function getFinanceiroKpis(context: PartnerContext, from: Date, to: Date) {
  const { storeId } = context;

  // Calcular período anterior de mesma duração
  const duracaoMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1); // 1ms antes do início do período atual
  const prevFrom = new Date(prevTo.getTime() - duracaoMs);

  // Rodar todas as queries em paralelo
  const [
    // Período atual — pedidos não cancelados
    rowsAtual,
    // Período atual — cancelamentos
    rowsCancelAtual,
    // Período atual — pagos (paymentStatus = paid)
    rowsPagosAtual,
    // Período atual — pendentes (paymentStatus = pending)
    rowsPendentesAtual,
    // Período atual — pendentes antigos (> 48h)
    rowsPendentesAntigosAtual,
    // Período anterior — pedidos não cancelados
    rowsAnterior,
    // Período anterior — cancelamentos
    rowsCancelAnterior,
    // Período anterior — pagos
    rowsPagosAnterior,
    // Receita por dia
    rowsDia,
    // Breakdown por paymentStatus
    rowsBreakdownStatus,
    // Breakdown por paymentMethod
    rowsBreakdownMetodo,
  ] = await Promise.all([
    // 1. Receita bruta (não cancelados)
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
        AND status != 'cancelled'
    ` as Promise<RowBigint[]>,

    // 2. Cancelamentos atuais
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
        AND status = 'cancelled'
    ` as Promise<RowBigint[]>,

    // 3. Pagos atuais
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
        AND payment_status = 'paid'
    ` as Promise<RowBigint[]>,

    // 4. Pendentes atuais
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
        AND payment_status = 'pending'
        AND status != 'cancelled'
    ` as Promise<RowBigint[]>,

    // 5. Pendentes antigos (> 48h)
    prisma.$queryRaw`
      SELECT COUNT(*) AS count
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
        AND payment_status = 'pending'
        AND status != 'cancelled'
        AND placed_at < NOW() - INTERVAL '48 hours'
    ` as Promise<{ count: bigint }[]>,

    // 6. Período anterior — não cancelados
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${prevFrom}
        AND placed_at <= ${prevTo}
        AND status != 'cancelled'
    ` as Promise<RowBigint[]>,

    // 7. Período anterior — cancelamentos
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${prevFrom}
        AND placed_at <= ${prevTo}
        AND status = 'cancelled'
    ` as Promise<RowBigint[]>,

    // 8. Período anterior — pagos
    prisma.$queryRaw`
      SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${prevFrom}
        AND placed_at <= ${prevTo}
        AND payment_status = 'paid'
    ` as Promise<RowBigint[]>,

    // 9. Receita por dia
    prisma.$queryRaw`
      SELECT
        DATE(placed_at AT TIME ZONE 'America/Sao_Paulo') AS data,
        COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_cents ELSE 0 END), 0) AS pago_cents,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_cents ELSE 0 END), 0) AS total_cents,
        COUNT(CASE WHEN status != 'cancelled' THEN 1 END) AS pedidos
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
      GROUP BY DATE(placed_at)
      ORDER BY data ASC
    ` as Promise<RowDia[]>,

    // 10. Breakdown por paymentStatus
    prisma.$queryRaw`
      SELECT payment_status AS chave, COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
      GROUP BY payment_status
      ORDER BY count DESC
    ` as Promise<RowStatusMetodo[]>,

    // 11. Breakdown por paymentMethod
    prisma.$queryRaw`
      SELECT payment_method AS chave, COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS sum
      FROM orders
      WHERE store_id = ${storeId}::uuid
        AND placed_at >= ${from}
        AND placed_at <= ${to}
        AND status != 'cancelled'
      GROUP BY payment_method
      ORDER BY count DESC
    ` as Promise<RowStatusMetodo[]>,
  ]);

  // ─── Calcular KPIs atuais ────────────────────────────────────────────────

  const receitaBrutaAtual = Number(rowsAtual[0]?.sum ?? 0);
  const totalPedidosAtual = Number(rowsAtual[0]?.count ?? 0);

  const cancelCentavosAtual = Number(rowsCancelAtual[0]?.sum ?? 0);
  const cancelCountAtual = Number(rowsCancelAtual[0]?.count ?? 0);

  const receitaLiquidaAtual = receitaBrutaAtual - cancelCentavosAtual;
  const ticketMedioAtual = totalPedidosAtual > 0 ? Math.round(receitaBrutaAtual / totalPedidosAtual) : 0;

  const pagosCountAtual = Number(rowsPagosAtual[0]?.count ?? 0);
  const pagosCentavosAtual = Number(rowsPagosAtual[0]?.sum ?? 0);

  const pendentesCountAtual = Number(rowsPendentesAtual[0]?.count ?? 0);
  const pendentesCentavosAtual = Number(rowsPendentesAtual[0]?.sum ?? 0);
  const pendentesAntigoCountAtual = Number(rowsPendentesAntigosAtual[0]?.count ?? 0);

  // ─── Calcular KPIs anteriores ────────────────────────────────────────────

  const receitaBrutaAnterior = Number(rowsAnterior[0]?.sum ?? 0);
  const totalPedidosAnterior = Number(rowsAnterior[0]?.count ?? 0);

  const cancelCentavosAnterior = Number(rowsCancelAnterior[0]?.sum ?? 0);
  const cancelCountAnterior = Number(rowsCancelAnterior[0]?.count ?? 0);

  const receitaLiquidaAnterior = receitaBrutaAnterior - cancelCentavosAnterior;
  const ticketMedioAnterior = totalPedidosAnterior > 0 ? Math.round(receitaBrutaAnterior / totalPedidosAnterior) : 0;

  const pagosCountAnterior = Number(rowsPagosAnterior[0]?.count ?? 0);
  const pagosCentavosAnterior = Number(rowsPagosAnterior[0]?.sum ?? 0);

  // ─── Receita por dia (preencher dias sem pedidos se período ≤ 31 dias) ───

  const diffDias = Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));

  const mapaRbd: Record<string, { pagoCentavos: number; totalCentavos: number; pedidos: number }> = {};
  for (const row of rowsDia) {
    const chave = row.data instanceof Date ? formatarData(row.data) : String(row.data);
    mapaRbd[chave] = {
      pagoCentavos: Number(row.pago_cents),
      totalCentavos: Number(row.total_cents),
      pedidos: Number(row.pedidos),
    };
  }

  const receitaPorDia: Array<{ date: string; pagoCentavos: number; totalCentavos: number; pedidos: number }> = [];

  if (diffDias <= 31) {
    // Preencher todos os dias do período
    for (let i = 0; i <= diffDias; i++) {
      const d = adicionarDias(from, i);
      const chave = formatarData(d);
      const entrada = mapaRbd[chave] ?? { pagoCentavos: 0, totalCentavos: 0, pedidos: 0 };
      receitaPorDia.push({ date: chave, ...entrada });
    }
  } else {
    // Retornar apenas os dias com dados
    for (const row of rowsDia) {
      const chave = row.data instanceof Date ? formatarData(row.data) : String(row.data);
      receitaPorDia.push({
        date: chave,
        pagoCentavos: Number(row.pago_cents),
        totalCentavos: Number(row.total_cents),
        pedidos: Number(row.pedidos),
      });
    }
  }

  // ─── Breakdown status ─────────────────────────────────────────────────────

  const breakdownStatus = rowsBreakdownStatus.map((row) => ({
    status: row.chave,
    label: LABELS_STATUS[row.chave] ?? row.chave,
    count: Number(row.count),
    centavos: Number(row.sum),
  }));

  // ─── Breakdown método ─────────────────────────────────────────────────────

  const breakdownMetodo = rowsBreakdownMetodo.map((row) => ({
    method: row.chave,
    label: LABELS_METODO[row.chave] ?? row.chave,
    count: Number(row.count),
    centavos: Number(row.sum),
  }));

  return {
    kpis: {
      receitaBruta: {
        centavos: receitaBrutaAtual,
        comparacao: calcComparacao(receitaBrutaAtual, receitaBrutaAnterior),
      },
      receitaLiquida: {
        centavos: receitaLiquidaAtual,
        comparacao: calcComparacao(receitaLiquidaAtual, receitaLiquidaAnterior),
      },
      pedidosPagos: {
        count: pagosCountAtual,
        centavos: pagosCentavosAtual,
        comparacao: calcComparacao(pagosCentavosAtual, pagosCentavosAnterior),
      },
      pedidosPendentes: {
        count: pendentesCountAtual,
        centavos: pendentesCentavosAtual,
        pendentesAntigoCount: pendentesAntigoCountAtual,
      },
      ticketMedio: {
        centavos: ticketMedioAtual,
        comparacao: calcComparacao(ticketMedioAtual, ticketMedioAnterior),
      },
      cancelamentos: {
        count: cancelCountAtual,
        centavos: cancelCentavosAtual,
        comparacao: calcComparacao(cancelCountAtual, cancelCountAnterior),
      },
    },
    receitaPorDia,
    breakdownStatus,
    breakdownMetodo,
  };
}

// ─── getExtratoFinanceiro ─────────────────────────────────────────────────────

export type ExtratoParams = {
  from: Date;
  to: Date;
  status?: string;
  metodo?: string;
  busca?: string;
  page: number;
  pageSize: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
};

export async function getExtratoFinanceiro(context: PartnerContext, params: ExtratoParams) {
  const { storeId } = context;
  const { from, to, status, metodo, busca, page, pageSize, orderDir } = params;

  const buscaTermo = busca ? busca.trim() : null;
  const ordenarPorValor = params.orderBy === "valor";
  const dir = orderDir === "asc" ? "asc" : "desc";
  const offset = (page - 1) * pageSize;

  const where = {
    storeId,
    placedAt: { gte: from, lte: to },
    ...(status ? { paymentStatus: status } : {}),
    ...(metodo ? { paymentMethod: metodo } : {}),
    ...(buscaTermo
      ? {
          OR: [
            { publicId: { contains: buscaTermo, mode: "insensitive" as const } },
            { customerName: { contains: buscaTermo, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const orderBy = ordenarPorValor ? { totalCents: dir } : { placedAt: dir };

  const [pedidosRaw, total, aggregado] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        publicId: true,
        placedAt: true,
        customerName: true,
        totalCents: true,
        deliveryFeeCents: true,
        paymentMethod: true,
        paymentStatus: true,
      },
      orderBy,
      skip: offset,
      take: pageSize,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({ where, _sum: { totalCents: true } }),
  ]);

  const totalFiltradoCentavos = aggregado._sum.totalCents ?? 0;

  type PedidoExtrato = { id: string; publicId: string; placedAt: Date; customerName: string; totalCents: number; deliveryFeeCents: number; paymentMethod: string; paymentStatus: string };
  const data = (pedidosRaw as PedidoExtrato[]).map((p) => ({
    id: p.id,
    publicId: p.publicId,
    dataHora: p.placedAt.toISOString(),
    cliente: p.customerName,
    valorBrutoCentavos: p.totalCents,
    taxasCentavos: p.deliveryFeeCents,
    valorLiquidoCentavos: p.totalCents - p.deliveryFeeCents,
    metodoPagamento: p.paymentMethod,
    statusPagamento: p.paymentStatus,
  }));

  return {
    data,
    total,
    page,
    pageSize,
    totalFiltradoCentavos,
  };
}

// ─── exportarFinanceiro ───────────────────────────────────────────────────────

export type ExportarParams = {
  from: Date;
  to: Date;
  tipo: "resumo" | "completo";
  status?: string;
  metodo?: string;
};

export async function exportarFinanceiro(context: PartnerContext, params: ExportarParams): Promise<string> {
  const BOM = "\uFEFF";

  if (params.tipo === "resumo") {
    // Uma linha por dia com totais agregados
    type RowResumo = {
      data: Date | string;
      receita_bruta: bigint;
      receita_liquida: bigint;
      pedidos_pagos: bigint;
      pedidos_pendentes: bigint;
      cancelamentos: bigint;
    };

    const rows = await (prisma.$queryRaw`
      SELECT
        DATE(placed_at AT TIME ZONE 'America/Sao_Paulo') AS data,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_cents ELSE 0 END), 0) AS receita_bruta,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_cents - delivery_fee_cents ELSE 0 END), 0) AS receita_liquida,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS pedidos_pagos,
        COUNT(CASE WHEN payment_status = 'pending' AND status != 'cancelled' THEN 1 END) AS pedidos_pendentes,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelamentos
      FROM orders
      WHERE store_id = ${context.storeId}::uuid
        AND placed_at >= ${params.from}
        AND placed_at <= ${params.to}
      GROUP BY DATE(placed_at)
      ORDER BY data ASC
    ` as Promise<RowResumo[]>);

    const linhas = [
      "data,receitaBruta,receitaLiquida,pedidosPagos,pedidosPendentes,cancelamentos",
      ...rows.map((r) => {
        const data = r.data instanceof Date ? formatarData(r.data) : String(r.data);
        return `${data},${Number(r.receita_bruta)},${Number(r.receita_liquida)},${Number(r.pedidos_pagos)},${Number(r.pedidos_pendentes)},${Number(r.cancelamentos)}`;
      }),
    ];

    return BOM + linhas.join("\n");
  }

  // tipo === 'completo': todas as transações
  const pedidosRaw = await prisma.order.findMany({
    where: {
      storeId: context.storeId,
      placedAt: { gte: params.from, lte: params.to },
      ...(params.status ? { paymentStatus: params.status } : {}),
      ...(params.metodo ? { paymentMethod: params.metodo } : {}),
    },
    select: {
      publicId: true,
      placedAt: true,
      customerName: true,
      customerPhone: true,
      totalCents: true,
      deliveryFeeCents: true,
      paymentMethod: true,
      paymentStatus: true,
      status: true,
    },
    orderBy: { placedAt: "asc" },
  });

  // I-11: Proteção contra CSV/formula injection — mesma lógica de orders-service
  const escapeCsvField = (val: string): string => {
    const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];
    let sanitized = val;
    if (FORMULA_PREFIXES.some((prefix) => sanitized.startsWith(prefix))) {
      sanitized = `'${sanitized}`;
    }
    if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n") || sanitized !== val) {
      return `"${sanitized.replace(/"/g, '""')}"`;
    }
    return sanitized;
  };

  type PedidoCompleto = { publicId: string; placedAt: Date; customerName: string; customerPhone: string; totalCents: number; deliveryFeeCents: number; paymentMethod: string; paymentStatus: string; status: string };
  const linhas = [
    "id,dataHora,cliente,telefone,valorBruto,taxaEntrega,valorLiquido,metodoPagamento,statusPagamento,statusPedido",
    ...(pedidosRaw as PedidoCompleto[]).map((p) =>
      [
        escapeCsvField(p.publicId),
        p.placedAt.toISOString(),
        escapeCsvField(p.customerName),
        escapeCsvField(p.customerPhone),
        p.totalCents,
        p.deliveryFeeCents,
        p.totalCents - p.deliveryFeeCents,
        escapeCsvField(p.paymentMethod),
        escapeCsvField(p.paymentStatus),
        escapeCsvField(p.status),
      ].join(","),
    ),
  ];

  return BOM + linhas.join("\n");
}
