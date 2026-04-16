import { buildApp } from "./app.js";
import { closeScheduledJobs, initScheduledJobs } from "./jobs/crons.js";
import { getOrderPlacedQueue, getOrderStatusChangedQueue } from "./jobs/queues.js";
import { closeWorkers, startWorkers } from "./jobs/workers.js";

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3333);
const host = process.env.API_HOST ?? "0.0.0.0";

async function start() {
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
