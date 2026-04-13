import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

type LojaInput = {
  name?: string;
  slug?: string;
  descricao?: string;
  whatsappPhone?: string;
  status?: "open" | "closed" | "paused";
  minimumOrderValueCents?: number;
};

type ContaBancariaInput = {
  keyType: string;
  pixKey: string;
  bankName?: string;
};

type ConviteInput = {
  email: string;
  role: string;
};

// ─── Loja ────────────────────────────────────────────────────────────────────

export async function getLoja(context: PartnerContext) {
  const store = await prisma.store.findUniqueOrThrow({
    where: { id: context.storeId },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappPhone: true,
      status: true,
      minimumOrderValueCents: true,
    },
  });

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    whatsappPhone: store.whatsappPhone,
    status: store.status,
    minimumOrderValueCents: store.minimumOrderValueCents,
  };
}

export async function updateLoja(context: PartnerContext, input: LojaInput) {
  const store = await prisma.store.update({
    where: { id: context.storeId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.whatsappPhone !== undefined ? { whatsappPhone: input.whatsappPhone } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.minimumOrderValueCents !== undefined
        ? { minimumOrderValueCents: input.minimumOrderValueCents }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappPhone: true,
      status: true,
      minimumOrderValueCents: true,
    },
  });

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    whatsappPhone: store.whatsappPhone,
    status: store.status,
    minimumOrderValueCents: store.minimumOrderValueCents,
  };
}

// ─── Conta Bancária ───────────────────────────────────────────────────────────

export async function getContaBancaria(context: PartnerContext) {
  const conta = await prisma.storeBankAccount.findUnique({
    where: { storeId: context.storeId },
    select: {
      keyType: true,
      lastFourDigits: true,
      bankName: true,
    },
  });

  if (!conta) {
    return null;
  }

  return {
    keyType: conta.keyType,
    lastFourDigits: conta.lastFourDigits,
    bankName: conta.bankName,
  };
}

export async function upsertContaBancaria(context: PartnerContext, input: ContaBancariaInput) {
  const encryptedKey = Buffer.from(input.pixKey).toString("base64");
  const lastFourDigits = input.pixKey.slice(-4);

  const conta = await prisma.storeBankAccount.upsert({
    where: { storeId: context.storeId },
    update: {
      keyType: input.keyType,
      encryptedKey,
      lastFourDigits,
      bankName: input.bankName ?? null,
      updatedByUserId: context.storeUserId,
    },
    create: {
      storeId: context.storeId,
      keyType: input.keyType,
      encryptedKey,
      lastFourDigits,
      bankName: input.bankName ?? null,
      updatedByUserId: context.storeUserId,
    },
    select: {
      keyType: true,
      lastFourDigits: true,
      bankName: true,
    },
  });

  return {
    keyType: conta.keyType,
    lastFourDigits: conta.lastFourDigits,
    bankName: conta.bankName,
  };
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

export async function listUsuarios(context: PartnerContext) {
  const usuarios = await prisma.storeUser.findMany({
    where: { storeId: context.storeId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return usuarios.map((u: { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date }) => ({
    id: u.id,
    userId: u.id,
    role: u.role,
    user: {
      id: u.id,
      name: u.name ?? null,
      email: u.email,
    },
  }));
}

export async function convidarUsuario(context: PartnerContext, input: ConviteInput) {
  // STUB — convite por e-mail não implementado ainda (V3)
  return {
    email: input.email,
    role: input.role,
    storeId: context.storeId,
    status: "pending",
  };
}

export async function revogarUsuario(context: PartnerContext, userId: string) {
  // Não pode revogar a si mesmo
  if (userId === context.storeUserId) {
    return null;
  }

  const usuario = await prisma.storeUser.findFirst({
    where: { id: userId, storeId: context.storeId },
    select: { id: true },
  });

  if (!usuario) {
    return null;
  }

  await prisma.storeUser.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return { revoked: true, userId };
}
