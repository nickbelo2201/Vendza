// Webhook do Telegram Bot
// Recebe mensagens dos clientes → consulta contexto no banco → responde via IA

import type { FastifyPluginAsync } from "fastify";
import { prisma } from "@vendza/database";

import { getRedis } from "../../plugins/redis.js";
import { telegramSend } from "../../lib/telegram.js";
import { responderCliente, type MensagemHistorico } from "../../lib/ai-chat.js";

const STORE_SLUG = process.env.STORE_SLUG ?? "adega";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

async function buscarCliente(
  storeId: string,
  chatId: number,
  textoMensagem: string,
): Promise<{ id: string; name: string; phone: string } | null> {
  const redis = getRedis();

  // 1. Verificar vínculo salvo no Redis (7 dias de sessão)
  if (redis) {
    const customerId = await redis.get(`tg:${chatId}:customerId`).catch(() => null);
    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, storeId },
        select: { id: true, name: true, phone: true },
      });
      if (customer) return customer;
    }
  }

  // 2. Tentar extrair telefone da mensagem e vincular
  const soDigitos = textoMensagem.replace(/\D/g, "");
  if (soDigitos.length >= 10) {
    const sufixo = soDigitos.slice(-10); // últimos 10 dígitos (DDD + número)
    const customer = await prisma.customer.findFirst({
      where: { storeId, phone: { endsWith: sufixo } },
      select: { id: true, name: true, phone: true },
    });
    if (customer && redis) {
      await redis.set(`tg:${chatId}:customerId`, customer.id, "EX", 604800).catch(() => {});
    }
    return customer;
  }

  return null;
}

async function carregarHistorico(chatId: number): Promise<MensagemHistorico[]> {
  const redis = getRedis();
  if (!redis) return [];

  const raw = await redis.get(`tg:${chatId}:history`).catch(() => null);
  if (!raw) return [];

  return JSON.parse(raw) as MensagemHistorico[];
}

async function salvarHistorico(
  chatId: number,
  historico: MensagemHistorico[],
  novaMensagem: string,
  novaResposta: string,
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const atualizado: MensagemHistorico[] = [
    ...historico,
    { role: "user" as const, content: novaMensagem },
    { role: "assistant" as const, content: novaResposta },
  ].slice(-10); // manter últimas 5 trocas (10 mensagens)

  await redis.set(`tg:${chatId}:history`, JSON.stringify(atualizado), "EX", 86400).catch(() => {}); // 24h
}

export const telegramRoutes: FastifyPluginAsync = async (app) => {
  // Telegram exige resposta 200 rápida — processamos em background
  app.post<{ Body: TelegramUpdate }>(
    "/telegram/webhook",
    {},
    async (request, reply) => {
      void reply.code(200).send({ ok: true });

      const update = request.body;
      const message = update.message;

      if (!message?.text) return;
      if (message.chat.type !== "private") return; // só chats privados

      const chatId = message.chat.id;
      const texto = message.text.trim();
      const primeiroNome = message.from.first_name;

      // Ignorar comandos do sistema
      if (texto === "/start") {
        await telegramSend(
          chatId,
          `Olá, ${primeiroNome}! 👋\n\nSou o assistente da nossa loja. Pode me perguntar sobre seu pedido, cardápio ou qualquer dúvida!\n\nSe quiser que eu consulte seu histórico de pedidos, me mande seu número de telefone com DDD.`,
        ).catch(() => {});
        return;
      }

      try {
        // Buscar loja
        const store = await prisma.store.findFirst({
          where: { slug: STORE_SLUG },
          select: { id: true, name: true },
        });

        if (!store) {
          app.log.error({ slug: STORE_SLUG }, "[telegram] Loja não encontrada");
          return;
        }

        // Buscar cliente e último pedido
        const customer = await buscarCliente(store.id, chatId, texto);

        const ultimoPedido = customer
          ? await prisma.order.findFirst({
              where: { storeId: store.id, customerId: customer.id },
              orderBy: { placedAt: "desc" },
              select: { publicId: true, status: true, totalCents: true },
            })
          : null;

        // Carregar histórico da conversa
        const historico = await carregarHistorico(chatId);

        // Gerar resposta via IA
        const resposta = await responderCliente({
          mensagem: texto,
          historico,
          contexto: {
            storeName: store.name,
            customerName: customer?.name ?? primeiroNome,
            ultimoPedido,
          },
        });

        // Salvar histórico atualizado
        await salvarHistorico(chatId, historico, texto, resposta);

        // Enviar resposta ao cliente
        await telegramSend(chatId, resposta);
      } catch (err) {
        app.log.error(err, "[telegram] Erro ao processar mensagem");
        await telegramSend(
          chatId,
          "Tive um problema técnico agora. Tente novamente em instantes! 🙏",
        ).catch(() => {});
      }
    },
  );
};
