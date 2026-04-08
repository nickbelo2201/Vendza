import { prisma, type Prisma } from "@vendza/database";

interface SetupStoreInput {
  storeName: string;
  storeSlug: string;
  whatsappPhone: string;
  ownerName: string;
}

interface SetupStoreResult {
  store: { id: string; slug: string; name: string };
  storeUser: { id: string; role: string };
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

  // 3. Transação: criar Tenant → Store → StoreUser
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
    };
  });

  return result;
}
