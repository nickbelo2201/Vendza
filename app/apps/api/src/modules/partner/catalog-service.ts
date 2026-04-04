import { InventoryMovementType, prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

type ProductUpsertInput = {
  name: string;
  slug: string;
  categoryId?: string;
  listPriceCents: number;
  salePriceCents?: number;
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

export async function listPartnerProducts(context: PartnerContext) {
  const products = await prisma.product.findMany({
    where: { storeId: context.storeId },
    orderBy: { createdAt: "desc" },
    include: {
      category: {
        select: { slug: true },
      },
    },
  });

  return products.map(mapProduct);
}

export async function createPartnerProduct(context: PartnerContext, input: ProductUpsertInput) {
  const product = await prisma.$transaction(async (tx: any) => {
    const created = await tx.product.create({
      data: {
        storeId: context.storeId,
        categoryId: input.categoryId ?? null,
        name: input.name,
        slug: input.slug,
        description: "",
        imageUrl: null,
        listPriceCents: input.listPriceCents,
        salePriceCents: input.salePriceCents ?? input.listPriceCents,
        isAvailable: true,
        isFeatured: false,
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

  const movement = await prisma.$transaction(async (tx: any) => {
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
