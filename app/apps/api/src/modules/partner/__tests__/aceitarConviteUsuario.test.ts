/**
 * Testes unitários para aceitarConviteUsuario()
 *
 * Valida:
 *  - Token obrigatório (C-01)
 *  - Validação do token via Supabase verifyOtp ANTES de tocar o banco (C-02)
 *  - Token inválido ou expirado não atualiza StoreUser
 *  - Token válido atualiza StoreUser.authUserId
 *  - StoreUser não encontrado gera erro descritivo
 *  - Isolamento implícito: email vem do token Supabase, não do caller
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock de @vendza/database ────────────────────────────────────────────────
vi.mock("@vendza/database", () => {
  return {
    prisma: {
      storeUser: {
        findFirst: vi.fn(),
        update: vi.fn(),
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
import { aceitarConviteUsuario } from "../configuracoes-service.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const tokenValido = "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFjY2VzcyJ9.valid-payload";
const tokenInvalido = "token-invalido-ou-expirado";

const supabaseUserValido = {
  id: "supa-auth-user-abc",
  email: "colaborador@loja.com",
  user_metadata: {
    storeId: "store-aaa-111", // C-03: storeId armazenado no metadata do convite
  },
};

const storeUserExistente = {
  id: "store-user-001",
  storeId: "store-aaa-111",
  email: "colaborador@loja.com",
};

const storeUserAtualizado = {
  id: "store-user-001",
  email: "colaborador@loja.com",
  role: "operator",
  storeId: "store-aaa-111",
  isActive: true,
  createdAt: new Date("2026-04-21T10:00:00Z"),
};

function criarSupabaseMockVerify(
  opcoes: {
    sucesso?: boolean;
    user?: typeof supabaseUserValido | null;
    mensagemErro?: string;
  } = {},
) {
  const {
    sucesso = true,
    user = supabaseUserValido,
    mensagemErro = "Token inválido ou expirado",
  } = opcoes;

  // C-03: Garantir que user_metadata.storeId existe no mock padrão
  const userComMetadata = user && !user.user_metadata
    ? { ...user, user_metadata: { storeId: "store-aaa-111" } }
    : user;

  return {
    auth: {
      verifyOtp: vi.fn().mockResolvedValue(
        sucesso
          ? { data: { user: userComMetadata }, error: null }
          : { data: { user: null }, error: { message: mensagemErro } },
      ),
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

describe("aceitarConviteUsuario()", () => {
  describe("validação de token", () => {
    it("lança erro quando token está vazio", async () => {
      const supabase = criarSupabaseMockVerify();
      const log = criarLogger();

      await expect(aceitarConviteUsuario("", supabase, log)).rejects.toThrow("Token obrigatório");

      // Supabase NÃO deve ser chamado se token está vazio
      expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    });

    it("lança erro quando token é apenas espaços em branco", async () => {
      const supabase = criarSupabaseMockVerify();
      const log = criarLogger();

      await expect(aceitarConviteUsuario("   ", supabase, log)).rejects.toThrow("Token obrigatório");

      expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    });
  });

  describe("validação via Supabase verifyOtp", () => {
    it("chama verifyOtp com type 'invite' e o token recebido", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserExistente);
      (prisma.storeUser.update as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserAtualizado);
      const supabase = criarSupabaseMockVerify();
      const log = criarLogger();

      await aceitarConviteUsuario(tokenValido, supabase, log);

      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        type: "invite",
        token: tokenValido,
      });
    });

    it("lança erro quando Supabase retorna error (token inválido)", async () => {
      const supabase = criarSupabaseMockVerify({
        sucesso: false,
        mensagemErro: "OTP has expired or is invalid",
      });
      const log = criarLogger();

      await expect(aceitarConviteUsuario(tokenInvalido, supabase, log)).rejects.toThrow(
        "Token expirado ou inválido",
      );

      // Banco NÃO deve ser tocado se token é inválido
      expect(prisma.storeUser.findFirst).not.toHaveBeenCalled();
      expect(prisma.storeUser.update).not.toHaveBeenCalled();
    });

    it("lança erro quando Supabase retorna user nulo (token já usado)", async () => {
      const supabase = {
        auth: {
          verifyOtp: vi.fn().mockResolvedValue({
            // error null mas user null — token foi consumido/já usado
            data: { user: null },
            error: null,
          }),
        },
      };
      const log = criarLogger();

      await expect(aceitarConviteUsuario(tokenValido, supabase, log)).rejects.toThrow(
        "Token expirado ou inválido",
      );

      expect(prisma.storeUser.update).not.toHaveBeenCalled();
    });

    it("lança erro quando Supabase lança exceção (falha de rede)", async () => {
      const supabase = {
        auth: {
          verifyOtp: vi.fn().mockRejectedValue(new Error("Connection refused")),
        },
      };
      const log = criarLogger();

      await expect(aceitarConviteUsuario(tokenValido, supabase, log)).rejects.toThrow();

      expect(prisma.storeUser.update).not.toHaveBeenCalled();
    });
  });

  describe("happy path", () => {
    it("atualiza StoreUser.authUserId quando token é válido", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserExistente);
      (prisma.storeUser.update as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserAtualizado);
      const supabase = criarSupabaseMockVerify();
      const log = criarLogger();

      const resultado = await aceitarConviteUsuario(tokenValido, supabase, log);

      // Deve atualizar com o authUserId que veio do Supabase
      expect(prisma.storeUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: storeUserExistente.id },
          data: { authUserId: supabaseUserValido.id },
        }),
      );

      expect(resultado).toMatchObject({
        id: storeUserAtualizado.id,
        email: storeUserAtualizado.email,
        role: storeUserAtualizado.role,
        storeId: storeUserAtualizado.storeId,
        isActive: true,
        createdAt: expect.any(Date),
      });
    });

    it("retorna dados completos no formato esperado pelo envelope", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserExistente);
      (prisma.storeUser.update as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserAtualizado);
      const supabase = criarSupabaseMockVerify();
      const log = criarLogger();

      const resultado = await aceitarConviteUsuario(tokenValido, supabase, log);

      // Todos os campos que o endpoint usa para montar a resposta
      expect(resultado.id).toBeDefined();
      expect(resultado.email).toBeDefined();
      expect(resultado.role).toBeDefined();
      expect(resultado.storeId).toBeDefined();
      expect(typeof resultado.isActive).toBe("boolean");
      expect(resultado.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("StoreUser não encontrado", () => {
    it("lança erro descritivo quando email do token não corresponde a nenhum StoreUser", async () => {
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const supabase = criarSupabaseMockVerify({
        user: {
          id: "supa-999",
          email: "semcadastro@loja.com",
          user_metadata: { storeId: "store-aaa-111" },
        },
      });
      const log = criarLogger();

      await expect(aceitarConviteUsuario(tokenValido, supabase, log)).rejects.toThrow(
        "Convite não encontrado",
      );

      // Não deve tentar atualizar se StoreUser não existe
      expect(prisma.storeUser.update).not.toHaveBeenCalled();
    });
  });

  describe("isolamento implícito de tenant", () => {
    it("busca StoreUser pelo email E storeId que vieram do token Supabase — nunca do caller", async () => {
      const emailDoToken = "real@loja.com";
      const storeIdDoToken = "store-aaa-111";
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...storeUserExistente,
        email: emailDoToken,
        storeId: storeIdDoToken,
      });
      (prisma.storeUser.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...storeUserAtualizado,
        email: emailDoToken,
        storeId: storeIdDoToken,
      });

      const supabase = criarSupabaseMockVerify({
        user: {
          id: "supa-auth-real",
          email: emailDoToken,
          user_metadata: { storeId: storeIdDoToken }, // C-03: storeId no metadata
        },
      });
      const log = criarLogger();

      await aceitarConviteUsuario(tokenValido, supabase, log);

      // O email E storeId usados no findFirst devem vir do token Supabase
      const chamadaFindFirst = (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(chamadaFindFirst?.where?.email).toBe(emailDoToken);
      expect(chamadaFindFirst?.where?.storeId).toBe(storeIdDoToken); // C-03: CRÍTICO — filtro de segurança
    });

    it("não aceita convite quando token é de outra loja (email não existe na loja atual)", async () => {
      // Token válido de loja B — mas o email não tem StoreUser na loja A
      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const supabase = criarSupabaseMockVerify({
        user: {
          id: "supa-loja-b",
          email: "usuario@lojab.com",
          user_metadata: { storeId: "store-bbb-222" }, // C-03: storeId correto no token
        },
      });
      const log = criarLogger();

      await expect(aceitarConviteUsuario(tokenValido, supabase, log)).rejects.toThrow(
        "Convite não encontrado",
      );

      expect(prisma.storeUser.update).not.toHaveBeenCalled();
    });
  });

  describe("ordem de operações — Supabase ANTES do banco", () => {
    it("verifica token com Supabase ANTES de consultar o banco", async () => {
      const ordemChamadas: string[] = [];

      (prisma.storeUser.findFirst as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        ordemChamadas.push("prisma.storeUser.findFirst");
        return storeUserExistente;
      });
      (prisma.storeUser.update as ReturnType<typeof vi.fn>).mockResolvedValue(storeUserAtualizado);

      const supabase = {
        auth: {
          verifyOtp: vi.fn().mockImplementation(async () => {
            ordemChamadas.push("supabase.verifyOtp");
            return { data: { user: supabaseUserValido }, error: null };
          }),
        },
      };
      const log = criarLogger();

      await aceitarConviteUsuario(tokenValido, supabase, log);

      expect(ordemChamadas[0]).toBe("supabase.verifyOtp");
      expect(ordemChamadas[1]).toBe("prisma.storeUser.findFirst");
    });
  });
});
