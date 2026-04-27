import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import { type PartnerContext } from "./context.js";
import { importarNfe } from "./nfe-import-service.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const NfeImportBodySchema = Type.Object({
  xmlContent: Type.String({ minLength: 1 }),
});

const NfeImportResponseSchema = Type.Object({
  imported: Type.Integer(),
  errors: Type.Array(
    Type.Object({
      line: Type.Integer(),
      message: Type.String(),
    }),
  ),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function nfeRoutes(app: FastifyInstance) {
  // POST /partner/nfe/import — importa produtos a partir de um XML de NF-e
  app.post<{ Body: { xmlContent: string } }>(
    "/partner/nfe/import",
    {
      // Rate limit restritivo: cada importação pode criar muitos produtos
      config: { rateLimit: { max: 3, timeWindow: "1 minute" } },
      schema: {
        body: NfeImportBodySchema,
        response: {
          200: envelopeSchema(NfeImportResponseSchema),
        },
      },
    },
    async (request) => {
      const ctx = partnerContext(request);
      const { xmlContent } = request.body;
      const result = await importarNfe(ctx, xmlContent);
      return ok(result);
    },
  );
}
