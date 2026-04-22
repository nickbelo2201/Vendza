import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok, notFound, badRequest } from "../../lib/http.js";
import {
  getEstoque,
  getHistoricoEstoque,
  registrarMovimentacao,
} from "./estoque-service.js";
import { type PartnerContext } from "./context.js";

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function estoqueRoutes(app: FastifyInstance) {
  app.get(
    "/partner/estoque",
    { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } },
    async (request) => ok(await getEstoque(partnerContext(request))),
  );

  app.post<{
    Body: {
      productId: string;
      tipo: string;
      quantidade: number;
      motivo?: string;
      dataHora?: string;
    };
  }>(
    "/partner/estoque/movimentacao",
    {
      schema: {
        body: Type.Object({
          productId: Type.String(),
          tipo: Type.String(),
          quantidade: Type.Integer(),
          motivo: Type.Optional(Type.String()),
          dataHora: Type.Optional(Type.String()),
        }),
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      try {
        const resultado = await registrarMovimentacao(partnerContext(request), request.body);
        if (!resultado) {
          return reply.code(404).send(notFound("Item de estoque nao encontrado."));
        }
        reply.code(201);
        return ok(resultado);
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode ?? 500;
        const message = e instanceof Error ? e.message : "Erro ao registrar movimentação.";
        return reply.code(status).send(badRequest(message));
      }
    },
  );

  app.get<{ Params: { productId: string }; Querystring: { page?: number; pageSize?: number } }>(
    "/partner/estoque/:productId/historico",
    {
      schema: {
        params: Type.Object({ productId: Type.String() }),
        querystring: Type.Object({
          page: Type.Optional(Type.Integer({ minimum: 1 })),
          pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const { productId } = request.params;
      const { page, pageSize } = request.query;
      const historico = await getHistoricoEstoque(
        partnerContext(request),
        productId,
        page ?? 1,
        pageSize ?? 20,
      );
      if (!historico) {
        return reply.code(404).send(notFound("Item de estoque nao encontrado."));
      }
      return ok(historico);
    },
  );
}
