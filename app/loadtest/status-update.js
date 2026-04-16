import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// ─── Cenário: 20 lojistas atualizando status de pedido simultaneamente ──────
// Simula o pico operacional durante campanhas: múltiplos atendentes
// confirmando e finalizando pedidos ao mesmo tempo.
//
// ATENÇÃO: Este script requer autenticação real.
// Defina a variável de ambiente PARTNER_TOKEN com um Bearer token válido.
// Exemplo: k6 run -e PARTNER_TOKEN="eyJ..." status-update.js
//
// Para obter o token: faça login no web-partner e copie o access_token
// do localStorage (chave: sb-<project>-auth-token).

export const options = {
  scenarios: {
    atualizacao_status: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 10 },  // ramp up para 10 VUs
        { duration: "1m",  target: 20 },  // sobe para 20 VUs
        { duration: "2m",  target: 20 },  // mantém por 2 minutos
        { duration: "20s", target: 0 },   // ramp down
      ],
    },
  },
  thresholds: {
    // Atualização de status deve ser rápida — é operação crítica do lojista
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
    "latencia_status_update": ["p(95)<400"],
  },
};

const API_URL = __ENV.API_URL || "https://vendza-production.up.railway.app";
const PARTNER_TOKEN = __ENV.PARTNER_TOKEN || "";

const latenciaUpdate = new Trend("latencia_status_update");
const errosUpdate = new Rate("erros_status_update");

// Sequência de transições de status em ordem operacional típica
const TRANSICOES = [
  { de: "pending",    para: "confirmed" },
  { de: "confirmed",  para: "preparing" },
  { de: "preparing",  para: "ready" },
  { de: "ready",      para: "out_for_delivery" },
];

export default function () {
  if (!PARTNER_TOKEN) {
    console.error("PARTNER_TOKEN não definido. Defina via: -e PARTNER_TOKEN=<token>");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${PARTNER_TOKEN}`,
  };

  // 1. Buscar lista de pedidos pendentes
  const ordersRes = http.get(`${API_URL}/v1/partner/orders?status=pending&limite=5`, {
    headers,
    tags: { endpoint: "partner_orders_list" },
  });

  check(ordersRes, {
    "listagem de pedidos: status 200": (r) => r.status === 200,
  });

  if (ordersRes.status !== 200) {
    errosUpdate.add(1);
    sleep(2);
    return;
  }

  let orders = [];
  try {
    const body = JSON.parse(ordersRes.body);
    orders = body.data?.orders ?? body.data ?? [];
  } catch {
    errosUpdate.add(1);
    sleep(2);
    return;
  }

  if (orders.length === 0) {
    // Sem pedidos disponíveis para atualizar — simula espera do lojista
    sleep(3);
    return;
  }

  sleep(0.5);

  // 2. Atualizar status de um pedido aleatório da lista
  const pedido = orders[Math.floor(Math.random() * orders.length)];
  const transicao = TRANSICOES[Math.floor(Math.random() * TRANSICOES.length)];

  const updatePayload = JSON.stringify({
    status: transicao.para,
    note: `Atualização de teste k6 — VU ${__VU}`,
  });

  const startTime = Date.now();
  const updateRes = http.patch(
    `${API_URL}/v1/partner/orders/${pedido.id}/status`,
    updatePayload,
    { headers, tags: { endpoint: "partner_order_status_update" } }
  );
  latenciaUpdate.add(Date.now() - startTime);

  // 200: status atualizado | 400/422: transição inválida (pedido já em outro status)
  // Ambos são respostas válidas — o erro real é 500
  const updateOk = check(updateRes, {
    "update status: sem erro 500": (r) => r.status !== 500,
    "update status: resposta < 500ms": (r) => r.timings.duration < 500,
  });
  errosUpdate.add(!updateOk);

  sleep(2);
}
