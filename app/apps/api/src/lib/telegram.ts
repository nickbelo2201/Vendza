// Cliente Telegram Bot API
// Docs: https://core.telegram.org/bots/api
//
// Variáveis de ambiente necessárias:
//   TELEGRAM_BOT_TOKEN — token do bot (via @BotFather)

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE = TOKEN ? `https://api.telegram.org/bot${TOKEN}` : null;

export function telegramConfigurado(): boolean {
  return Boolean(BASE);
}

export async function telegramSend(chatId: number | string, text: string): Promise<void> {
  if (!BASE) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN não configurado — mensagem ignorada");
    return;
  }

  const res = await fetch(`${BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[telegram] Falha ao enviar — HTTP ${res.status}: ${body}`);
  }
}

export async function setTelegramWebhook(url: string): Promise<void> {
  if (!BASE) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN não configurado — webhook não registrado");
    return;
  }

  const res = await fetch(`${BASE}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, allowed_updates: ["message"] }),
  });

  const json = await res.json() as { ok: boolean; description?: string };
  if (json.ok) {
    console.log(`[telegram] Webhook registrado: ${url}`);
  } else {
    console.error(`[telegram] Falha ao registrar webhook: ${json.description}`);
  }
}
