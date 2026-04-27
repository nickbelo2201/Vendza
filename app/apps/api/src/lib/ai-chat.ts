// Integração com OpenRouter para respostas de atendimento ao cliente
// Modelo padrão: google/gemini-2.0-flash (melhor custo/qualidade para PT-BR)
//
// Variáveis de ambiente:
//   OPENROUTER_API_KEY — chave da API do OpenRouter
//   AI_MODEL           — modelo (opcional, padrão: google/gemini-2.0-flash)

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.AI_MODEL ?? "google/gemini-2.0-flash";

export interface MensagemHistorico {
  role: "user" | "assistant";
  content: string;
}

interface ProdutoCatalogo {
  nome: string;
  categoria: string;
  precoCents: number;
}

interface ContextoCliente {
  storeName: string;
  storefrontUrl?: string;
  customerName?: string;
  ultimoPedido?: {
    publicId: string;
    status: string;
    totalCents: number;
  } | null;
  catalogo?: ProdutoCatalogo[];
}

function traduzirStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Aguardando confirmação",
    confirmed: "Confirmado",
    preparing: "Em preparo",
    out_for_delivery: "Saiu para entrega",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };
  return map[status] ?? status;
}

function formatarValor(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildSystemPrompt(contexto: ContextoCliente): string {
  const linhaCliente = contexto.customerName
    ? `Cliente: ${contexto.customerName}`
    : "Cliente não identificado";

  const linhaPedido = contexto.ultimoPedido
    ? `Último pedido: #${contexto.ultimoPedido.publicId} — ${traduzirStatus(contexto.ultimoPedido.status)} — R$ ${formatarValor(contexto.ultimoPedido.totalCents)}`
    : "Nenhum pedido encontrado para este cliente.";

  const secaoCatalogo = contexto.catalogo && contexto.catalogo.length > 0
    ? `\nCardápio disponível:\n${contexto.catalogo.map(p => `- ${p.nome} (${p.categoria}): R$ ${formatarValor(p.precoCents)}`).join("\n")}`
    : "";

  const instrucaoPedido = contexto.storefrontUrl
    ? `Para fazer pedidos, oriente o cliente a acessar: ${contexto.storefrontUrl}`
    : "Para fazer pedidos, oriente o cliente a entrar em contato diretamente com a loja.";

  return `Você é o atendente virtual da ${contexto.storeName}. Responda de forma humana, direta e simpática em português brasileiro. Nunca mencione que é uma IA ou assistente virtual.

${linhaCliente}
${linhaPedido}
${secaoCatalogo}

${instrucaoPedido}

Regras:
- Seja breve, porem simpatico (máximo 3 linhas por resposta)
- Use os dados do pedido acima para responder dúvidas sobre status e entrega
- Se o cliente quiser fazer um pedido, informe o link acima de forma simpática
- Se não souber algo com certeza, seja honesto e oriente o cliente
- Nunca invente preços, prazos ou promoções que não foram informados
- Linguagem descontraída mas profissional`;
}

export async function responderCliente(params: {
  mensagem: string;
  historico: MensagemHistorico[];
  contexto: ContextoCliente;
}): Promise<string> {
  if (!OPENROUTER_KEY) {
    console.warn("[ai-chat] OPENROUTER_API_KEY não configurada");
    return "Desculpe, nosso assistente está temporariamente indisponível. Entre em contato pelo WhatsApp.";
  }

  const { mensagem, historico, contexto } = params;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": "https://vendza.com.br",
      "X-Title": "Vendza",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt(contexto) },
        ...historico.slice(-6), // últimas 3 trocas para contexto
        { role: "user", content: mensagem },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error(`[ai-chat] OpenRouter error ${res.status}:`, err);
    return "Não consegui processar sua mensagem agora. Tente novamente em instantes.";
  }

  const json = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };

  return json.choices[0]?.message?.content?.trim()
    ?? "Desculpe, não consegui responder agora. Tente novamente.";
}
