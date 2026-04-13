import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import Fastify from "fastify";

import { coverageRoutes } from "./modules/cobertura/routes.js";
import { partnerRoutes } from "./modules/partner/routes.js";
import { onboardingRoutes } from "./modules/onboarding/routes.js";
import { storefrontRoutes } from "./modules/storefront/routes.js";
import { supabasePlugin } from "./plugins/supabase.js";
import { socketPlugin } from "./plugins/socketio.js";
import { redisPlugin_ } from "./plugins/redis.js";
import { initQueues } from "./jobs/queues.js";

export async function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(supabasePlugin);
  app.register(socketPlugin);
  app.register(redisPlugin_);

  app.addHook("onReady", async () => {
    initQueues();
  });

  await app.register(rateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: (_request, context) => ({
      data: null,
      meta: { requestedAt: new Date().toISOString(), stub: false },
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: `Limite de requisições atingido. Tente novamente em ${Math.ceil(context.ttl / 1000)}s.`,
      },
    }),
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
      if (!origin || allowed.some((o) => origin.startsWith(o))) {
        cb(null, true);
      } else {
        cb(new Error("CORS: origin não permitida"), false);
      }
    },
    credentials: true,
  });

  app.register(sensible);

  app.get("/health", async () => ({
    data: {
      status: "ok",
      service: "vendza-api",
      socket: "active",
    },
    meta: {
      requestedAt: new Date().toISOString(),
      stub: false
    },
    error: null
  }));

  app.register(
    async (v1) => {
      v1.register(coverageRoutes);
      v1.register(storefrontRoutes);
      v1.register(onboardingRoutes);

      // Rotas partner com schemas TypeBox de validação (routes.ts)
      // O hook authenticate já está declarado dentro de partnerRoutes
      // Caminhos em routes.ts já incluem prefixo "/partner/" nos paths
      v1.register(partnerRoutes);
    },
    { prefix: "/v1" }
  );

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

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
