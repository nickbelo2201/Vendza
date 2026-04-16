import { Worker } from "bullmq";
import { prisma } from "@vendza/database";

import { getRedis } from "../plugins/redis.js";
import { enviarMensagem } from "../lib/whatsapp.js";

let orderPlacedWorker: Worker | null = null;
let orderStatusChangedWorker: Worker | null = null;

function formatarValor(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Apenas os status que geram notificação para o cliente.
// pending e ready_for_delivery são omitidos intencionalmente para não sobrecarregar.
const MENSAGENS_STATUS: Record<string, string> = {
  confirmed:
    "✅ *Pedido #{publicId} confirmado!*\n\nJá estamos separando seus produtos. Você receberá uma atualização assim que sair para entrega.",
  preparing:
    "👨‍🍳 *Pedido #{publicId} em preparo!*\n\nEstamos caprichando em cada item do seu pedido.",
  out_for_delivery:
    "🛵 *Pedido #{publicId} saiu para entrega!*\n\nSeu pedido está a caminho. Fique de olho — chegará em breve!",
  delivered:
    "📦 *Pedido #{publicId} entregue!*\n\nObrigado pela preferência! De *1 a 5*, como foi sua experiência? Responda com o número — seu feedback nos ajuda muito! 🙏",
  cancelled:
    "❌ *Pedido #{publicId} cancelado.*\n\nSentimos muito pelo transtorno. Se precisar de ajuda ou quiser fazer um novo pedido, é só responder esta mensagem.",
};

export function startWorkers() {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  const connection = redis;

  // Worker: novo pedido criado → envia confirmação ao cliente
  orderPlacedWorker = new Worker(
    "order.placed",
    async (job) => {
      const { publicId, customerName, totalCents, storeId } = job.data as {
        publicId: string;
        customerName: string;
        totalCents: number;
        storeId: string;
      };

      console.log(
        `[worker] order.placed — publicId=${publicId} customer=${customerName} total=${totalCents} storeId=${storeId}`,
      );

      const order = await prisma.order.findFirst({
        where: { publicId, storeId },
        select: { id: true, customerPhone: true },
      });

      if (!order) {
        console.warn(
          `[worker] order.placed — pedido ${publicId} não encontrado para storeId=${storeId}`,
        );
        return;
      }

      const mensagem =
        `Olá, *${customerName}*! 🎉\n\n` +
        `Seu pedido *#${publicId}* foi recebido com sucesso!\n\n` +
        `💰 *Total:* R$ ${formatarValor(totalCents)}\n\n` +
        `Assim que confirmarmos, você receberá uma atualização aqui. Obrigado pela preferência!`;

      await enviarMensagem({ telefone: order.customerPhone, mensagem });

      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "whatsapp_confirmacao_enviada",
          payloadJson: { publicId, totalCents },
        },
      });
    },
    { connection },
  );

  // Worker: status do pedido mudou → notifica cliente
  orderStatusChangedWorker = new Worker(
    "order.status_changed",
    async (job) => {
      const { publicId, status, storeId } = job.data as {
        publicId: string;
        status: string;
        storeId: string;
      };

      console.log(
        `[worker] order.status_changed — publicId=${publicId} status=${status} storeId=${storeId}`,
      );

      const template = MENSAGENS_STATUS[status];
      if (!template) return; // status sem mensagem configurada

      const order = await prisma.order.findFirst({
        where: { publicId, storeId },
        select: { id: true, customerPhone: true },
      });

      if (!order) {
        console.warn(
          `[worker] order.status_changed — pedido ${publicId} não encontrado para storeId=${storeId}`,
        );
        return;
      }

      const mensagem = template.replace(/{publicId}/g, publicId);

      await enviarMensagem({ telefone: order.customerPhone, mensagem });

      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: `whatsapp_status_${status}`,
          payloadJson: { publicId, status },
        },
      });
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
