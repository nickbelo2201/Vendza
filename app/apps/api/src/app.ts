import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import * as Sentry from "@sentry/node";
import Fastify from "fastify";

import { coverageRoutes } from "./modules/cobertura/routes.js";
import { partnerRoutes } from "./modules/partner/routes.js";
import { onboardingRoutes } from "./modules/onboarding/routes.js";
import { storefrontRoutes } from "./modules/storefront/routes.js";
import { telegramRoutes } from "./modules/telegram/routes.js";
import { supabasePlugin } from "./plugins/supabase.js";
import { socketPlugin } from "./plugins/socketio.js";
import { redisPlugin_ } from "./plugins/redis.js";
import { initQueues } from "./jobs/queues.js";
import { getRedis } from "./plugins/redis.js";
import { setTelegramWebhook } from "./lib/telegram.js";
import { AppError } from "./lib/errors.js";
import { errorEnvelope } from "./lib/http.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(supabasePlugin);
  app.register(socketPlugin);
  app.register(redisPlugin_);

  app.addHook("onReady", async () => {
    initQueues();

    // Registrar webhook do Telegram automaticamente no startup
    const apiUrl = process.env.API_PUBLIC_URL;
    if (apiUrl && process.env.TELEGRAM_BOT_TOKEN) {
      void setTelegramWebhook(`${apiUrl}/v1/telegram/webhook`);
    }
  });

  // ─── Rate Limiting diferenciado por grupo de rotas ────────────────────────
  // Global: 200 req/min (fallback para rotas não categorizadas)
  // Sobrescritas por grupo são aplicadas via routeConfig nos registros de rota.
  const rateLimitErrorResponse = (_request: unknown, context: { ttl: number }) => ({
    data: null,
    meta: { requestedAt: new Date().toISOString(), stub: false },
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: `Limite de requisições atingido. Tente novamente em ${Math.ceil(context.ttl / 1000)}s.`,
    },
  });

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: rateLimitErrorResponse,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  app.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        process.env.NEXT_PUBLIC_PARTNER_URL,
        process.env.NEXT_PUBLIC_CLIENT_URL,
        "http://localhost:3000",
        "http://localhost:3001",
      ].filter(Boolean) as string[];
      if (!origin || allowed.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("CORS: origin não permitida"), false);
      }
    },
    credentials: true,
  });

  app.register(sensible);

  app.get("/health", async () => {
    const redis = getRedis();
    let redisStatus = "not_configured";
    if (redis) {
      try {
        await redis.ping();
        redisStatus = "ok";
      } catch {
        redisStatus = "error";
      }
    }
    const zapiConfigured = Boolean(process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN);
    return {
      data: {
        status: "ok",
        service: "vendza-api",
        socket: "active",
        redis: redisStatus,
        zapi: zapiConfigured ? "configured" : "not_configured",
      },
      meta: {
        requestedAt: new Date().toISOString(),
        stub: false
      },
      error: null
    };
  });

  app.register(
    async (v1) => {
      // ── Rotas de cobertura e telegram (limite global padrão: 200 req/min) ──
      v1.register(coverageRoutes);
      v1.register(telegramRoutes);

      // ── Storefront: 100 req/min (público, mais restrito) ──────────────────
      v1.register(async (storefront) => {
        storefront.addHook("onRoute", (routeOptions) => {
          routeOptions.config = {
            ...routeOptions.config,
            rateLimit: {
              max: 100,
              timeWindow: "1 minute",
              keyGenerator: (request: { ip: string }) => request.ip,
              errorResponseBuilder: rateLimitErrorResponse,
            },
          };
        });
        storefront.register(storefrontRoutes);
      });

      // ── Onboarding: 20 req/min (proteção contra abuso, similar a auth) ───
      v1.register(async (onboarding) => {
        onboarding.addHook("onRoute", (routeOptions) => {
          routeOptions.config = {
            ...routeOptions.config,
            rateLimit: {
              max: 20,
              timeWindow: "1 minute",
              keyGenerator: (request: { ip: string }) => request.ip,
              errorResponseBuilder: rateLimitErrorResponse,
            },
          };
        });
        onboarding.register(onboardingRoutes);
      });

      // ── Partner: 500 req/min (autenticado, mais permissivo) ───────────────
      // Rotas de import/export recebem limite alto (1000 req/min)
      v1.register(async (partner) => {
        const rotasImportExport = [
          "/partner/products/import",
          "/partner/orders/export",
          "/partner/financeiro/exportar",
        ];

        partner.addHook("onRoute", (routeOptions) => {
          const isImportExport = rotasImportExport.some(
            (rota) => routeOptions.url === rota
          );

          routeOptions.config = {
            ...routeOptions.config,
            rateLimit: {
              max: isImportExport ? 1000 : 500,
              timeWindow: "1 minute",
              keyGenerator: (request: { ip: string }) => request.ip,
              errorResponseBuilder: rateLimitErrorResponse,
            },
          };
        });

        // O hook authenticate já está declarado dentro de partnerRoutes
        partner.register(partnerRoutes);
      });
    },
    { prefix: "/v1" }
  );

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    // Detectar AppError tipado — não reportar ao Sentry (erros de negócio esperados)
    if (error instanceof AppError) {
      return reply
        .code(error.statusCode)
        .send(errorEnvelope(error.code, error.message));
    }

    // Fallback para erros genéricos
    const errorLike =
      typeof error === "object" && error !== null ? (error as Record<string, unknown>) : null;

    const statusCode = typeof errorLike?.statusCode === "number" ? errorLike.statusCode : 500;
    const errorCode = typeof errorLike?.code === "string" ? errorLike.code : "INTERNAL_SERVER_ERROR";
    const isServerError = statusCode >= 500;
    const publicMessage = isServerError
      ? "Erro interno do servidor. Tente novamente."
      : (error instanceof Error ? error.message : "Unexpected application error.");

    if (isServerError) {
      app.log.error({ err: error }, "Erro interno do servidor");
      // Reportar erros 5xx ao Sentry para monitoramento em produção
      Sentry.captureException(error);
    }

    reply.status(statusCode).send({
      data: null,
      meta: {
        requestedAt: new Date().toISOString(),
        stub: false
      },
      error: {
        code: errorCode,
        message: publicMessage
      }
    });
  });

  return app;
}
