import { prisma, type Prisma } from "@vendza/database";
import {
  validateTemplateCombo,
  combineTemplates,
  type TemplateCategory,
} from "./templates.js";
import { AppError } from "../../lib/errors.js";

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
    throw new AppError(
      409,
      "STORE_ALREADY_EXISTS",
      "Loja já configurada para este usuário.",
    );
  }

  // 2. Verificar se slug já está em uso
  const existingStore = await prisma.store.findFirst({
    where: { slug: body.storeSlug },
  });

  if (existingStore) {
    throw new AppError(400, "SLUG_TAKEN", "Este slug já está em uso.");
  }

  // 3. Se templateIds informados, validar antes de criar
  const templateIds = body.templateIds ?? [];
  if (templateIds.length > 0) {
    const validation = validateTemplateCombo(templateIds);
    if (!validation.valid) {
      throw new AppError(
        400,
        "INVALID_TEMPLATE_COMBO",
        validation.error!,
      );
    }
  }

  // 4. Transação: criar Tenant → Store → StoreUser
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

    return {
      store: { id: store.id, slug: store.slug, name: store.name },
      storeUser: { id: storeUser.id, role: storeUser.role },
    } as SetupStoreResult;
  });

  // 5. Aplicar templates após a transação da Store
  if (templateIds.length > 0) {
    const appliedCategories = await createCategoriesFromTemplates(
      prisma,
      result.store.id,
      templateIds,
    );
    if (appliedCategories > 0) {
      result.appliedCategories = appliedCategories;
    }
  }

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
    throw new AppError(
      400,
      "INVALID_TEMPLATE_COMBO",
      validation.error!,
    );
  }

  // 2. Verificar se a loja existe
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) {
    throw new AppError(404, "STORE_NOT_FOUND", "Loja não encontrada.");
  }

  // 3. Criar categorias (fora de transação para evitar problemas com Prisma)
  const appliedCategories = await createCategoriesFromTemplates(prisma, storeId, templateIds);

  // 4. Atualizar templateIds na store (via SQL direto)
  await prisma.$executeRaw`
    UPDATE stores
    SET template_ids = ${JSON.stringify(templateIds)}
    WHERE id = ${storeId}
  `;

  return { appliedCategories };
}

// ─── Helper: criar categorias a partir de templates ────

async function createCategoriesFromTemplates(
  db: typeof prisma,
  storeId: string,
  templateIds: string[],
): Promise<number> {
  const categories: TemplateCategory[] = combineTemplates(templateIds);

  // Usar transação com timeout maior
  const totalCreated = await db.$transaction(
    async (tx: Prisma.TransactionClient) => {
      let count = 0;

      for (const cat of categories) {
        // Criar ou encontrar categoria pai
        const existingParent = await tx.category.findUnique({
          where: { storeId_slug: { storeId, slug: cat.slug } },
        });

        let parentCategory = existingParent;
        if (!parentCategory) {
          parentCategory = await tx.category.create({
            data: {
              storeId,
              name: cat.name,
              slug: cat.slug,
              sortOrder: cat.sortOrder,
              isActive: true,
            },
          });
          count++;
        }

        // Criar subcategorias
        for (const sub of cat.subcategories) {
          const existingSub = await tx.category.findUnique({
            where: { storeId_slug: { storeId, slug: sub.slug } },
          });

          if (!existingSub) {
            await tx.category.create({
              data: {
                storeId,
                parentCategoryId: parentCategory.id,
                name: sub.name,
                slug: sub.slug,
                sortOrder: sub.sortOrder,
                isActive: true,
              },
            });
            count++;
          }
        }
      }

      return count;
    },
    { timeout: 60000 }
  );

  return totalCreated;
}
