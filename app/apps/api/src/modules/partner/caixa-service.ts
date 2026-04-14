import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

export async function abrirCaixa(
  context: PartnerContext,
  saldoInicial: number,
  observacoes?: string | null,
) {
  // Verificar se já há turno aberto
  const turnoAberto = await prisma.caixaTurno.findFirst({
    where: { storeId: context.storeId, fechouEm: null },
  });
  if (turnoAberto) {
    throw new Error("Já existe um turno de caixa aberto.");
  }

  return prisma.caixaTurno.create({
    data: {
      storeId: context.storeId,
      abertoPor: context.storeUserId,
      saldoInicial,
      observacoes: observacoes ?? null,
    },
  });
}

export async function fecharCaixa(
  context: PartnerContext,
  turnoId: string,
  saldoFinal: number,
  observacoes?: string | null,
) {
  const turno = await prisma.caixaTurno.findFirst({
    where: { id: turnoId, storeId: context.storeId, fechouEm: null },
  });
  if (!turno) {
    throw new Error("Turno não encontrado ou já encerrado.");
  }

  return prisma.caixaTurno.update({
    where: { id: turnoId },
    data: {
      fechouEm: new Date(),
      fechadoPor: context.storeUserId,
      saldoFinal,
      observacoes: observacoes ?? turno.observacoes,
    },
  });
}

export async function getCaixaAtual(context: PartnerContext) {
  const turno = await prisma.caixaTurno.findFirst({
    where: { storeId: context.storeId, fechouEm: null },
    orderBy: { abreuEm: "desc" },
  });
  return turno ?? null;
}

export type ResumoTurno = {
  turno: {
    id: string;
    abreuEm: Date;
    fechouEm: Date | null;
    saldoInicial: number;
    saldoFinal: number | null;
    observacoes: string | null;
  };
  totalPedidos: number;
  totalVendasCents: number;
  porMetodo: { metodo: string; totalCents: number; quantidade: number }[];
};

export async function getResumoTurno(
  context: PartnerContext,
  turnoId: string,
): Promise<ResumoTurno> {
  const turno = await prisma.caixaTurno.findFirst({
    where: { id: turnoId, storeId: context.storeId },
  });
  if (!turno) {
    throw new Error("Turno não encontrado.");
  }

  const fimPeriodo = turno.fechouEm ?? new Date();

  const pedidos = await prisma.order.findMany({
    where: {
      storeId: context.storeId,
      placedAt: { gte: turno.abreuEm, lte: fimPeriodo },
      status: { not: "cancelled" },
    },
    select: { totalCents: true, paymentMethod: true },
  });

  const totalVendasCents = pedidos.reduce((acc: number, p: { totalCents: number; paymentMethod: string }) => acc + p.totalCents, 0);

  const metodoMap = new Map<string, { totalCents: number; quantidade: number }>();
  for (const p of pedidos as { totalCents: number; paymentMethod: string }[]) {
    const key = p.paymentMethod;
    const existing = metodoMap.get(key) ?? { totalCents: 0, quantidade: 0 };
    metodoMap.set(key, {
      totalCents: existing.totalCents + p.totalCents,
      quantidade: existing.quantidade + 1,
    });
  }

  const porMetodo = Array.from(metodoMap.entries()).map(([metodo, dados]) => ({
    metodo,
    ...dados,
  }));

  return {
    turno: {
      id: turno.id,
      abreuEm: turno.abreuEm,
      fechouEm: turno.fechouEm,
      saldoInicial: turno.saldoInicial,
      saldoFinal: turno.saldoFinal,
      observacoes: turno.observacoes,
    },
    totalPedidos: pedidos.length,
    totalVendasCents,
    porMetodo,
  };
}

export async function getHistoricoCaixa(
  context: PartnerContext,
  limit = 20,
  offset = 0,
) {
  const [turnos, total] = await Promise.all([
    prisma.caixaTurno.findMany({
      where: { storeId: context.storeId },
      orderBy: { abreuEm: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.caixaTurno.count({ where: { storeId: context.storeId } }),
  ]);
  return { turnos, total };
}
