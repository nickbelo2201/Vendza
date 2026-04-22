import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import { getPromocoes } from "./promocoes-service.js";
import { type PartnerContext } from "./context.js";

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
    { schema: { response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await getPromocoes(partnerContext(request).storeId)),
  );
}
