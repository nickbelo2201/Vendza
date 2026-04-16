import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// ─── Cenário: 50 usuários fazendo checkout ao mesmo tempo ───────────────────
// Simula o pico de conversão durante campanhas: clientes enviando pedidos
// com dados de entrega, calculando frete e criando pedidos.

export const options = {
  scenarios: {
    checkout_simultaneo: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 25 },  // ramp up para 25 VUs
        { duration: "1m",  target: 50 },  // sobe para 50 VUs
        { duration: "2m",  target: 50 },  // mantém por 2 minutos
        { duration: "30s", target: 0 },   // ramp down
      ],
    },
  },
  thresholds: {
    // Checkout pode ter latência maior — p95 < 1s é aceitável
    http_req_duration: ["p(95)<1000"],
    http_req_failed: ["rate<0.01"],
    "latencia_checkout": ["p(95)<800"],
  },
};

const API_URL = __ENV.API_URL || "https://vendza-production.up.railway.app";

// Telefones de teste — cada VU usa um número único para evitar conflito de cliente
const PREFIXO_TELEFONE = "119";

const latenciaCheckout = new Trend("latencia_checkout");
const errosCriacao = new Rate("erros_criacao_pedido");

function gerarTelefone(vuId) {
  // Gera telefone único por VU para simular clientes diferentes
  const sufixo = String(vuId).padStart(7, "0");
  return `${PREFIXO_TELEFONE}${sufixo}`;
}

export default function () {
  const telefone = gerarTelefone(__VU);

  // 1. Simular cliente abrindo a vitrine e buscando produto
  const prodRes = http.get(`${API_URL}/v1/catalog/products?pagina=1&limite=5`, {
    tags: { endpoint: "catalog_products_checkout_flow" },
  });
  check(prodRes, {
    "produtos disponíveis": (r) => r.status === 200 || r.status === 503,
  });

  sleep(1);

  // 2. Calcular frete (quando zona de entrega está configurada)
  const fretePayload = JSON.stringify({
    neighborhood: "Centro",
    items: [{ productId: "produto-teste", quantity: 2 }],
  });
  const freteRes = http.post(`${API_URL}/v1/storefront/quote`, fretePayload, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "storefront_quote" },
  });
  check(freteRes, {
    "frete: resposta recebida": (r) => [200, 400, 422, 503].includes(r.status),
  });

  sleep(0.5);

  // 3. Criar pedido (endpoint mais crítico — POST com corpo completo)
  const pedidoPayload = JSON.stringify({
    customer: {
      name: `Cliente Teste ${__VU}`,
      phone: telefone,
      email: `teste${__VU}@k6test.invalid`,
    },
    items: [
      { productId: "produto-inexistente-k6", quantity: 1, unitPriceCents: 5000 },
    ],
    deliveryAddress: {
      street: "Rua de Teste",
      number: "123",
      neighborhood: "Centro",
      city: "São Paulo",
      state: "SP",
    },
    paymentMethod: "pix",
    deliveryFee: 0,
  });

  const startTime = Date.now();
  const pedidoRes = http.post(`${API_URL}/v1/storefront/orders`, pedidoPayload, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "storefront_orders" },
  });
  latenciaCheckout.add(Date.now() - startTime);

  // Aceita 201 (criado), 400/422 (validação — produto não existe em staging),
  // 503 (loja não configurada). Falha apenas em 500.
  const checkoutOk = check(pedidoRes, {
    "checkout: sem erro 500": (r) => r.status !== 500,
    "checkout: resposta < 1s": (r) => r.timings.duration < 1000,
  });
  errosCriacao.add(!checkoutOk);

  sleep(2);
}
