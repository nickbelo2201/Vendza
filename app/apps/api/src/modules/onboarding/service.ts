import { prisma, type Prisma } from "@vendza/database";
import {
  validateTemplateCombo,
  combineTemplates,
  type TemplateCategory,
} from "./templates.js";

interface SetupStoreInput {
  storeName: string;
  storeSlug: string;
  whatsappPhone: string;
  ownerName: string;
  templateIds?: string[];
}

interface SetupStoreResult {
  store: { id: string; slug: string; name: string };
  storeUser: { id: string; role: string };
  appliedCategories?: number;
}

export async function setupStore(
  authUserId: string,
  email: string,
  body: SetupStoreInput,
): Promise<SetupStoreResult> {
  // 1. Verificar se usuário já tem loja configurada
  const existingStoreUser = await prisma.storeUser.findFirst({
    where: { authUserId },
  });

  if (existingStoreUser) {
    const err = new Error("Loja já configurada para este usuário.");
    (err as any).statusCode = 409;
    (err as any).code = "STORE_ALREADY_EXISTS";
    throw err;
  }

  // 2. Verificar se slug já está em uso
  const existingStore = await prisma.store.findFirst({
    where: { slug: body.storeSlug },
  });

  if (existingStore) {
    const err = new Error("Este slug já está em uso.");
    (err as any).statusCode = 400;
    (err as any).code = "SLUG_TAKEN";
    throw err;
  }

  // 3. Se templateIds informados, validar antes de criar
  const templateIds = body.templateIds ?? [];
  if (templateIds.length > 0) {
    const validation = validateTemplateCombo(templateIds);
    if (!validation.valid) {
      const err = new Error(validation.error!);
      (err as any).statusCode = 400;
      (err as any).code = "INVALID_TEMPLATE_COMBO";
      throw err;
    }
  }

  // 4. Transação: criar Tenant → Store → StoreUser → (opcionalmente) categorias
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const tenant = await tx.tenant.create({
      data: {
        name: body.storeName,
        slug: body.storeSlug,
      },
    });

    const store = await tx.store.create({
      data: {
        tenantId: tenant.id,
        name: body.storeName,
        slug: body.storeSlug,
        whatsappPhone: body.whatsappPhone,
        status: "open",
        templateIds: templateIds.length > 0 ? JSON.stringify(templateIds) : "[]",
      },
    });

    const storeUser = await tx.storeUser.create({
      data: {
        storeId: store.id,
        authUserId,
        name: body.ownerName,
        email,
        role: "owner",
      },
    });

    // Aplicar templates dentro da mesma transação
    let appliedCategories = 0;
    if (templateIds.length > 0) {
      appliedCategories = await createCategoriesFromTemplates(
        tx,
        store.id,
        templateIds,
      );
    }

    return {
      store: { id: store.id, slug: store.slug, name: store.name },
      storeUser: { id: storeUser.id, role: storeUser.role },
      appliedCategories: appliedCategories > 0 ? appliedCategories : undefined,
    };
  });

  return result;
}

// ─── Aplicar templates a uma loja existente ──────────────────────────────────

export async function applyTemplatesToStore(
  storeId: string,
  templateIds: string[],
): Promise<{ appliedCategories: number }> {
  // 1. Validar combo
  const validation = validateTemplateCombo(templateIds);
  if (!validation.valid) {
    const err = new Error(validation.error!);
    (err as any).statusCode = 400;
    (err as any).code = "INVALID_TEMPLATE_COMBO";
    throw err;
  }

  // 2. Verificar se a loja existe
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    const err = new Error("Loja não encontrada.");
    (err as any).statusCode = 404;
    (err as any).code = "STORE_NOT_FOUND";
    throw err;
  }

  // 3. Transação: criar categorias + atualizar templateIds
  const appliedCategories = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const count = await createCategoriesFromTemplates(tx, storeId, templateIds);

    // Atualizar templateIds na store
    await tx.store.update({
      where: { id: storeId },
      data: { templateIds: JSON.stringify(templateIds) },
    });

    return count;
  });

  return { appliedCategories };
}

// ─── Helper: criar categorias a partir de templates (dentro de transação) ────

async function createCategoriesFromTemplates(
  tx: Prisma.TransactionClient,
  storeId: string,
  templateIds: string[],
): Promise<number> {
  const categories: TemplateCategory[] = combineTemplates(templateIds);
  let totalCreated = 0;

  for (const cat of categories) {
    // Criar categoria pai (upsert para evitar conflito se já existir)
    const parentCategory = await tx.category.upsert({
      where: { storeId_slug: { storeId, slug: cat.slug } },
      update: {
        name: cat.name,
        sortOrder: cat.sortOrder,
        isActive: true,
        parentCategoryId: null,
      },
      create: {
        storeId,
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    totalCreated++;

    // Criar subcategorias
    for (const sub of cat.subcategories) {
      await tx.category.upsert({
        where: { storeId_slug: { storeId, slug: sub.slug } },
        update: {
          name: sub.name,
          sortOrder: sub.sortOrder,
          isActive: true,
          parentCategoryId: parentCategory.id,
        },
        create: {
          storeId,
          parentCategoryId: parentCategory.id,
          name: sub.name,
          slug: sub.slug,
          sortOrder: sub.sortOrder,
          isActive: true,
        },
      });
      totalCreated++;
    }
  }

  return totalCreated;
}
