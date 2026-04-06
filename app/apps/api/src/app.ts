import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify from "fastify";

import { authRoutes } from "./modules/auth/routes.js";
import { coverageRoutes } from "./modules/cobertura/routes.js";
import { partnerRoutes } from "./modules/partner/routes.js";
import { storefrontRoutes } from "./modules/storefront/routes.js";
import { supabasePlugin } from "./plugins/supabase.js";
import { socketPlugin } from "./plugins/socketio.js";
import { redisPlugin_ } from "./plugins/redis.js";
import { initQueues } from "./jobs/queues.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(supabasePlugin);
  app.register(socketPlugin);
  app.register(redisPlugin_);

  app.addHook("onReady", async () => {
    initQueues();
  });

  app.register(cors, {
    origin: true,
    credentials: true
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
      v1.register(authRoutes);

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
    const message = error instanceof Error ? error.message : "Unexpected application error.";

    reply.status(statusCode).send({
      data: null,
      meta: {
        requestedAt: new Date().toISOString(),
        stub: false
      },
      error: {
        code: errorCode,
        message
      }
    });
  });

  return app;
}
