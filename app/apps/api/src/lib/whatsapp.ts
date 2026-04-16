// Cliente WhatsApp via Evolution API
// Docs: https://doc.evolution-api.com/
//
// Variáveis de ambiente necessárias:
//   WHATSAPP_API_URL      — URL base da sua instância Evolution API (ex: https://evo.suaempresa.com)
//   WHATSAPP_API_KEY      — API key configurada na instância
//   WHATSAPP_INSTANCE     — Nome da instância (ex: "adega-central")

const API_URL = process.env.WHATSAPP_API_URL?.replace(/\/$/, "");
const API_KEY = process.env.WHATSAPP_API_KEY;
const INSTANCE = process.env.WHATSAPP_INSTANCE;

export function whatsappConfigurado(): boolean {
  return Boolean(API_URL && API_KEY && INSTANCE);
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
    console.warn("[whatsapp] Variáveis de ambiente não configuradas — mensagem ignorada");
    return;
  }

  if (!isPhoneValido(params.telefone)) {
    console.warn(`[whatsapp] Telefone inválido ou anônimo: ${params.telefone} — mensagem ignorada`);
    return;
  }

  const numero = normalizarTelefone(params.telefone);

  const res = await fetch(`${API_URL}/message/sendText/${INSTANCE}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: API_KEY!,
    },
    body: JSON.stringify({
      number: numero,
      text: params.mensagem,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`[whatsapp] Falha ao enviar — HTTP ${res.status}: ${body}`);
  }
}
