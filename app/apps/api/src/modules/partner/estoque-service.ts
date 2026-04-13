import { InventoryMovementType, prisma } from "@vendza/database";

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

  // Calcula giro: quantidade vendida por produto nos últimos 30 dias
  const vendasPorProduto = await Promise.all(
    productIds.map(async (productId: string) => {
      const agg = await prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          productId,
          order: {
            storeId: context.storeId,
            placedAt: { gte: trintaDiasAtras },
          },
        },
      });
      return { productId, quantidadeVendida: agg._sum.quantity ?? 0 };
    }),
  );

  const vendaMap = new Map(vendasPorProduto.map((v) => [v.productId, v.quantidadeVendida]));

  // Calcula receita por produto nos últimos 30 dias para curva ABC
  const receitaPorProduto = await Promise.all(
    productIds.map(async (productId: string) => {
      const agg = await prisma.orderItem.aggregate({
        _sum: { totalPriceCents: true },
        where: {
          productId,
          order: {
            storeId: context.storeId,
            placedAt: { gte: trintaDiasAtras },
          },
        },
      });
      return { productId, receita: agg._sum.totalPriceCents ?? 0 };
    }),
  );

  // Calcula curva ABC
  const receitaTotal = receitaPorProduto.reduce((acc, r) => acc + r.receita, 0);

  // Ordena por receita desc para calcular acumulado
  const receitaOrdenada = [...receitaPorProduto].sort((a, b) => b.receita - a.receita);

  const abcMap = new Map<string, "A" | "B" | "C">();

  if (receitaTotal === 0) {
    // Sem vendas no período: todos ficam C
    for (const r of receitaOrdenada) {
      abcMap.set(r.productId, "C");
    }
  } else {
    let acumulado = 0;
    for (const r of receitaOrdenada) {
      acumulado += r.receita;
      const percentual = acumulado / receitaTotal;
      if (percentual <= 0.2) {
        abcMap.set(r.productId, "A");
      } else if (percentual <= 0.5) {
        abcMap.set(r.productId, "B");
      } else {
        abcMap.set(r.productId, "C");
      }
    }
  }

  return itens.map((item: typeof itens[number]) => {
    const quantidadeVendida = vendaMap.get(item.productId) ?? 0;
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

  const resultado = await prisma.$transaction(async (tx: any) => {
    // APPEND-ONLY: apenas cria o movimento, nunca atualiza/deleta
    const movimento = await tx.inventoryMovement.create({
      data: {
        inventoryItemId: inventoryItem.id,
        storeId: context.storeId,
        type: tipoMapeado,
        quantityDelta: input.quantidade,
        reason: input.motivo ?? "",
        createdByUserId: context.storeUserId,
        ...(input.dataHora ? { createdAt: new Date(input.dataHora) } : {}),
      },
    });

    // Atualiza o estoque atual no mesmo transaction
    const itemAtualizado = await tx.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        currentStock: {
          increment: input.quantidade,
        },
      },
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
