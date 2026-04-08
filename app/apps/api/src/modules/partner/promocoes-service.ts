import { prisma } from "@vendza/database";

// ─── Tipos de retorno ────────────────────────────────────────────────────────

type ProdutoPromo = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number;
  descontoPercent: number;
  currentStock: number;
};

type ProdutoAlerta = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number | null;
  currentStock: number;
  safetyStock?: number;
};

// ─── Tipos internos dos resultados Prisma ────────────────────────────────────

type ProdutoRow = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
  inventoryItem: { currentStock: number; safetyStock?: number } | null;
};

type InventarioRow = {
  id: string;
  currentStock: number;
  safetyStock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    listPriceCents: number;
    salePriceCents: number | null;
    isAvailable: boolean;
  };
};

// ─── Central de Promoções ────────────────────────────────────────────────────

export async function getPromocoes(storeId: string) {
  // 1. Produtos em promoção: salePriceCents definido e menor que listPriceCents
  const produtosEmPromocao = (await prisma.product.findMany({
    where: {
      storeId,
      isAvailable: true,
      salePriceCents: { not: null },
    },
    include: {
      inventoryItem: {
        select: { currentStock: true, safetyStock: true },
      },
    },
    orderBy: { name: "asc" },
  })) as ProdutoRow[];

  const emPromocao: ProdutoPromo[] = produtosEmPromocao
    .filter((p: ProdutoRow) => p.salePriceCents !== null && p.salePriceCents < p.listPriceCents)
    .map((p: ProdutoRow) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      listPriceCents: p.listPriceCents,
      salePriceCents: p.salePriceCents as number,
      descontoPercent: Math.round((1 - (p.salePriceCents as number) / p.listPriceCents) * 100),
      currentStock: p.inventoryItem?.currentStock ?? 0,
    }));

  // 2. Alertas de produtos parados: sem vendas nos últimos 14 dias
  const quatorze = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const vendidosIds = await prisma.orderItem.findMany({
    where: {
      product: { storeId },
      order: { createdAt: { gte: quatorze } },
    },
    select: { productId: true },
    distinct: ["productId"],
  });

  const idsVendidos: string[] = vendidosIds.map((x: { productId: string }) => x.productId);

  const produtosParados = (await prisma.product.findMany({
    where: {
      storeId,
      isAvailable: true,
      id: { notIn: idsVendidos.length > 0 ? idsVendidos : ["__nenhum__"] },
    },
    include: {
      inventoryItem: {
        select: { currentStock: true },
      },
    },
    orderBy: { name: "asc" },
  })) as ProdutoRow[];

  const alertasParado: ProdutoAlerta[] = produtosParados.map((p: ProdutoRow) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    listPriceCents: p.listPriceCents,
    salePriceCents: p.salePriceCents,
    currentStock: p.inventoryItem?.currentStock ?? 0,
  }));

  // 3. Alertas de estoque alto: currentStock > 2 * safetyStock (safetyStock > 0)
  const itensEstoqueAlto = (await prisma.inventoryItem.findMany({
    where: {
      storeId,
      safetyStock: { gt: 0 },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          listPriceCents: true,
          salePriceCents: true,
          isAvailable: true,
        },
      },
    },
    orderBy: { currentStock: "desc" },
  })) as InventarioRow[];

  const alertasEstoqueAlto: ProdutoAlerta[] = itensEstoqueAlto
    .filter((item: InventarioRow) => item.currentStock > item.safetyStock * 2 && item.product.isAvailable)
    .map((item: InventarioRow) => ({
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      listPriceCents: item.product.listPriceCents,
      salePriceCents: item.product.salePriceCents,
      currentStock: item.currentStock,
      safetyStock: item.safetyStock,
    }));

  return { emPromocao, alertasParado, alertasEstoqueAlto };
}
