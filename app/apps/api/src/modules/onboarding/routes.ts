import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { prisma } from "@vendza/database";
import { envelopeSchema, ok } from "../../lib/http.js";
import { setupStore } from "./service.js";
import { aceitarConviteUsuario } from "../partner/configuracoes-service.js";

const SetupStoreSchema = Type.Object({
  storeName: Type.String({ minLength: 2 }),
  storeSlug: Type.String({ pattern: "^[a-z0-9-]+$", minLength: 2 }),
  whatsappPhone: Type.String({ minLength: 10 }),
  ownerName: Type.String({ minLength: 2 }),
});

type SetupStoreBody = Static<typeof SetupStoreSchema>;

const CheckSlugQuerySchema = Type.Object({
  slug: Type.String({ minLength: 2, pattern: "^[a-z0-9-]+$" }),
});

type CheckSlugQuery = Static<typeof CheckSlugQuerySchema>;

export const onboardingRoutes: FastifyPluginAsync = async (app) => {
  // ── POST /onboarding/setup-store ──────────────────────────────
  app.post<{ Body: SetupStoreBody }>(
    "/onboarding/setup-store",
    {
      schema: {
        body: SetupStoreSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
      preHandler: async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          return reply.status(401).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: { code: "UNAUTHORIZED", message: "Token não fornecido." },
          });
        }

        const token = authHeader.slice(7);
        const { data, error } = await app.supabase.auth.getUser(token);

        if (error || !data.user) {
          return reply.status(401).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: { code: "UNAUTHORIZED", message: "Token inválido ou expirado." },
          });
        }

        request.user = data.user;
      },
    },
    async (request, reply) => {
      const user = request.user!;

      if (!user.email) {
        return reply.status(400).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "MISSING_EMAIL", message: "Email não disponível no token." },
        });
      }

      try {
        const result = await setupStore(user.id, user.email, request.body);
        return ok(result, { stub: false });
      } catch (err: any) {
        const statusCode = err.statusCode ?? 500;
        const code = err.code ?? "INTERNAL_ERROR";
        return reply.status(statusCode).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code, message: err.message },
        });
      }
    },
  );

  // ── GET /onboarding/check-slug ────────────────────────────────
  app.get<{ Querystring: CheckSlugQuery }>(
    "/onboarding/check-slug",
    {
      schema: {
        querystring: CheckSlugQuerySchema,
        response: { 200: envelopeSchema(Type.Object({ available: Type.Boolean() })) },
      },
      preHandler: async (request, reply) => {
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
          return reply.status(401).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: { code: "UNAUTHORIZED", message: "Token não fornecido." },
          });
        }

        const token = authHeader.slice(7);
        const { data, error } = await app.supabase.auth.getUser(token);

        if (error || !data.user) {
          return reply.status(401).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: { code: "UNAUTHORIZED", message: "Token inválido ou expirado." },
          });
        }

        request.user = data.user;
      },
    },
    async (request) => {
      const existing = await prisma.store.findFirst({
        where: { slug: request.query.slug },
      });

      return ok({ available: !existing }, { stub: false });
    },
  );

  // ── POST /onboarding/aceitar-convite ──────────────────────────
  const AceitarConviteQuerySchema = Type.Object({
    token: Type.String({ minLength: 1 }),
  });

  type AceitarConviteQuery = Static<typeof AceitarConviteQuerySchema>;

  app.post<{ Querystring: AceitarConviteQuery }>(
    "/onboarding/aceitar-convite",
    {
      schema: {
        querystring: AceitarConviteQuerySchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.query;
        const resultado = await aceitarConviteUsuario(token, app.supabaseAdmin, app.log);
        return ok(resultado);
      } catch (err: any) {
        const statusCode = err.message.includes("Token expirado") ? 400 : 500;
        const code = statusCode === 400 ? "INVALID_TOKEN" : "INTERNAL_ERROR";
        return reply.status(statusCode).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code, message: err.message },
        });
      }
    },
  );
};
