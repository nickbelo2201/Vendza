import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { Redis } from "ioredis";

let redisInstance: Redis | null = null;

export function getRedis(): Redis | null {
  return redisInstance;
}

const redisPlugin: FastifyPluginAsync = async (app) => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    app.log.warn("[redis] REDIS_URL não definida — cache do catálogo e filas BullMQ desabilitados.");
    return;
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null, // não retentar — falhar rápido
  });

  redis.on("error", (err: Error) => {
    app.log.warn({ err: err.message }, "[redis] Redis indisponível — filas BullMQ desabilitadas.");
  });

  redis.on("connect", () => {
    app.log.info("[redis] Conectado ao Redis");
  });

  // Testar conectividade antes de expor a instância para BullMQ
  try {
    await redis.connect();
    await redis.ping();
    redisInstance = redis;
    app.log.info("[redis] Redis verificado e pronto.");
  } catch {
    app.log.warn("[redis] Não foi possível conectar ao Redis — filas e workers desabilitados.");
    await redis.quit().catch(() => {});
    // redisInstance permanece null → startWorkers/initQueues são no-op
  }

  app.addHook("onClose", async () => {
    await redis.quit();
  });
};

export const redisPlugin_ = fp(redisPlugin, { name: "redis" });
