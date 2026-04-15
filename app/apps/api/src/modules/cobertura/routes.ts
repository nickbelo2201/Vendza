import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { prisma } from "@vendza/database";
import { envelopeSchema, ok } from "../../lib/http.js";

const CoverageInputSchema = Type.Object({
  storeSlug: Type.Optional(Type.String({ minLength: 1 })),
  address: Type.String({ minLength: 3 }),
  neighborhood: Type.Optional(Type.String()),
  bairro: Type.Optional(Type.String()),
  cidade: Type.Optional(Type.String()),
  cep: Type.Optional(Type.String()),
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
    async ({ body }, reply) => {
      // Resolve a loja: prioridade ao storeSlug do body, fallback para STORE_SLUG env
      const slug = body.storeSlug ?? process.env.STORE_SLUG;

      if (!slug) {
        return reply.code(400).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "STORE_SLUG_AUSENTE", message: "Slug da loja não informado." },
        });
      }

      const store = await prisma.store.findFirst({
        where: { slug },
        select: { id: true },
      });

      if (!store) {
        return reply.code(404).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "LOJA_NAO_ENCONTRADA", message: `Loja '${slug}' não encontrada.` },
        });
      }

      // Busca zonas de entrega ativas com mode=neighborhoods
      const zones = await prisma.deliveryZone.findMany({
        where: { storeId: store.id, isActive: true, mode: "neighborhoods" },
        orderBy: { createdAt: "asc" },
      });

      // Bairro a verificar: aceita bairro, neighborhood ou extrai do endereço
      const bairroAlvo = (body.bairro ?? body.neighborhood ?? "").trim().toLowerCase();

      if (!bairroAlvo) {
        return ok({
          eligible: false,
          reason: "Bairro não informado para verificação de cobertura.",
          deliveryFeeCents: null,
          etaMinutes: null,
        });
      }

      // Verifica em cada zona se o bairro está na lista
      for (const zone of zones) {
        const bairros: string[] = Array.isArray(zone.neighborhoodsJson)
          ? (zone.neighborhoodsJson as string[])
          : [];

        const coberto = bairros.some(
          (b) => b.trim().toLowerCase() === bairroAlvo,
        );

        if (coberto) {
          return ok({
            eligible: true,
            reason: null,
            deliveryFeeCents: zone.deliveryFeeCents,
            etaMinutes: String(zone.estimatedDeliveryMinutes),
          });
        }
      }

      return ok({
        eligible: false,
        reason: "Bairro fora da área de cobertura configurada para esta loja.",
        deliveryFeeCents: null,
        etaMinutes: null,
      });
    },
  );
};
