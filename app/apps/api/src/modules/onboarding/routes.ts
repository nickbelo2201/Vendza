import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { prisma } from "@vendza/database";
import { envelopeSchema, ok } from "../../lib/http.js";
import { setupStore, applyTemplatesToStore } from "./service.js";
import { aceitarConviteUsuario } from "../partner/configuracoes-service.js";
import {
  CATEGORY_TEMPLATES,
  VALID_TEMPLATE_IDS,
  getTemplateCounts,
} from "./templates.js";

const SetupStoreSchema = Type.Object({
  storeName: Type.String({ minLength: 2 }),
  storeSlug: Type.String({ pattern: "^[a-z0-9-]+$", minLength: 2 }),
  whatsappPhone: Type.String({ minLength: 10 }),
  ownerName: Type.String({ minLength: 2 }),
  templateIds: Type.Optional(
    Type.Array(Type.String({ minLength: 1 }), { minItems: 1, maxItems: 2 }),
  ),
});

type SetupStoreBody = Static<typeof SetupStoreSchema>;

const CheckSlugQuerySchema = Type.Object({
  slug: Type.String({ minLength: 2, pattern: "^[a-z0-9-]+$" }),
});

type CheckSlugQuery = Static<typeof CheckSlugQuerySchema>;

const ApplyTemplateSchema = Type.Object({
  templateIds: Type.Array(Type.String({ minLength: 1 }), { minItems: 1, maxItems: 2 }),
});

type ApplyTemplateBody = Static<typeof ApplyTemplateSchema>;

export const onboardingRoutes: FastifyPluginAsync = async (app) => {
  // ── GET /onboarding/templates ──────────────────────────────────
  app.get(
    "/onboarding/templates",
    {
      schema: {
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async () => {
      const templates = VALID_TEMPLATE_IDS.map((id) => {
        const template = CATEGORY_TEMPLATES[id]!;
        const counts = getTemplateCounts(id);

        // Indicar se pode ser combinado
        let combo: string | false = false;
        if (id === "adega") combo = "adega+mercado";
        if (id === "mercado") combo = "adega+mercado";

        return {
          templateId: template.templateId,
          name: template.name,
          description: template.description,
          categoryCount: counts.categoryCount,
          subcategoryCount: counts.subcategoryCount,
          combo,
        };
      });

      return ok(templates, { stub: false });
    },
  );

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

  // ── POST /onboarding/apply-template ───────────────────────────
  app.post<{ Body: ApplyTemplateBody }>(
    "/onboarding/apply-template",
    {
      schema: {
        body: ApplyTemplateSchema,
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

        // Buscar storeUser para obter storeId
        const storeUser = await prisma.storeUser.findFirst({
          where: { authUserId: data.user.id },
        });

        if (!storeUser) {
          return reply.status(403).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: {
              code: "NO_STORE",
              message: "Nenhuma loja vinculada a este usuário.",
            },
          });
        }

        // Somente owner ou manager pode aplicar templates
        if (storeUser.role !== "owner" && storeUser.role !== "manager") {
          return reply.status(403).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: {
              code: "FORBIDDEN",
              message: "Somente owner ou manager pode aplicar templates.",
            },
          });
        }

        (request as any).storeId = storeUser.storeId;
      },
    },
    async (request, reply) => {
      const storeId = (request as any).storeId as string;

      try {
        const result = await applyTemplatesToStore(storeId, request.body.templateIds);
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

  // ── POST /v1/partner/aceitar-convite ──────────────────────────
  // C-01: Move token from query to body to prevent exposure in logs/referer headers
  const AceitarConviteBodySchema = Type.Object({
    token: Type.String({ minLength: 1 }),
  });

  type AceitarConviteBody = Static<typeof AceitarConviteBodySchema>;

  app.post<{ Body: AceitarConviteBody }>(
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
