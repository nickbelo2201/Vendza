import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { ok } from "../../lib/http.js";
import {
  abrirCaixa,
  fecharCaixa,
  getCaixaAtual,
  getResumoTurno,
  getHistoricoCaixa,
} from "./caixa-service.js";
import { type PartnerContext } from "./context.js";
import { requireRole } from "./require-role.js";

// ─── Schemas TypeBox ──────────────────────────────────────────────────────────

const AbrirCaixaBodySchema = Type.Object({
  saldoInicial: Type.Integer({ minimum: 0 }),
  observacoes: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const FecharCaixaBodySchema = Type.Object({
  turnoId: Type.String({ minLength: 1 }),
  saldoFinal: Type.Integer({ minimum: 0 }),
  observacoes: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const CaixaHistoricoQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0 })),
});

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function caixaRoutes(app: FastifyInstance) {
  app.post(
    "/partner/caixa/abrir",
    {
      preHandler: requireRole("owner", "manager"),
      schema: { body: AbrirCaixaBodySchema },
    },
    async (request, reply) => {
      const ctx = partnerContext(request);
      const { saldoInicial, observacoes } = request.body as Static<typeof AbrirCaixaBodySchema>;
      try {
        const turno = await abrirCaixa(ctx, saldoInicial, observacoes);
        return ok(turno);
      } catch (err) {
        return reply.code(409).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "CAIXA_JA_ABERTO", message: err instanceof Error ? err.message : "Erro." },
        });
      }
    },
  );

  app.post(
    "/partner/caixa/fechar",
    {
      preHandler: requireRole("owner", "manager"),
      schema: { body: FecharCaixaBodySchema },
    },
    async (request, reply) => {
      const ctx = partnerContext(request);
      const { turnoId, saldoFinal, observacoes } = request.body as Static<typeof FecharCaixaBodySchema>;
      try {
        const turno = await fecharCaixa(ctx, turnoId, saldoFinal, observacoes);
        return ok(turno);
      } catch (err) {
        return reply.code(400).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "CAIXA_ERRO", message: err instanceof Error ? err.message : "Erro." },
        });
      }
    },
  );

  app.get(
    "/partner/caixa/atual",
    { schema: {} },
    async (request) => {
      const ctx = partnerContext(request);
      const turno = await getCaixaAtual(ctx);
      return ok(turno);
    },
  );

  app.get(
    "/partner/caixa/resumo/:turnoId",
    {
      schema: {
        params: Type.Object({ turnoId: Type.String({ minLength: 1 }) }),
      },
    },
    async (request, reply) => {
      const ctx = partnerContext(request);
      const { turnoId } = request.params as { turnoId: string };
      try {
        const resumo = await getResumoTurno(ctx, turnoId);
        return ok(resumo);
      } catch (err) {
        return reply.code(404).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "TURNO_NAO_ENCONTRADO", message: err instanceof Error ? err.message : "Erro." },
        });
      }
    },
  );

  app.get(
    "/partner/caixa/historico",
    { schema: { querystring: CaixaHistoricoQuerySchema } },
    async (request) => {
      const ctx = partnerContext(request);
      const query = request.query as Static<typeof CaixaHistoricoQuerySchema>;
      const result = await getHistoricoCaixa(ctx, query.limit ?? 20, query.offset ?? 0);
      return ok(result);
    },
  );
}
