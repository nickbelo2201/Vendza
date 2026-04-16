// Cliente WhatsApp via Z-API
// Docs: https://developer.z-api.io/
//
// Variáveis de ambiente necessárias:
//   ZAPI_INSTANCE_ID   — ID da instância (ex: "3F1C1404D5B7918D29AB0E8BC9274D54")
//   ZAPI_TOKEN         — Token da instância
//   ZAPI_CLIENT_TOKEN  — Client-Token (opcional, para segurança de webhooks)

const INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const TOKEN = process.env.ZAPI_TOKEN;
const CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN;

const BASE_URL = INSTANCE_ID && TOKEN
  ? `https://api.z-api.io/instances/${INSTANCE_ID}/token/${TOKEN}`
  : null;

export function whatsappConfigurado(): boolean {
  return Boolean(BASE_URL);
}

function isPhoneValido(phone: string): boolean {
  if (!phone) return false;
  if (phone.startsWith("ANON-")) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10;
}

function normalizarTelefone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Já tem código do país Brasil (55) + DDD + número
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Adiciona código do Brasil
  return `55${digits}`;
}

export async function enviarMensagem(params: {
  telefone: string;
  mensagem: string;
}): Promise<void> {
  if (!whatsappConfigurado()) {
    console.warn("[whatsapp] Variáveis Z-API não configuradas — mensagem ignorada");
    return;
  }

  if (!isPhoneValido(params.telefone)) {
    console.warn(`[whatsapp] Telefone inválido ou anônimo: ${params.telefone} — mensagem ignorada`);
    return;
  }

  const numero = normalizarTelefone(params.telefone);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (CLIENT_TOKEN) {
    headers["Client-Token"] = CLIENT_TOKEN;
  }

  const res = await fetch(`${BASE_URL}/send-text`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      phone: numero,
      message: params.mensagem,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[whatsapp] Falha ao enviar — HTTP ${res.status}: ${body}`);
  }
}
