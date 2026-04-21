/**
 * Testes unitários para convidarUsuario()
 *
 * Valida:
 *  - Validação de entrada (email e role obrigatórios)
 *  - Ordem de operações: Supabase ANTES de criar StoreUser (C-02)
 *  - Propagação de erro quando Supabase falha (StoreUser NÃO é criado)
 *  - Isolamento de tenant: convite usa storeId do contexto autenticado
 *  - Idempotência: email duplicado na mesma loja gera erro antes de chamar Supabase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock de @vendza/database ────────────────────────────────────────────────
// Mocka o módulo inteiro antes de importar o service
vi.mock("@vendza/database", () => {
  return {
    prisma: {
      storeUser: {
        findFirst: vi.fn(),
        upsert: vi.fn(),
      },
    },
    StoreUserRole: {
      owner: "owner",
      manager: "manager",
      operator: "operator",
    },
  };
});

import { prisma } from "@vendza/database";
import { convidarUsuario } from "../configuracoes-service.js";
import type { PartnerContext } from "../context.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const contextoLojaA: PartnerContext = {
  userId: "auth-user-001",
  storeId: "store-aaa-111",
  storeUserId: "store-user-owner-001",
  role: "owner" as any,
};

const contextoLojaB: PartnerContext = {
  userId: "auth-user-002",
  storeId: "store-bbb-222",
  storeUserId: "store-user-owner-002",
  role: "owner" as any,
};

const storeUserCriado = {
  id: "store-user-novo-001",
  email: "novocolaborador@exemplo.com",
  role: "operator",
  isActive: true,
  createdAt: new Date("2026-04-21T10:00:00Z"),
};

function criarSupabaseMock(
  opcoes: { sucesso?: boolean; userId?: string; mensagemErro?: string } = {},
) {
  const { sucesso = true, userId = "supa-user-xyz", mensagemErro = "Erro interno" } = opcoes;
  return {
    auth: {
      admin: {
        inviteUserByEmail: vi.fn().mockResolvedValue(
          sucesso
            ? { data: { user: { id: userId } }, error: null }
            : { data: null, error: { message: mensagemErro } },
        ),
      },
    },
  };
}

function criarLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Testes ──────────────────────────────────────────────────────────────────

describe("convidarUsuario()", () => {
  describe("validação de entrada", () => {
    it("lança erro quando email está vazio", async () => {
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await expect(
        convidarUsuario(contextoLojaA, { email: "", role: "operator" }, supabase, log),
      ).rejects.toThrow("Email obrigatório");

      // Supabase NÃO deve ser chamado se validação falha
      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it("lança erro quando email é apenas espaços em branco", async () => {
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await expect(
        convidarUsuario(contextoLojaA, { email: "   ", role: "operator" }, supabase, log),
      ).rejects.toThrow("Email obrigatório");

      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it("lança erro quando role é inválida", async () => {
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await expect(
        convidarUsuario(
          contextoLojaA,
          { email: "teste@exemplo.com", role: "superadmin" },
          supabase,
          log,
        ),
      ).rejects.toThrow("Role inválida");

      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it("lança erro quando role está vazia", async () => {
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await expect(
        convidarUsuario(contextoLojaA, { email: "teste@exemplo.com", role: "" }, supabase, log),
      ).rejects.toThrow("Role inválida");

      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
    });

    it.each(["owner", "manager", "operator"])(
      "aceita role válida: %s",
      async (role) => {
        (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
        (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
          ...storeUserCriado,
          role,
        });
        const supabase = criarSupabaseMock();
        const log = criarLogger();

        const resultado = await convidarUsuario(
          contextoLojaA,
          { email: "usuario@exemplo.com", role },
          supabase,
          log,
        );

        expect(resultado.role).toBe(role);
      },
    );
  });

  describe("happy path", () => {
    it("cria StoreUser quando Supabase responde OK", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserCriado);
      const supabase = criarSupabaseMock({ userId: "supa-abc-123" });
      const log = criarLogger();

      const resultado = await convidarUsuario(
        contextoLojaA,
        { email: "NovColaborador@Exemplo.COM", role: "operator" },
        supabase,
        log,
      );

      // Email deve ser normalizado para lowercase
      expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        "novcolaborador@exemplo.com",
        expect.objectContaining({ redirectTo: expect.any(String) }),
      );

      // StoreUser deve ser criado após Supabase suceder
      expect(prisma.storeUser.upsert).toHaveBeenCalledOnce();
      expect(resultado.email).toBe(storeUserCriado.email);
      expect(resultado.storeId).toBe(contextoLojaA.storeId);
    });

    it("retorna dados completos no formato esperado", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserCriado);
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      const resultado = await convidarUsuario(
        contextoLojaA,
        { email: "colaborador@exemplo.com", role: "manager" },
        supabase,
        log,
      );

      // Resposta deve incluir todos os campos esperados pelo envelope
      expect(resultado).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        role: expect.any(String),
        storeId: contextoLojaA.storeId,
        isActive: true,
        createdAt: expect.any(Date),
      });
    });
  });

  describe("ordem de operações — Supabase ANTES do banco (C-02)", () => {
    it("chama Supabase ANTES de criar StoreUser no banco", async () => {
      const ordemChamadas: string[] = [];

      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        ordemChamadas.push("prisma.storeUser.upsert");
        return storeUserCriado;
      });

      const supabaseAdmin = {
        auth: {
          admin: {
            inviteUserByEmail: vi.fn().mockImplementation(async () => {
              ordemChamadas.push("supabase.inviteUserByEmail");
              return { data: { user: { id: "supa-001" } }, error: null };
            }),
          },
        },
      };
      const log = criarLogger();

      await convidarUsuario(
        contextoLojaA,
        { email: "ordem@exemplo.com", role: "operator" },
        supabaseAdmin,
        log,
      );

      expect(ordemChamadas[0]).toBe("supabase.inviteUserByEmail");
      expect(ordemChamadas[1]).toBe("prisma.storeUser.upsert");
    });
  });

  describe("falha do Supabase — StoreUser NÃO deve ser criado", () => {
    it("propaga erro quando Supabase retorna error object", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const supabase = criarSupabaseMock({
        sucesso: false,
        mensagemErro: "Email rate limit exceeded",
      });
      const log = criarLogger();

      await expect(
        convidarUsuario(
          contextoLojaA,
          { email: "usuario@exemplo.com", role: "operator" },
          supabase,
          log,
        ),
      ).rejects.toThrow("Email rate limit exceeded");

      // CRÍTICO: StoreUser NÃO deve ser criado quando Supabase falha
      expect(prisma.storeUser.upsert).not.toHaveBeenCalled();
    });

    it("propaga erro quando Supabase lança exceção", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const supabase = {
        auth: {
          admin: {
            inviteUserByEmail: vi.fn().mockRejectedValue(new Error("Network timeout")),
          },
        },
      };
      const log = criarLogger();

      await expect(
        convidarUsuario(
          contextoLojaA,
          { email: "usuario@exemplo.com", role: "operator" },
          supabase,
          log,
        ),
      ).rejects.toThrow("Network timeout");

      // CRÍTICO: StoreUser NÃO deve ser criado quando Supabase lança exceção
      expect(prisma.storeUser.upsert).not.toHaveBeenCalled();
    });
  });

  describe("duplicidade — email já existe na loja", () => {
    it("lança erro quando email já está cadastrado na mesma loja", async () => {
      // Simula usuário existente na loja A
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "existing-user-001",
        email: "duplicado@exemplo.com",
      });
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await expect(
        convidarUsuario(
          contextoLojaA,
          { email: "duplicado@exemplo.com", role: "operator" },
          supabase,
          log,
        ),
      ).rejects.toThrow("já existe nesta loja");

      // Supabase NÃO deve ser chamado se email já existe
      expect(supabase.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
      expect(prisma.storeUser.upsert).not.toHaveBeenCalled();
    });

    it("verifica duplicidade no banco com email normalizado (lowercase)", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserCriado);
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await convidarUsuario(
        contextoLojaA,
        { email: "Usuario@EXEMPLO.com", role: "operator" },
        supabase,
        log,
      );

      // findFirst deve usar email normalizado
      expect(prisma.storeUser.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            storeId: contextoLojaA.storeId,
            email: "usuario@exemplo.com",
          },
        }),
      );
    });
  });

  describe("isolamento de tenant", () => {
    it("usa storeId do contexto autenticado, nunca do input", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...storeUserCriado,
        storeId: contextoLojaA.storeId,
      });
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      const resultado = await convidarUsuario(
        contextoLojaA,
        { email: "usuario@exemplo.com", role: "operator" },
        supabase,
        log,
      );

      // storeId na criação do StoreUser deve vir do contexto, não do input
      const chamadaUpsert = (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(chamadaUpsert?.where?.storeId_email?.storeId).toBe(contextoLojaA.storeId);
      expect(chamadaUpsert?.create?.storeId).toBe(contextoLojaA.storeId);
      expect(resultado.storeId).toBe(contextoLojaA.storeId);
    });

    it("não interfere com convites de outra loja (storeId B não aparece em queries de loja A)", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...storeUserCriado,
        storeId: contextoLojaB.storeId,
      });
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await convidarUsuario(
        contextoLojaB,
        { email: "colaborador@exemplo.com", role: "manager" },
        supabase,
        log,
      );

      const chamadaFindFirst = (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      // Consulta de duplicidade deve usar storeId da loja B
      expect(chamadaFindFirst?.where?.storeId).toBe(contextoLojaB.storeId);
      // Nunca deve vazar storeId da loja A
      expect(chamadaFindFirst?.where?.storeId).not.toBe(contextoLojaA.storeId);
    });
  });

  describe("normalização de email", () => {
    it("convida com email em lowercase independente do case recebido", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserCriado);
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await convidarUsuario(
        contextoLojaA,
        { email: "ADMIN@LOJA.COM.BR", role: "manager" },
        supabase,
        log,
      );

      expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        "admin@loja.com.br",
        expect.anything(),
      );
    });

    it("remove espaços em branco antes e depois do email", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.storeUser.upsert as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserCriado);
      const supabase = criarSupabaseMock();
      const log = criarLogger();

      await convidarUsuario(
        contextoLojaA,
        { email: "  usuario@exemplo.com  ", role: "operator" },
        supabase,
        log,
      );

      expect(supabase.auth.admin.inviteUserByEmail).toHaveBeenCalledWith(
        "usuario@exemplo.com",
        expect.anything(),
      );
    });
  });
});
