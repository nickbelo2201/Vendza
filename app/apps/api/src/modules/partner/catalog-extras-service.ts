import { prisma, type Prisma } from "@vendza/database";

import { invalidateStorefrontCache } from "../storefront/cache.js";
import type { PartnerContext } from "./context.js";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ComboItemInput = {
  productId: string;
  quantity: number;
};

type ComboComplementGroupInput = {
  complementGroupId: string;
  sortOrder?: number;
  isRequiredOverride?: boolean;
  minSelectionOverride?: number;
  maxSelectionOverride?: number;
};

type ComboExtraInput = {
  extraId: string;
  sortOrder?: number;
};

type ComboCreateInput = {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
  isActive?: boolean;
  items: ComboItemInput[];
  complementGroups?: ComboComplementGroupInput[];
  extras?: ComboExtraInput[];
};

type ComboPatchInput = Partial<{
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  items: ComboItemInput[];
  complementGroups: ComboComplementGroupInput[];
  extras: ComboExtraInput[];
}>;

type ComplementGroupCreateInput = {
  name: string;
  description?: string | null;
  minSelection?: number;
  maxSelection?: number;
  isRequired?: boolean;
  isActive?: boolean;
};

type ComplementGroupPatchInput = Partial<{
  name: string;
  description: string | null;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  isActive: boolean;
}>;

type ComplementCreateInput = {
  complementGroupId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  additionalPriceCents?: number;
  isAvailable?: boolean;
};

type ComplementPatchInput = Partial<{
  complementGroupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isAvailable: boolean;
}>;

type ExtraCreateInput = {
  name: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  isAvailable?: boolean;
};

type ExtraPatchInput = Partial<{
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
}>;

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapComboItem(item: {
  id: string;
  comboId: string;
  productId: string;
  quantity: number;
  product: { id: string; name: string; slug: string; listPriceCents: number };
}) {
  return {
    id: item.id,
    comboId: item.comboId,
    productId: item.productId,
    quantity: item.quantity,
    productName: item.product.name,
    productSlug: item.product.slug,
    productListPriceCents: item.product.listPriceCents,
  };
}

function mapCombo(combo: {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    comboId: string;
    productId: string;
    quantity: number;
    product: { id: string; name: string; slug: string; listPriceCents: number };
  }>;
  complementGroups?: Array<{
    id: string;
    sortOrder: number;
    isRequiredOverride: boolean | null;
    minSelectionOverride: number | null;
    maxSelectionOverride: number | null;
    complementGroup: {
      id: string;
      name: string;
      description: string | null;
      minSelection: number;
      maxSelection: number;
      isRequired: boolean;
      complements: Array<{
        id: string;
        name: string;
        imageUrl: string | null;
        additionalPriceCents: number;
        isAvailable: boolean;
      }>;
    };
  }>;
  extras?: Array<{
    id: string;
    extraId: string;
    sortOrder: number;
    extra: {
      name: string;
      description: string | null;
      priceCents: number;
      imageUrl: string | null;
      isAvailable: boolean;
    };
  }>;
}) {
  return {
    id: combo.id,
    storeId: combo.storeId,
    name: combo.name,
    slug: combo.slug,
    description: combo.description,
    imageUrl: combo.imageUrl,
    priceCents: combo.priceCents,
    isActive: combo.isActive,
    createdAt: combo.createdAt.toISOString(),
    updatedAt: combo.updatedAt.toISOString(),
    items: combo.items.map(mapComboItem),
    complementGroups:
      combo.complementGroups
        ?.map((ccg) => ({
          id: ccg.id,
          groupId: ccg.complementGroup.id,
          name: ccg.complementGroup.name,
          description: ccg.complementGroup.description,
          minSelection: ccg.minSelectionOverride ?? ccg.complementGroup.minSelection,
          maxSelection: ccg.maxSelectionOverride ?? ccg.complementGroup.maxSelection,
          isRequired: ccg.isRequiredOverride ?? ccg.complementGroup.isRequired,
          sortOrder: ccg.sortOrder,
          complements: ccg.complementGroup.complements
            .filter((c) => c.isAvailable)
            .map((c) => ({
              id: c.id,
              name: c.name,
              imageUrl: c.imageUrl,
              additionalPriceCents: c.additionalPriceCents,
            })),
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder) ?? [],
    extras:
      combo.extras
        ?.map((ce) => ({
          id: ce.id,
          extraId: ce.extraId,
          name: ce.extra.name,
          description: ce.extra.description,
          priceCents: ce.extra.priceCents,
          imageUrl: ce.extra.imageUrl,
          isAvailable: ce.extra.isAvailable,
          sortOrder: ce.sortOrder,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder) ?? [],
  };
}

function mapComplementGroup(group: {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { complements: number };
}) {
  return {
    id: group.id,
    storeId: group.storeId,
    name: group.name,
    description: group.description,
    minSelection: group.minSelection,
    maxSelection: group.maxSelection,
    isRequired: group.isRequired,
    isActive: group.isActive,
    complementsCount: group._count?.complements ?? 0,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

function mapComplement(complement: {
  id: string;
  storeId: string;
  complementGroupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: complement.id,
    storeId: complement.storeId,
    complementGroupId: complement.complementGroupId,
    name: complement.name,
    description: complement.description,
    imageUrl: complement.imageUrl,
    additionalPriceCents: complement.additionalPriceCents,
    isAvailable: complement.isAvailable,
    createdAt: complement.createdAt.toISOString(),
    updatedAt: complement.updatedAt.toISOString(),
  };
}

function mapExtra(extra: {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: extra.id,
    storeId: extra.storeId,
    name: extra.name,
    description: extra.description,
    priceCents: extra.priceCents,
    imageUrl: extra.imageUrl,
    isAvailable: extra.isAvailable,
    createdAt: extra.createdAt.toISOString(),
    updatedAt: extra.updatedAt.toISOString(),
  };
}

// ─── Combos ───────────────────────────────────────────────────────────────────

const comboInclude = {
  items: {
    include: {
      product: {
        select: { id: true, name: true, slug: true, listPriceCents: true },
      },
    },
  },
  complementGroups: {
    include: {
      complementGroup: {
        include: { complements: true },
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  extras: {
    orderBy: { sortOrder: "asc" as const },
    include: { extra: true },
  },
} as const;

async function validateComboItemsOwnership(
  tx: Prisma.TransactionClient,
  storeId: string,
  items: ComboItemInput[],
) {
  if (items.length === 0) {
    throw new Error("Combo precisa ter ao menos um item.");
  }
  const productIds = items.map((it) => it.productId);
  const found = await tx.product.findMany({
    where: { id: { in: productIds }, storeId },
    select: { id: true },
  });
  if (found.length !== new Set(productIds).size) {
    throw new Error("Um ou mais produtos do combo não pertencem a esta loja.");
  }
}

async function validateComplementGroupsOwnership(
  tx: Prisma.TransactionClient,
  storeId: string,
  complementGroups: ComboComplementGroupInput[],
) {
  const ids = complementGroups.map((cg) => cg.complementGroupId);
  const found = await tx.complementGroup.findMany({
    where: { id: { in: ids }, storeId },
    select: { id: true },
  });
  if (found.length !== new Set(ids).size) {
    throw new Error(
      "Um ou mais grupos de complementos não pertencem a esta loja.",
    );
  }
}

async function validateExtrasOwnership(
  tx: Prisma.TransactionClient,
  storeId: string,
  extras: ComboExtraInput[],
) {
  const ids = extras.map((e) => e.extraId);
  const found = await tx.extra.findMany({
    where: { id: { in: ids }, storeId },
    select: { id: true },
  });
  if (found.length !== new Set(ids).size) {
    throw new Error("Um ou mais extras não pertencem a esta loja.");
  }
}

export async function listCombos(context: PartnerContext) {
  const combos = await prisma.combo.findMany({
    where: { storeId: context.storeId },
    orderBy: { createdAt: "desc" },
    include: comboInclude,
  });
  return combos.map(mapCombo);
}

export async function createCombo(context: PartnerContext, input: ComboCreateInput) {
  const combo = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await validateComboItemsOwnership(tx, context.storeId, input.items);

    if (input.complementGroups && input.complementGroups.length > 0) {
      await validateComplementGroupsOwnership(
        tx,
        context.storeId,
        input.complementGroups,
      );
    }

    if (input.extras && input.extras.length > 0) {
      await validateExtrasOwnership(tx, context.storeId, input.extras);
    }

    const created = await tx.combo.create({
      data: {
        storeId: context.storeId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        priceCents: input.priceCents,
        isActive: input.isActive ?? true,
        items: {
          create: input.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
          })),
        },
      },
      include: comboInclude,
    });

    if (input.complementGroups && input.complementGroups.length > 0) {
      await tx.comboComplementGroup.createMany({
        data: input.complementGroups.map((cg) => ({
          comboId: created.id,
          complementGroupId: cg.complementGroupId,
          sortOrder: cg.sortOrder ?? 0,
          isRequiredOverride: cg.isRequiredOverride ?? null,
          minSelectionOverride: cg.minSelectionOverride ?? null,
          maxSelectionOverride: cg.maxSelectionOverride ?? null,
        })),
      });
    }

    if (input.extras && input.extras.length > 0) {
      await tx.comboExtra.createMany({
        data: input.extras.map((e, idx) => ({
          comboId: created.id,
          extraId: e.extraId,
          sortOrder: e.sortOrder ?? idx,
        })),
      });
    }

    // Re-fetch com complementGroups e extras incluídos
    return tx.combo.findUniqueOrThrow({
      where: { id: created.id },
      include: comboInclude,
    });
  });

  await invalidateStorefrontCache(context.storeId);

  return mapCombo(combo);
}

export async function updateCombo(
  context: PartnerContext,
  id: string,
  input: ComboPatchInput,
) {
  const existing = await prisma.combo.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  const combo = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (input.items !== undefined) {
      await validateComboItemsOwnership(tx, context.storeId, input.items);
      await tx.comboItem.deleteMany({ where: { comboId: existing.id } });
      await tx.comboItem.createMany({
        data: input.items.map((it) => ({
          comboId: existing.id,
          productId: it.productId,
          quantity: it.quantity,
        })),
      });
    }

    if (input.complementGroups !== undefined) {
      if (input.complementGroups.length > 0) {
        await validateComplementGroupsOwnership(
          tx,
          context.storeId,
          input.complementGroups,
        );
      }
      await tx.comboComplementGroup.deleteMany({ where: { comboId: existing.id } });
      if (input.complementGroups.length > 0) {
        await tx.comboComplementGroup.createMany({
          data: input.complementGroups.map((cg) => ({
            comboId: existing.id,
            complementGroupId: cg.complementGroupId,
            sortOrder: cg.sortOrder ?? 0,
            isRequiredOverride: cg.isRequiredOverride ?? null,
            minSelectionOverride: cg.minSelectionOverride ?? null,
            maxSelectionOverride: cg.maxSelectionOverride ?? null,
          })),
        });
      }
    }

    if (input.extras !== undefined) {
      if (input.extras.length > 0) {
        await validateExtrasOwnership(tx, context.storeId, input.extras);
      }
      await tx.comboExtra.deleteMany({ where: { comboId: existing.id } });
      if (input.extras.length > 0) {
        await tx.comboExtra.createMany({
          data: input.extras.map((e, idx) => ({
            comboId: existing.id,
            extraId: e.extraId,
            sortOrder: e.sortOrder ?? idx,
          })),
        });
      }
    }

    return tx.combo.update({
      where: { id: existing.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: comboInclude,
    });
  });

  await invalidateStorefrontCache(context.storeId);

  return mapCombo(combo);
}

export async function toggleComboActive(
  context: PartnerContext,
  id: string,
  isActive: boolean,
) {
  const existing = await prisma.combo.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  const combo = await prisma.combo.update({
    where: { id: existing.id },
    data: { isActive },
    include: comboInclude,
  });

  await invalidateStorefrontCache(context.storeId);

  return mapCombo(combo);
}

export async function deleteCombo(
  context: PartnerContext,
  id: string,
): Promise<{ deleted: true } | { error: string }> {
  const existing = await prisma.combo.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return { error: "Combo não encontrado." };
  }

  await prisma.combo.delete({ where: { id: existing.id } });

  await invalidateStorefrontCache(context.storeId);

  return { deleted: true };
}

// ─── Grupos de complementos ───────────────────────────────────────────────────

export async function listComplementGroups(context: PartnerContext) {
  const groups = await prisma.complementGroup.findMany({
    where: { storeId: context.storeId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { complements: true } } },
  });
  return groups.map(mapComplementGroup);
}

export async function createComplementGroup(
  context: PartnerContext,
  input: ComplementGroupCreateInput,
) {
  const minSelection = input.minSelection ?? 0;
  const maxSelection = input.maxSelection ?? 1;

  if (maxSelection < minSelection) {
    throw new Error("maxSelection não pode ser menor que minSelection.");
  }

  const group = await prisma.complementGroup.create({
    data: {
      storeId: context.storeId,
      name: input.name,
      description: input.description ?? null,
      minSelection,
      maxSelection,
      isRequired: input.isRequired ?? false,
      isActive: input.isActive ?? true,
    },
    include: { _count: { select: { complements: true } } },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapComplementGroup(group);
}

export async function updateComplementGroup(
  context: PartnerContext,
  id: string,
  input: ComplementGroupPatchInput,
) {
  const existing = await prisma.complementGroup.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  const nextMin = input.minSelection ?? existing.minSelection;
  const nextMax = input.maxSelection ?? existing.maxSelection;
  if (nextMax < nextMin) {
    throw new Error("maxSelection não pode ser menor que minSelection.");
  }

  const group = await prisma.complementGroup.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.minSelection !== undefined ? { minSelection: input.minSelection } : {}),
      ...(input.maxSelection !== undefined ? { maxSelection: input.maxSelection } : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    include: { _count: { select: { complements: true } } },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapComplementGroup(group);
}

export async function deleteComplementGroup(
  context: PartnerContext,
  id: string,
): Promise<{ deleted: true } | { error: string }> {
  const existing = await prisma.complementGroup.findFirst({
    where: { id, storeId: context.storeId },
    include: { _count: { select: { complements: true } } },
  });
  if (!existing) {
    return { error: "Grupo de complementos não encontrado." };
  }

  if (existing._count.complements > 0) {
    return {
      error: `Não é possível excluir o grupo "${existing.name}" pois ele possui ${existing._count.complements} complemento(s) vinculado(s). Remova os complementos antes de excluir o grupo.`,
    };
  }

  await prisma.complementGroup.delete({ where: { id: existing.id } });

  await invalidateStorefrontCache(context.storeId);

  return { deleted: true };
}

// ─── Complementos ─────────────────────────────────────────────────────────────

export async function listComplements(context: PartnerContext, groupId?: string) {
  const where: Record<string, unknown> = { storeId: context.storeId };
  if (groupId) {
    where.complementGroupId = groupId;
  }

  const complements = await prisma.complement.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return complements.map(mapComplement);
}

export async function createComplement(
  context: PartnerContext,
  input: ComplementCreateInput,
) {
  const group = await prisma.complementGroup.findFirst({
    where: { id: input.complementGroupId, storeId: context.storeId },
    select: { id: true },
  });
  if (!group) {
    throw new Error("Grupo de complementos não encontrado ou não pertence a esta loja.");
  }

  const complement = await prisma.complement.create({
    data: {
      storeId: context.storeId,
      complementGroupId: input.complementGroupId,
      name: input.name,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      additionalPriceCents: input.additionalPriceCents ?? 0,
      isAvailable: input.isAvailable ?? true,
    },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapComplement(complement);
}

export async function updateComplement(
  context: PartnerContext,
  id: string,
  input: ComplementPatchInput,
) {
  const existing = await prisma.complement.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  if (input.complementGroupId !== undefined) {
    const group = await prisma.complementGroup.findFirst({
      where: { id: input.complementGroupId, storeId: context.storeId },
      select: { id: true },
    });
    if (!group) {
      throw new Error("Grupo de complementos não encontrado ou não pertence a esta loja.");
    }
  }

  const complement = await prisma.complement.update({
    where: { id: existing.id },
    data: {
      ...(input.complementGroupId !== undefined
        ? { complementGroupId: input.complementGroupId }
        : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.additionalPriceCents !== undefined
        ? { additionalPriceCents: input.additionalPriceCents }
        : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapComplement(complement);
}

export async function toggleComplementAvailable(
  context: PartnerContext,
  id: string,
  isAvailable: boolean,
) {
  const existing = await prisma.complement.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  const complement = await prisma.complement.update({
    where: { id: existing.id },
    data: { isAvailable },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapComplement(complement);
}

export async function deleteComplement(
  context: PartnerContext,
  id: string,
): Promise<{ deleted: true } | { error: string }> {
  const existing = await prisma.complement.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return { error: "Complemento não encontrado." };
  }

  await prisma.complement.delete({ where: { id: existing.id } });

  await invalidateStorefrontCache(context.storeId);

  return { deleted: true };
}

// ─── Extras ───────────────────────────────────────────────────────────────────

export async function listExtras(context: PartnerContext) {
  const extras = await prisma.extra.findMany({
    where: { storeId: context.storeId },
    orderBy: { createdAt: "desc" },
  });
  return extras.map(mapExtra);
}

export async function createExtra(context: PartnerContext, input: ExtraCreateInput) {
  const extra = await prisma.extra.create({
    data: {
      storeId: context.storeId,
      name: input.name,
      description: input.description ?? null,
      priceCents: input.priceCents,
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable ?? true,
    },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapExtra(extra);
}

export async function updateExtra(
  context: PartnerContext,
  id: string,
  input: ExtraPatchInput,
) {
  const existing = await prisma.extra.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  const extra = await prisma.extra.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapExtra(extra);
}

export async function toggleExtraAvailable(
  context: PartnerContext,
  id: string,
  isAvailable: boolean,
) {
  const existing = await prisma.extra.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return null;
  }

  const extra = await prisma.extra.update({
    where: { id: existing.id },
    data: { isAvailable },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapExtra(extra);
}

export async function deleteExtra(
  context: PartnerContext,
  id: string,
): Promise<{ deleted: true } | { error: string }> {
  const existing = await prisma.extra.findFirst({
    where: { id, storeId: context.storeId },
  });
  if (!existing) {
    return { error: "Extra não encontrado." };
  }

  await prisma.extra.delete({ where: { id: existing.id } });

  await invalidateStorefrontCache(context.storeId);

  return { deleted: true };
}

// ─── ProductBundle (Fardo) ────────────────────────────────────────────────────

type ProductBundleCreateInput = {
  productId: string;
  name: string;
  slug: string;
  bundlePriceCents: number;
  itemsJson: unknown;
  isAvailable?: boolean;
};

type ProductBundlePatchInput = Partial<{
  name: string;
  slug: string;
  bundlePriceCents: number;
  itemsJson: unknown;
  isAvailable: boolean;
}>;

function mapProductBundle(bundle: {
  id: string;
  productId: string;
  name: string;
  slug: string;
  bundlePriceCents: number;
  itemsJson: unknown;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: { name: string } | null;
}) {
  return {
    id: bundle.id,
    productId: bundle.productId,
    productName: bundle.product?.name,
    name: bundle.name,
    slug: bundle.slug,
    bundlePriceCents: bundle.bundlePriceCents,
    itemsJson: bundle.itemsJson,
    isAvailable: bundle.isAvailable,
    createdAt: bundle.createdAt.toISOString(),
    updatedAt: bundle.updatedAt.toISOString(),
  };
}

export async function listProductBundles(context: PartnerContext, productId?: string) {
  const bundles = await prisma.productBundle.findMany({
    where: {
      product: { storeId: context.storeId },
      ...(productId ? { productId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
  });
  return bundles.map(mapProductBundle);
}

export async function createProductBundle(
  context: PartnerContext,
  input: ProductBundleCreateInput,
) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, storeId: context.storeId },
    select: { id: true, name: true },
  });
  if (!product) {
    throw new Error("Produto não encontrado ou não pertence a esta loja.");
  }

  const bundle = await prisma.productBundle.create({
    data: {
      productId: input.productId,
      name: input.name,
      slug: input.slug,
      bundlePriceCents: input.bundlePriceCents,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      itemsJson: input.itemsJson as any,
      isAvailable: input.isAvailable ?? true,
    },
    include: { product: { select: { name: true } } },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapProductBundle(bundle);
}

export async function updateProductBundle(
  context: PartnerContext,
  id: string,
  input: ProductBundlePatchInput,
) {
  const existing = await prisma.productBundle.findFirst({
    where: {
      id,
      product: { storeId: context.storeId },
    },
  });
  if (!existing) {
    return null;
  }

  const bundle = await prisma.productBundle.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.bundlePriceCents !== undefined
        ? { bundlePriceCents: input.bundlePriceCents }
        : {}),
      ...(input.itemsJson !== undefined
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? { itemsJson: input.itemsJson as any }
        : {}),
      ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
    },
    include: { product: { select: { name: true } } },
  });

  await invalidateStorefrontCache(context.storeId);

  return mapProductBundle(bundle);
}

export async function deleteProductBundle(
  context: PartnerContext,
  id: string,
): Promise<{ deleted: true } | { error: string }> {
  const existing = await prisma.productBundle.findFirst({
    where: {
      id,
      product: { storeId: context.storeId },
    },
  });
  if (!existing) {
    return { error: "Fardo não encontrado." };
  }

  await prisma.productBundle.delete({ where: { id: existing.id } });

  await invalidateStorefrontCache(context.storeId);

  return { deleted: true };
}
