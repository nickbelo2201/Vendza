// Jobs agendados (crons) via BullMQ
// Cada job é registrado com repeat para não duplicar entre restarts.

import { Queue, Worker } from "bullmq";
import { prisma } from "@vendza/database";

import { getRedis } from "../plugins/redis.js";
import { enviarMensagem } from "../lib/whatsapp.js";

let schedulerQueue: Queue | null = null;
let schedulerWorker: Worker | null = null;

function formatarValor(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function processarAniversariantes(): Promise<void> {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const dia = hoje.getDate();

  const clientes = await prisma.customer.findMany({
    where: {
      store: { status: "open" },
      birthDate: { not: null },
      phone: { not: { startsWith: "ANON-" } },
    },
    select: {
      name: true,
      phone: true,
      birthDate: true,
      store: { select: { name: true } },
    },
  });

  const aniversariantes = clientes.filter((c: (typeof clientes)[number]) => {
    if (!c.birthDate) return false;
    return c.birthDate.getMonth() + 1 === mes && c.birthDate.getDate() === dia;
  });

  let enviados = 0;
  for (const cliente of aniversariantes) {
    const mensagem =
      `🎂 *Feliz aniversário, ${cliente.name}!*\n\n` +
      `A *${cliente.store.name}* tem um presente especial para você: *20% de desconto* em qualquer pedido hoje!\n\n` +
      `Válido somente hoje. Aproveite! 🎁`;

    await enviarMensagem({ telefone: cliente.phone, mensagem }).catch((err: Error) => {
      console.error(`[cron] aniversariantes — erro para ${cliente.phone}:`, err.message);
    });
    enviados++;
  }

  console.log(`[cron] aniversariantes — ${enviados} mensagens enviadas`);
}

async function processarClientesInativos(): Promise<void> {
  const agora = new Date();
  // Alvo: clientes que completam exatamente 21 dias de inatividade hoje (janela de 24h)
  // Isso garante que cada cliente receba a mensagem apenas uma vez.
  const limite21Dias = new Date(agora.getTime() - 21 * 24 * 60 * 60 * 1000);
  const limite22Dias = new Date(agora.getTime() - 22 * 24 * 60 * 60 * 1000);

  const clientes = await prisma.customer.findMany({
    where: {
      store: { status: "open" },
      lastOrderAt: { gte: limite22Dias, lte: limite21Dias },
      phone: { not: { startsWith: "ANON-" } },
    },
    select: {
      name: true,
      phone: true,
      totalSpentCents: true,
      store: { select: { name: true } },
    },
  });

  let enviados = 0;
  for (const cliente of clientes) {
    let mensagem: string;

    if (cliente.totalSpentCents > 30000) {
      // VIP: > R$300 acumulado
      mensagem =
        `Sentimos sua falta, *${cliente.name}*! 🍷\n\n` +
        `Você é um cliente especial da *${cliente.store.name}* e queremos te ver de volta.\n\n` +
        `Como agradecimento, *frete grátis* no próximo pedido. É só pedir! 🎁`;
    } else if (cliente.totalSpentCents > 8000) {
      // Regular: > R$80 acumulado
      mensagem =
        `Olá, *${cliente.name}*! Faz tempo que você não aparece por aqui. 👋\n\n` +
        `A *${cliente.store.name}* preparou *10% de desconto* no seu próximo pedido.\n\n` +
        `Use o código: *VOLTA10* — válido por 7 dias!`;
    } else {
      // Ocasional
      mensagem =
        `Oi, *${cliente.name}*! A *${cliente.store.name}* tem saudade de você!\n\n` +
        `Temos novidades no cardápio que você vai curtir. Que tal dar uma olhada e fazer seu pedido? 🛒`;
    }

    await enviarMensagem({ telefone: cliente.phone, mensagem }).catch((err: Error) => {
      console.error(`[cron] clientes-inativos — erro para ${cliente.phone}:`, err.message);
    });
    enviados++;
  }

  console.log(`[cron] clientes-inativos — ${enviados} mensagens enviadas`);
}

async function processarRelatorioSemanal(): Promise<void> {
  const agora = new Date();
  const semanaPassada = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);

  const lojas = await prisma.store.findMany({
    where: { status: "open" },
    select: { id: true, name: true, whatsappPhone: true },
  });

  let processadas = 0;
  for (const loja of lojas) {
    const stats = await prisma.order.aggregate({
      where: {
        storeId: loja.id,
        status: { not: "cancelled" },
        placedAt: { gte: semanaPassada },
      },
      _sum: { totalCents: true },
      _count: true,
      _avg: { totalCents: true },
    });

    const receita = stats._sum.totalCents ?? 0;
    const count = stats._count;
    const ticketMedio = stats._avg.totalCents ?? 0;

    const mensagem =
      `📊 *Relatório Semanal — ${loja.name}*\n\n` +
      `💰 Faturamento: *R$ ${formatarValor(receita)}*\n` +
      `📦 Pedidos finalizados: *${count}*\n` +
      `🎯 Ticket médio: *R$ ${formatarValor(ticketMedio)}*\n\n` +
      `_Período: últimos 7 dias_\n\n` +
      `Bom trabalho! Continue assim! 💪`;

    await enviarMensagem({ telefone: loja.whatsappPhone, mensagem }).catch((err: Error) => {
      console.error(`[cron] relatorio-semanal — erro para loja ${loja.id}:`, err.message);
    });
    processadas++;
  }

  console.log(`[cron] relatorio-semanal — ${processadas} lojas processadas`);
}

// ─── Init / Close ─────────────────────────────────────────────────────────────

export function initScheduledJobs(): void {
  const redis = getRedis();

  if (!redis) {
    console.warn("[crons] Redis não disponível — jobs agendados desabilitados");
    return;
  }

  schedulerQueue = new Queue("scheduler", { connection: redis });

  // Aniversariantes — diário às 9h (horário do servidor, configurar TZ=America/Sao_Paulo)
  void schedulerQueue.add("aniversariantes", {}, {
    repeat: { pattern: "0 9 * * *" },
    jobId: "aniversariantes-daily",
  });

  // Clientes inativos — diário às 10h
  void schedulerQueue.add("clientes-inativos", {}, {
    repeat: { pattern: "0 10 * * *" },
    jobId: "clientes-inativos-daily",
  });

  // Relatório semanal — todo domingo às 23h
  void schedulerQueue.add("relatorio-semanal", {}, {
    repeat: { pattern: "0 23 * * 0" },
    jobId: "relatorio-semanal-weekly",
  });

  schedulerWorker = new Worker(
    "scheduler",
    async (job) => {
      if (job.name === "aniversariantes") {
        await processarAniversariantes();
      } else if (job.name === "clientes-inativos") {
        await processarClientesInativos();
      } else if (job.name === "relatorio-semanal") {
        await processarRelatorioSemanal();
      }
    },
    { connection: redis },
  );

  schedulerWorker.on("failed", (job, err) => {
    console.error(`[cron] ${job?.name} job ${job?.id} falhou:`, err.message);
  });

  console.log("[crons] Jobs agendados inicializados: aniversariantes, clientes-inativos, relatorio-semanal");
}

export async function closeScheduledJobs(): Promise<void> {
  await schedulerWorker?.close();
  await schedulerQueue?.close();
  schedulerWorker = null;
  schedulerQueue = null;
}
