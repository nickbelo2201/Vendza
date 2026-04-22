import { InventoryMovementType, prisma, type Prisma } from "@vendza/database";

import { invalidateStorefrontCache } from "../storefront/cache.js";
import type { PartnerContext } from "./context.js";

// ─── Tipos internos ────────────────────────────────────────────────────────────

type MovimentacaoInput = {
  productId: string;
  tipo: string;
  quantidade: number;
  motivo?: string;
  dataHora?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapTipoMovimentacao(tipo: string): InventoryMovementType {
  if (tipo === "replenishment") return InventoryMovementType.replenishment;
  if (tipo === "cancellation") return InventoryMovementType.cancellation;
  return InventoryMovementType.manual_adjustment;
}

function calcularStatus(currentStock: number, safetyStock: number): "critico" | "atencao" | "ok" {
  if (currentStock <= safetyStock) return "critico";
  if (currentStock <= safetyStock * 1.5) return "atencao";
  return "ok";
}

// ─── getEstoque ───────────────────────────────────────────────────────────────

export async function getEstoque(context: PartnerContext) {
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  // Busca todos os itens de estoque com produto
  const itens = await prisma.inventoryItem.findMany({
    where: { storeId: context.storeId },
    include: {
      product: { select: { id: true, name: true } },
    },
  });

  if (itens.length === 0) return [];

  const productIds = itens.map((i: { productId: string }) => i.productId);

  // Calcula giro: quantidade vendida por produto nos últimos 30 dias (groupBy — elimina N+1)
  const vendasGiro = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: {
        storeId: context.storeId,
        status: { in: ["delivered", "completed"] },
      },
      createdAt: { gte: trintaDiasAtras },
    },
    _sum: { quantity: true },
  });

  type VendaGiroRow = (typeof vendasGiro)[number];
  const vendaMap = new Map<string, number>(vendasGiro.map((v: VendaGiroRow) => [v.productId, Number(v._sum.quantity ?? 0)]));

  // Calcula receita por produto (histórico completo) para curva ABC (groupBy — elimina N+1)
  const vendasAbc = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { in: productIds },
      order: {
        storeId: context.storeId,
        status: { in: ["delivered", "completed"] },
      },
    },
    _sum: { totalPriceCents: true, quantity: true },
  });

  // Calcula curva ABC baseada na receita histórica
  type VendaAbcRow = (typeof vendasAbc)[number];
  const receitaTotal = vendasAbc.reduce((acc: number, v: VendaAbcRow) => acc + Number(v._sum.totalPriceCents ?? 0), 0);

  // Ordena por receita desc para calcular acumulado
  const vendasAbcOrdenadas = [...vendasAbc].sort(
    (a, b) => Number(b._sum.totalPriceCents ?? 0) - Number(a._sum.totalPriceCents ?? 0),
  );

  const abcMap = new Map<string, "A" | "B" | "C">();

  if (receitaTotal === 0) {
    // Sem vendas no período: todos ficam C
    for (const v of vendasAbcOrdenadas) {
      abcMap.set(v.productId, "C");
    }
    // Produtos sem nenhuma venda também ficam C
    for (const id of productIds) {
      if (!abcMap.has(id)) abcMap.set(id, "C");
    }
  } else {
    let acumulado = 0;
    for (const v of vendasAbcOrdenadas) {
      acumulado += Number(v._sum.totalPriceCents ?? 0);
      const percentual = acumulado / receitaTotal;
      if (percentual <= 0.2) {
        abcMap.set(v.productId, "A");
      } else if (percentual <= 0.5) {
        abcMap.set(v.productId, "B");
      } else {
        abcMap.set(v.productId, "C");
      }
    }
    // Produtos sem nenhuma venda ficam C
    for (const id of productIds) {
      if (!abcMap.has(id)) abcMap.set(id, "C");
    }
  }

  type ItemEstoque = (typeof itens)[number];
  return itens.map((item: ItemEstoque) => {
    const quantidadeVendida: number = vendaMap.get(item.productId) ?? 0;
    const giro = item.currentStock === 0 ? 0 : quantidadeVendida / item.currentStock;

    return {
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      currentStock: item.currentStock,
      safetyStock: item.safetyStock,
      status: calcularStatus(item.currentStock, item.safetyStock),
      giro: Math.round(giro * 100) / 100,
      curvaABC: abcMap.get(item.productId) ?? "C",
    };
  });
}

// ─── registrarMovimentacao ────────────────────────────────────────────────────

export async function registrarMovimentacao(context: PartnerContext, input: MovimentacaoInput) {
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      storeId: context.storeId,
      productId: input.productId,
    },
  });

  if (!inventoryItem) return null;

  const tipoMapeado = mapTipoMovimentacao(input.tipo);

  // Calcula o delta real baseado no tipo de movimentação:
  // - replenishment (Entrada): soma ao estoque
  // - cancellation (Saída): subtrai do estoque
  // - manual_adjustment (Ajuste): define o valor absoluto do estoque
  if (tipoMapeado === InventoryMovementType.cancellation) {
    if (inventoryItem.currentStock - input.quantidade < 0) {
      throw Object.assign(new Error("Estoque insuficiente para registrar saída."), { statusCode: 400 });
    }
  }

  const quantityDelta =
    tipoMapeado === InventoryMovementType.replenishment
      ? input.quantidade
      : tipoMapeado === InventoryMovementType.cancellation
        ? -input.quantidade
        : input.quantidade; // manual_adjustment: delta absoluto positivo (ajuste de saldo)

  const resultado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // APPEND-ONLY: apenas cria o movimento, nunca atualiza/deleta
    const movimento = await tx.inventoryMovement.create({
      data: {
        inventoryItemId: inventoryItem.id,
        storeId: context.storeId,
        type: tipoMapeado,
        quantityDelta,
        reason: input.motivo ?? "",
        createdByUserId: context.storeUserId,
        ...(input.dataHora ? { createdAt: new Date(input.dataHora) } : {}),
      },
    });

    // Atualiza o estoque com o delta correto por tipo:
    // manual_adjustment define o valor absoluto; os demais aplicam delta incremental
    const itemAtualizado =
      tipoMapeado === InventoryMovementType.manual_adjustment
        ? await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { currentStock: { set: input.quantidade } },
          })
        : await tx.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: { currentStock: { increment: quantityDelta } },
          });

    return {
      id: movimento.id,
      productId: input.productId,
      quantityDelta: movimento.quantityDelta,
      reason: movimento.reason,
      currentStock: itemAtualizado.currentStock,
      createdAt: movimento.createdAt.toISOString(),
    };
  });

  // Invalida cache do storefront: movimentação pode tornar produto disponível/indisponível
  await invalidateStorefrontCache(context.storeId);

  return resultado;
}

// ─── getHistoricoEstoque ──────────────────────────────────────────────────────

export async function getHistoricoEstoque(
  context: PartnerContext,
  productId: string,
  page: number,
  pageSize: number,
) {
  // Verifica que o item pertence à loja
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      storeId: context.storeId,
      productId,
    },
  });

  if (!inventoryItem) return null;

  const skip = (page - 1) * pageSize;

  const [movimentos, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: { inventoryItemId: inventoryItem.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({
      where: { inventoryItemId: inventoryItem.id },
    }),
  ]);

  return {
    data: movimentos.map((m: typeof movimentos[number]) => ({
      id: m.id,
      type: m.type,
      quantityDelta: m.quantityDelta,
      reason: m.reason,
      createdAt: m.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  };
}
