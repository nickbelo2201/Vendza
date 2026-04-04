import { Worker } from "bullmq";

import { getRedis } from "../plugins/redis.js";

let orderPlacedWorker: Worker | null = null;
let orderStatusChangedWorker: Worker | null = null;

export function startWorkers() {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const connection = redis;

  orderPlacedWorker = new Worker(
    "order.placed",
    async (job) => {
      const { publicId, customerName, totalCents, storeId } = job.data as {
        publicId: string;
        customerName: string;
        totalCents: number;
        storeId: string;
      };
      console.log(`[worker] order.placed — publicId=${publicId} customer=${customerName} total=${totalCents} storeId=${storeId}`);
      // TODO WhatsApp: enviar mensagem de confirmação ao cliente
    },
    { connection },
  );

  orderStatusChangedWorker = new Worker(
    "order.status_changed",
    async (job) => {
      const { publicId, status, storeId } = job.data as {
        publicId: string;
        status: string;
        storeId: string;
      };
      console.log(`[worker] order.status_changed — publicId=${publicId} status=${status} storeId=${storeId}`);
      // TODO WhatsApp: notificar cliente sobre mudança de status
    },
    { connection },
  );

  orderPlacedWorker.on("failed", (job, err) => {
    console.error(`[worker] order.placed job ${job?.id} falhou:`, err.message);
  });

  orderStatusChangedWorker.on("failed", (job, err) => {
    console.error(`[worker] order.status_changed job ${job?.id} falhou:`, err.message);
  });
}

export async function closeWorkers() {
  await orderPlacedWorker?.close();
  await orderStatusChangedWorker?.close();
  orderPlacedWorker = null;
  orderStatusChangedWorker = null;
}
