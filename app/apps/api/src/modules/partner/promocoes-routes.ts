import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import { getPromocoes } from "./promocoes-service.js";
import { type PartnerContext } from "./context.js";

// ─── Schemas de resposta ──────────────────────────────────────────────────────

/** Schema de produto em promoção */
const ProdutoPromoSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  listPriceCents: Type.Integer(),
  salePriceCents: Type.Integer(),
  descontoPercent: Type.Integer(),
  currentStock: Type.Integer(),
});

/** Schema de produto em alerta (parado ou estoque alto) */
const ProdutoAlertaSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  listPriceCents: Type.Integer(),
  salePriceCents: Type.Union([Type.Integer(), Type.Null()]),
  currentStock: Type.Integer(),
  safetyStock: Type.Optional(Type.Integer()),
});

/** Schema de resposta das promoções */
const PromocoesResponseSchema = Type.Object({
  emPromocao: Type.Array(ProdutoPromoSchema),
  alertasParado: Type.Array(ProdutoAlertaSchema),
  alertasEstoqueAlto: Type.Array(ProdutoAlertaSchema),
});

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function promocoesRoutes(app: FastifyInstance) {
  app.get(
    "/partner/promocoes",
    { schema: { response: { 200: envelopeSchema(PromocoesResponseSchema) } } },
    async (request) => ok(await getPromocoes(partnerContext(request).storeId)),
  );
}
