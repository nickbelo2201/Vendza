import { Queue } from "bullmq";

import { getRedis } from "../plugins/redis.js";

let orderPlacedQueue: Queue | null = null;
let orderStatusChangedQueue: Queue | null = null;

export function getOrderPlacedQueue(): Queue | null {
  return orderPlacedQueue;
}

export function getOrderStatusChangedQueue(): Queue | null {
  return orderStatusChangedQueue;
}

export function initQueues() {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const connection = redis;

  orderPlacedQueue = new Queue("order.placed", { connection });
  orderStatusChangedQueue = new Queue("order.status_changed", { connection });
}
