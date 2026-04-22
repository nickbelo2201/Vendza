// Sentry deve ser o PRIMEIRO import — intercepta erros desde o startup
import "./instrument.js";

import { buildApp } from "./app.js";
import { closeScheduledJobs, initScheduledJobs } from "./jobs/crons.js";
import { getOrderPlacedQueue, getOrderStatusChangedQueue } from "./jobs/queues.js";
import { closeWorkers, startWorkers } from "./jobs/workers.js";

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3333);
const host = process.env.API_HOST ?? "0.0.0.0";

/**
 * Validar variáveis de ambiente obrigatórias no startup
 * Garante que o servidor não inicia sem configurações críticas
 */
function validateRequiredEnvVars() {
  const requiredEnvVars = [
    "PIX_ENCRYPTION_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\nFATAL: Variáveis de ambiente obrigatórias não estão definidas:\n  - ${missing.join("\n  - ")}\n`
    );
    process.exit(1);
  }
}

async function start() {
  // Validar env vars ANTES de qualquer outra inicialização
  validateRequiredEnvVars();
  const app = await buildApp();

  async function shutdown() {
    app.log.info("Encerrando servidor graciosamente...");
    try {
      await closeScheduledJobs();
      await closeWorkers();
      await getOrderPlacedQueue()?.close();
      await getOrderStatusChangedQueue()?.close();
      await app.close();
    } catch (err) {
      app.log.error(err, "Erro durante shutdown");
    }
    process.exit(0);
  }

  process.on("SIGTERM", () => {
    void shutdown();
  });

  process.on("SIGINT", () => {
    void shutdown();
  });

  try {
    await app.listen({ port, host });
    startWorkers();
    initScheduledJobs();
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
