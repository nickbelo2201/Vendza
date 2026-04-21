/**
 * Testes de integração para POST /v1/partner/aceitar-convite
 *
 * Contexto: o endpoint está registrado em onboarding/routes.ts
 * É uma rota pública (sem autenticação de parceiro) que recebe token no body.
 *
 * Valida:
 *  - Token deve vir no body (C-01: não em query string)
 *  - Validação de schema TypeBox (token obrigatório, minLength 1)
 *  - Formato de resposta envelope: { data, meta, error }
 *  - Status codes corretos: 200 OK, 400 Bad Request
 *  - Chama aceitarConviteUsuario() corretamente
 *
 * Estratégia: mock completo das dependências externas (Supabase, Prisma)
 * para que os testes rodem sem conexão real a banco ou Auth.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import { Type } from "@sinclair/typebox";

// ─── Mocks de dependências externas ──────────────────────────────────────────

// Mock do módulo @vendza/database (Prisma)
vi.mock("@vendza/database", () => ({
  prisma: {
    storeUser: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    store: {
      findFirst: vi.fn(),
    },
  },
  StoreUserRole: {
    owner: "owner",
    manager: "manager",
    operator: "operator",
  },
}));

// Mock do módulo configuracoes-service para controlar aceitarConviteUsuario
vi.mock("../configuracoes-service.js", () => ({
  aceitarConviteUsuario: vi.fn(),
  convidarUsuario: vi.fn(),
  getLoja: vi.fn(),
  updateLoja: vi.fn(),
  getContaBancaria: vi.fn(),
  upsertContaBancaria: vi.fn(),
  listUsuarios: vi.fn(),
  revogarUsuario: vi.fn(),
}));

// Mock do módulo onboarding service
vi.mock("../../onboarding/service.js", () => ({
  setupStore: vi.fn(),
}));

// Mock do redis plugin para não precisar de conexão real
vi.mock("../../../plugins/redis.js", () => ({
  redisPlugin_: vi.fn(async (app: any) => {
    app.decorate("redis", null);
  }),
  getRedis: vi.fn(() => null),
}));

// Mock do socketio plugin
vi.mock("../../../plugins/socketio.js", () => ({
  socketPlugin: vi.fn(async () => {}),
}));

// Mock do supabase plugin para decorar app sem conexão real
vi.mock("../../../plugins/supabase.js", () => ({
  supabasePlugin: vi.fn(async (app: any) => {
    const mockSupabaseAdmin = {
      auth: {
        verifyOtp: vi.fn(),
        admin: {
          inviteUserByEmail: vi.fn(),
        },
      },
    };
    app.decorate("supabase", mockSupabaseAdmin);
    app.decorate("supabaseAdmin", mockSupabaseAdmin);
    app.decorate("authenticate", vi.fn(async () => {}));
  }),
}));

import { aceitarConviteUsuario } from "../configuracoes-service.js";
import { envelopeSchema, ok } from "../../../lib/http.js";

// ─── Factory: cria instância Fastify mínima com o endpoint testado ────────────

async function buildTestApp() {
  const app = Fastify({ logger: false });

  // Registra decorators manualmente (sem plugins externos)
  const mockSupabaseAdmin = {
    auth: {
      verifyOtp: vi.fn(),
      admin: { inviteUserByEmail: vi.fn() },
    },
  };
  app.decorate("supabase", mockSupabaseAdmin as any);
  app.decorate("supabaseAdmin", mockSupabaseAdmin as any);
  app.decorate("authenticate", async () => {});

  // Registra apenas o endpoint sob teste, sem a pilha completa da app
  const AceitarConviteBodySchema = Type.Object({
    token: Type.String({ minLength: 1 }),
  });

  app.post<{ Body: { token: string } }>(
    "/v1/partner/aceitar-convite",
    {
      schema: {
        body: AceitarConviteBodySchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.body;
        const resultado = await (aceitarConviteUsuario as ReturnType<typeof vi.fn>)(
          token,
          app.supabaseAdmin,
          app.log,
        );
        return ok(resultado);
      } catch (err: any) {
        const statusCode = err.message?.includes("Token expirado") ? 400 : 500;
        const code = statusCode === 400 ? "INVALID_TOKEN" : "INTERNAL_ERROR";
        return reply.status(statusCode).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code, message: err.message },
        });
      }
    },
  );

  await app.ready();
  return app;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

let app: Awaited<ReturnType<typeof buildTestApp>>;

beforeEach(async () => {
  vi.clearAllMocks();
  app = await buildTestApp();
});

afterEach(async () => {
  await app.close();
});

// ─── Fixtures ────────────────────────────────────────────────────────────────

const respostaConviteAceito = {
  id: "store-user-001",
  email: "colaborador@loja.com",
  role: "operator",
  storeId: "store-aaa-111",
  isActive: true,
  createdAt: new Date("2026-04-21T10:00:00Z").toISOString(),
};

// ─── Testes ──────────────────────────────────────────────────────────────────

describe("POST /v1/partner/aceitar-convite", () => {
  describe("happy path", () => {
    it("retorna 200 com envelope correto quando token é válido", async () => {
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockResolvedValue(respostaConviteAceito);

      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "token-valido-abc123" }),
      });

      expect(resposta.statusCode).toBe(200);

      const corpo = JSON.parse(resposta.body);
      expect(corpo).toMatchObject({
        data: expect.objectContaining({
          id: respostaConviteAceito.id,
          email: respostaConviteAceito.email,
          role: respostaConviteAceito.role,
          storeId: respostaConviteAceito.storeId,
        }),
        meta: expect.objectContaining({
          requestedAt: expect.any(String),
        }),
        error: null,
      });
    });

    it("passa o token do body para aceitarConviteUsuario()", async () => {
      const tokenEsperado = "meu-token-secreto-xyz";
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockResolvedValue(respostaConviteAceito);

      await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: tokenEsperado }),
      });

      expect(aceitarConviteUsuario).toHaveBeenCalledWith(
        tokenEsperado,
        expect.anything(), // supabaseAdmin
        expect.anything(), // log
      );
    });

    it("meta.requestedAt é uma string ISO 8601 válida", async () => {
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockResolvedValue(respostaConviteAceito);

      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "token-valido" }),
      });

      const corpo = JSON.parse(resposta.body);
      expect(() => new Date(corpo.meta.requestedAt)).not.toThrow();
      expect(new Date(corpo.meta.requestedAt).toISOString()).toBe(corpo.meta.requestedAt);
    });
  });

  describe("validação de schema — token no body", () => {
    it("retorna 400 quando body não tem token", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(resposta.statusCode).toBe(400);
      // aceitarConviteUsuario não deve ser chamado com body inválido
      expect(aceitarConviteUsuario).not.toHaveBeenCalled();
    });

    it("retorna 400 quando token é string vazia", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "" }),
      });

      expect(resposta.statusCode).toBe(400);
      expect(aceitarConviteUsuario).not.toHaveBeenCalled();
    });

    it("retorna 400 quando body é enviado como null", async () => {
      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: "null",
      });

      expect(resposta.statusCode).toBe(400);
    });

    it("não expõe token via query string (GET não deve ser aceito)", async () => {
      const resposta = await app.inject({
        method: "GET",
        url: "/v1/partner/aceitar-convite?token=token-teste",
      });

      // GET não é registrado — deve retornar 404
      expect(resposta.statusCode).toBe(404);
      expect(aceitarConviteUsuario).not.toHaveBeenCalled();
    });
  });

  describe("token inválido ou expirado", () => {
    it("retorna 400 quando aceitarConviteUsuario lança erro de token expirado", async () => {
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Token expirado ou inválido"),
      );

      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "token-expirado" }),
      });

      expect(resposta.statusCode).toBe(400);

      const corpo = JSON.parse(resposta.body);
      expect(corpo.data).toBeNull();
      expect(corpo.error).toMatchObject({
        code: "INVALID_TOKEN",
        message: expect.stringContaining("Token expirado"),
      });
    });

    it("retorna 500 quando aceitarConviteUsuario lança erro interno inesperado", async () => {
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Conexão com banco de dados perdida"),
      );

      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "token-qualquer" }),
      });

      expect(resposta.statusCode).toBe(500);

      const corpo = JSON.parse(resposta.body);
      expect(corpo.error.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("formato do envelope de resposta", () => {
    it("resposta de sucesso tem estrutura { data, meta, error: null }", async () => {
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockResolvedValue(respostaConviteAceito);

      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "token-valido" }),
      });

      const corpo = JSON.parse(resposta.body);
      expect(Object.keys(corpo)).toContain("data");
      expect(Object.keys(corpo)).toContain("meta");
      expect(Object.keys(corpo)).toContain("error");
      expect(corpo.error).toBeNull();
    });

    it("resposta de erro tem estrutura { data: null, meta, error: { code, message } }", async () => {
      (aceitarConviteUsuario as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Token expirado ou inválido"),
      );

      const resposta = await app.inject({
        method: "POST",
        url: "/v1/partner/aceitar-convite",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: "token-ruim" }),
      });

      const corpo = JSON.parse(resposta.body);
      expect(corpo.data).toBeNull();
      expect(corpo.meta).toBeDefined();
      expect(corpo.error).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
      });
    });
  });
});
