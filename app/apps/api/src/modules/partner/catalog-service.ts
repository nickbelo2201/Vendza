import { InventoryMovementType, prisma, type Prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

// ─── Tipos de categoria ───────────────────────────────────────────────────────

type CategoryCreateInput = {
  name: string;
  slug: string;
  isActive?: boolean;
};

type CategoryPatchInput = Partial<{
  name: string;
  slug: string;
  isActive: boolean;
}>;

function mapCategory(category: {
  id: string;
  storeId: string;
  parentCategoryId: string | null;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  children?: Array<{
    id: string;
    storeId: string;
    parentCategoryId: string | null;
    name: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) {
  return {
    id: category.id,
    storeId: category.storeId,
    parentCategoryId: category.parentCategoryId,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    children: category.children?.map((c) => ({
      id: c.id,
      storeId: c.storeId,
      parentCategoryId: c.parentCategoryId,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };
}

export async function listPartnerCategories(context: PartnerContext) {
  const categories = await prisma.category.findMany({
    where: { storeId: context.storeId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      children: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  return categories.map(mapCategory);
}

export async function createPartnerCategory(context: PartnerContext, input: CategoryCreateInput) {
  const category = await prisma.category.create({
    data: {
      storeId: context.storeId,
      name: input.name,
      slug: input.slug,
      isActive: input.isActive ?? true,
      sortOrder: 0,
    },
  });

  return mapCategory(category);
}

export async function updatePartnerCategory(context: PartnerContext, id: string, input: CategoryPatchInput) {
  const existing = await prisma.category.findFirst({
    where: { id, storeId: context.storeId },
  });

  if (!existing) {
    return null;
  }

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return mapCategory(category);
}

export async function deletePartnerCategory(
  context: PartnerContext,
  id: string,
): Promise<{ deleted: true } | { error: string }> {
  const existing = await prisma.category.findFirst({
    where: { id, storeId: context.storeId },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) {
    return { error: "Categoria nao encontrada." };
  }

  if (existing._count.products > 0) {
    return {
      error: `Nao e possivel excluir a categoria "${existing.name}" pois ela possui ${existing._count.products} produto(s) vinculado(s). Mova ou exclua os produtos antes de remover a categoria.`,
    };
  }

  await prisma.category.delete({ where: { id: existing.id } });

  return { deleted: true };
}

type ProductUpsertInput = {
  name: string;
  slug: string;
  categoryId?: string;
  listPriceCents: number;
  salePriceCents?: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  barcode?: string | null;
};

type ProductPatchInput = Partial<ProductUpsertInput>;

type InventoryMovementInput = {
  productId: string;
  quantityDelta: number;
  reason: string;
};

function mapProduct(product: {
  id: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  barcode?: string | null;
  category: { slug: string } | null;
}) {
  return {
    id: product.id,
    categoryId: product.categoryId,
    categorySlug: product.category?.slug ?? null,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    imageUrl: product.imageUrl,
    listPriceCents: product.listPriceCents,
    salePriceCents: product.salePriceCents ?? product.listPriceCents,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    barcode: product.barcode ?? null,
    offer:
      product.salePriceCents !== null && product.salePriceCents < product.listPriceCents,
  };
}

function mapInventoryItem(item: {
  id: string;
  productId: string;
  currentStock: number;
  safetyStock: number;
  product: {
    id: string;
    categoryId: string | null;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    listPriceCents: number;
    salePriceCents: number | null;
    isAvailable: boolean;
    isFeatured: boolean;
    category: { slug: string } | null;
  };
}) {
  return {
    id: item.id,
    productId: item.productId,
    currentStock: item.currentStock,
    lowStockThreshold: item.safetyStock,
    product: mapProduct(item.product),
  };
}

async function findStoreProduct(context: PartnerContext, id: string) {
  return prisma.product.findFirst({
    where: {
      storeId: context.storeId,
      OR: [{ id }, { slug: id }],
    },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });
}

export type ListProductsFilters = {
  busca?: string;
  categoriaId?: string;
  subcategoriaId?: string;
  pagina?: number;
  limite?: number;
};

export async function listPartnerProducts(context: PartnerContext, filters?: ListProductsFilters) {
  const pagina = filters?.pagina ?? 1;
  const limite = filters?.limite ?? 20;
  const skip = (pagina - 1) * limite;

  const where: Record<string, unknown> = { storeId: context.storeId };

  // Busca por nome (ILIKE)
  if (filters?.busca) {
    where.name = { contains: filters.busca, mode: "insensitive" };
  }

  // Filtro por subcategoria (direto)
  if (filters?.subcategoriaId) {
    where.categoryId = filters.subcategoriaId;
  } else if (filters?.categoriaId) {
    // Filtro por categoria pai: inclui a própria categoria + filhas
    const filhas = await prisma.category.findMany({
      where: { storeId: context.storeId, parentCategoryId: filters.categoriaId },
      select: { id: true },
    });
    const ids = [filters.categoriaId, ...filhas.map((f: { id: string }) => f.id)];
    where.categoryId = { in: ids };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limite,
      include: {
        category: {
          select: { slug: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    produtos: products.map(mapProduct),
    total,
    pagina,
    limite,
    totalPaginas: Math.ceil(total / limite),
  };
}

export async function findProductByBarcode(context: PartnerContext, barcode: string) {
  const product = await prisma.product.findFirst({
    where: { storeId: context.storeId, barcode },
    include: { category: { select: { slug: true } } },
  });
  return product ? mapProduct(product) : null;
}

export async function createPartnerProduct(context: PartnerContext, input: ProductUpsertInput) {
  const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.product.create({
      data: {
        storeId: context.storeId,
        categoryId: input.categoryId ?? null,
        name: input.name,
        slug: input.slug,
        description: "",
        imageUrl: input.imageUrl ?? null,
        listPriceCents: input.listPriceCents,
        salePriceCents: input.salePriceCents ?? input.listPriceCents,
        isAvailable: input.isAvailable ?? true,
        isFeatured: input.isFeatured ?? false,
        barcode: input.barcode ?? null,
      },
      include: {
        category: {
          select: { slug: true },
        },
      },
    });

    await tx.inventoryItem.upsert({
      where: { productId: created.id },
      update: {
        storeId: context.storeId,
      },
      create: {
        storeId: context.storeId,
        productId: created.id,
        currentStock: 0,
        safetyStock: 0,
      },
    });

    return created;
  });

  return mapProduct(product);
}

export async function updatePartnerProduct(context: PartnerContext, id: string, input: ProductPatchInput) {
  const existing = await findStoreProduct(context, id);
  if (!existing) {
    return null;
  }

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.listPriceCents !== undefined ? { listPriceCents: input.listPriceCents } : {}),
      ...(input.salePriceCents !== undefined ? { salePriceCents: input.salePriceCents } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
      ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
      ...(input.barcode !== undefined ? { barcode: input.barcode } : {}),
    },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  return mapProduct(product);
}

export async function updateProductAvailability(context: PartnerContext, id: string, isAvailable: boolean) {
  const existing = await findStoreProduct(context, id);
  if (!existing) {
    return null;
  }

  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { isAvailable },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  return mapProduct(product);
}

export async function getInventory(context: PartnerContext) {
  const inventory = await prisma.inventoryItem.findMany({
    where: { storeId: context.storeId },
    orderBy: { updatedAt: "desc" },
    include: {
      product: {
        include: {
          category: {
            select: { slug: true },
          },
        },
      },
    },
  });

  return inventory.map(mapInventoryItem);
}

export async function deletePartnerProduct(context: PartnerContext, productId: string) {
  const existing = await findStoreProduct(context, productId);
  if (!existing) {
    return null;
  }

  // Soft-delete: marcar como indisponível para preservar InventoryMovement (append-only).
  // Não deletar InventoryItem nem Product para manter integridade do histórico.
  const product = await prisma.product.update({
    where: { id: existing.id },
    data: { isAvailable: false },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  return mapProduct(product);
}

export async function createInventoryMovement(context: PartnerContext, input: InventoryMovementInput) {
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      storeId: context.storeId,
      productId: input.productId,
    },
  });

  if (!inventoryItem) {
    return null;
  }

  const movement = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updatedItem = await tx.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        currentStock: {
          increment: input.quantityDelta,
        },
      },
    });

    const created = await tx.inventoryMovement.create({
      data: {
        inventoryItemId: inventoryItem.id,
        storeId: context.storeId,
        type: InventoryMovementType.manual_adjustment,
        quantityDelta: input.quantityDelta,
        reason: input.reason,
        createdByUserId: context.storeUserId,
      },
    });

    return {
      id: created.id,
      productId: input.productId,
      quantityDelta: created.quantityDelta,
      reason: created.reason,
      currentStock: updatedItem.currentStock,
      createdAt: created.createdAt.toISOString(),
    };
  });

  return movement;
}
