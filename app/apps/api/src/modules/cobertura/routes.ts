import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import { validateCoverage } from "../../lib/mock-data.js";

const CoverageInputSchema = Type.Object({
  address: Type.String({ minLength: 3 }),
  neighborhood: Type.Optional(Type.String()),
  latitude: Type.Optional(Type.Number()),
  longitude: Type.Optional(Type.Number()),
});

type CoverageInput = Static<typeof CoverageInputSchema>;

export const coverageRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: CoverageInput }>(
    "/coverage/validate",
    {
      schema: {
        body: CoverageInputSchema,
        response: {
          200: envelopeSchema(
            Type.Object({
              eligible: Type.Boolean(),
              reason: Type.Union([Type.String(), Type.Null()]),
              deliveryFeeCents: Type.Union([Type.Integer(), Type.Null()]),
              etaMinutes: Type.Union([Type.String(), Type.Null()]),
            }),
          ),
        },
      },
    },
    async ({ body }) => ok(validateCoverage(body), { stub: true }),
  );
};
