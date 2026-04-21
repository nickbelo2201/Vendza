import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

// ─── Criptografia PIX (AES-256-GCM) ─────────────────────────────────────────

const PIX_KEY_SECRET = process.env.PIX_ENCRYPTION_KEY ?? "";
const ALGORITHM = "aes-256-gcm";

function encryptPixKey(plaintext: string): string {
  if (!PIX_KEY_SECRET || PIX_KEY_SECRET.length < 32) {
    throw new Error("PIX_ENCRYPTION_KEY deve ter ao menos 32 caracteres");
  }
  const iv = randomBytes(12);
  const key = Buffer.from(PIX_KEY_SECRET.slice(0, 32));
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Formato: iv(12):authTag(16):encrypted — tudo em hex
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptPixKey(ciphertext: string): string {
  if (!PIX_KEY_SECRET) return ciphertext; // fallback seguro
  // Detecta formato antigo (Base64 simples, sem ":")
  if (!ciphertext.includes(":")) {
    return Buffer.from(ciphertext, "base64").toString("utf8");
  }
  const parts = ciphertext.split(":");
  const ivHex = parts[0] ?? "";
  const authTagHex = parts[1] ?? "";
  const encryptedHex = parts[2] ?? "";
  const key = Buffer.from(PIX_KEY_SECRET.slice(0, 32));
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

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
  const encryptedKey = encryptPixKey(input.pixKey);
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

export async function convidarUsuario(
  context: PartnerContext,
  input: ConviteInput,
  supabaseAdmin: any,
  appLog: any,
) {
  // 1. Validar entrada
  if (!input.email || !input.email.trim()) {
    throw new Error("Email obrigatório");
  }

  if (!input.role || !["owner", "manager", "operator"].includes(input.role)) {
    throw new Error("Role inválida. Deve ser: owner, manager, operator");
  }

  const emailNormalizado = input.email.toLowerCase().trim();

  appLog.info(
    { email: emailNormalizado, storeId: context.storeId, role: input.role },
    "Iniciando convite de usuário",
  );

  // 2. Verificar se email já existe nesta loja
  const usuarioExistente = await prisma.storeUser.findFirst({
    where: {
      storeId: context.storeId,
      email: emailNormalizado,
    },
    select: { id: true, email: true },
  });

  if (usuarioExistente) {
    throw new Error(`Usuário com email ${emailNormalizado} já existe nesta loja`);
  }

  // C-02: Chamar Supabase Auth PRIMEIRO — se falhar, não cria StoreUser orfão
  // 3. Validar o token usando Supabase antes de criar qualquer registro no DB
  let supabaseUserId: string | null = null;

  try {
    // C-03: Armazenar storeId nos metadados do convite para validação de tenant na aceitação
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(emailNormalizado, {
      redirectTo: `${process.env.NEXT_PUBLIC_PARTNER_URL ?? "http://localhost:3001"}/aceitar-convite`,
      data: { storeId: context.storeId },
    });

    if (error) {
      appLog.warn(
        { email: emailNormalizado, error: error.message },
        "Erro ao enviar convite via Supabase",
      );
      throw new Error(`Falha ao enviar convite: ${error.message}`);
    }

    supabaseUserId = data?.user?.id ?? null;
    appLog.info(
      { email: emailNormalizado, userId: supabaseUserId },
      "Convite enviado com sucesso via Supabase",
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    appLog.error(
      { email: emailNormalizado, error: errorMessage },
      "Erro crítico ao conectar com Supabase Auth",
    );
    throw new Error(errorMessage);
  }

  // 4. APENAS SE Supabase funcionou, criar ou atualizar StoreUser
  const storeUser = await prisma.storeUser.upsert({
    where: {
      storeId_email: {
        storeId: context.storeId,
        email: emailNormalizado,
      },
    },
    update: {
      role: input.role as any,
    },
    create: {
      storeId: context.storeId,
      email: emailNormalizado,
      role: input.role as any,
      name: emailNormalizado.split("@")[0] || emailNormalizado,
      isActive: true,
      authUserId: null,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  appLog.info(
    { storeUserId: storeUser.id, email: storeUser.email },
    "StoreUser criado/atualizado com sucesso",
  );

  // 5. Retornar resposta
  return {
    id: storeUser.id,
    email: storeUser.email,
    role: storeUser.role,
    storeId: context.storeId,
    isActive: storeUser.isActive,
    createdAt: storeUser.createdAt,
  };
}

export async function aceitarConviteUsuario(token: string, supabaseAdmin: any, appLog: any) {
  // 1. Validar token
  if (!token || !token.trim()) {
    throw new Error("Token obrigatório");
  }

  appLog.info({ tokenHash: token.substring(0, 10) }, "Processando aceitação de convite");

  // 2. Validar o token usando Supabase
  // O token vem da URL de convite que Supabase envia por email
  // Usaremos verifyOtp para validar o token (magic link)
  const { data, error } = await supabaseAdmin.auth.verifyOtp({
    type: "invite",
    token: token,
  });

  if (error || !data.user) {
    appLog.warn(
      { error: error?.message, tokenHash: token.substring(0, 10) },
      "Token inválido ou expirado",
    );
    throw new Error("Token expirado ou inválido");
  }

  const authUserId = data.user.id;
  const userEmail = data.user.email;

  // C-03: Extrair storeId dos metadados do token Supabase
  // O storeId foi armazenado como user_metadata ao convidar o usuário
  // Isso previne cross-tenant leak quando procuramos o StoreUser
  const storeIdFromToken = data.user.user_metadata?.storeId as string | undefined;

  if (!storeIdFromToken) {
    appLog.warn(
      { authUserId, userEmail },
      "storeId ausente nos metadados do token — convite de versão anterior?",
    );
    throw new Error("Convite inválido: storeId ausente. Solicite um novo convite.");
  }

  appLog.info({ authUserId, userEmail, storeId: storeIdFromToken }, "Token validado com sucesso");

  // C-03: Encontrar StoreUser pelo email E storeId
  // CRÍTICO: Schema garante @@unique([storeId, email]), então um email é único por loja.
  // Sem filtrar por storeId, findFirst pode retornar o StoreUser ERRADO se o mesmo email
  // existir em múltiplas lojas.
  // Exemplo: João é convidado por Loja A e Loja B. Se Loja B foi criada primeiro,
  // findFirst({ where: { email } }) retorna o StoreUser de Loja B mesmo que João
  // está aceitando o convite de Loja A.
  const storeUser = await prisma.storeUser.findFirst({
    where: {
      email: userEmail,
      storeId: storeIdFromToken,
    },
    select: { id: true, storeId: true, email: true },
  });

  if (!storeUser) {
    appLog.warn(
      { userEmail, authUserId },
      "StoreUser não encontrado para email do token",
    );
    throw new Error("Convite não encontrado. Solicite um novo convite.");
  }

  // 4. Atualizar StoreUser com authUserId
  const storeUserAtualizado = await prisma.storeUser.update({
    where: { id: storeUser.id },
    data: { authUserId },
    select: {
      id: true,
      email: true,
      role: true,
      storeId: true,
      isActive: true,
      createdAt: true,
    },
  });

  appLog.info(
    { storeUserId: storeUserAtualizado.id, storeId: storeUserAtualizado.storeId },
    "Convite aceito com sucesso",
  );

  // 5. Retornar sucesso
  return {
    id: storeUserAtualizado.id,
    email: storeUserAtualizado.email,
    role: storeUserAtualizado.role,
    storeId: storeUserAtualizado.storeId,
    isActive: storeUserAtualizado.isActive,
    createdAt: storeUserAtualizado.createdAt,
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
