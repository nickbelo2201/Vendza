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
    app.log.warn("[redis] REDIS_URL não definida — filas BullMQ desabilitadas.");
    return;
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    retryStrategy: () => null, // não reconectar — logar e seguir
  });

  redis.on("error", (err: Error) => {
    app.log.warn({ err: err.message }, "[redis] Redis indisponível — filas BullMQ desabilitadas.");
  });

  redis.on("connect", () => {
    app.log.info("[redis] Conectado ao Redis");
  });

  redisInstance = redis;

  app.addHook("onClose", async () => {
    await redis.quit();
  });
};

export const redisPlugin_ = fp(redisPlugin, { name: "redis" });
