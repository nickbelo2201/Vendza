import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

// ─── Cenário: 100 usuários navegando o catálogo simultaneamente ─────────────
// Simula o tráfego típico de uma campanha promocional: clientes abrindo
// a vitrine, listando produtos e abrindo detalhes de itens.

export const options = {
  scenarios: {
    navegacao_catalogo: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },   // ramp up para 50 VUs em 30s
        { duration: "1m",  target: 100 },  // sobe para 100 VUs em 1 minuto
        { duration: "2m",  target: 100 },  // mantém 100 VUs por 2 minutos
        { duration: "30s", target: 0 },    // ramp down
      ],
    },
  },
  thresholds: {
    // p95 de latência deve ficar abaixo de 500ms
    http_req_duration: ["p(95)<500"],
    // Taxa de erro deve ser menor que 1%
    http_req_failed: ["rate<0.01"],
    // Latência da listagem de produtos (endpoint crítico)
    "latencia_listagem": ["p(95)<400"],
  },
};

const API_URL = __ENV.API_URL || "https://vendza-production.up.railway.app";

const latenciaListagem = new Trend("latencia_listagem");
const errosTotais = new Rate("erros_totais");

export default function () {
  // 1. Buscar configuração da loja
  const configRes = http.get(`${API_URL}/v1/storefront/config`, {
    tags: { endpoint: "storefront_config" },
  });
  check(configRes, {
    "config: status 200 ou 503": (r) => r.status === 200 || r.status === 503,
  });

  sleep(0.5);

  // 2. Listar categorias
  const catRes = http.get(`${API_URL}/v1/catalog/categories`, {
    tags: { endpoint: "catalog_categories" },
  });
  check(catRes, {
    "categories: status 200 ou 503": (r) => r.status === 200 || r.status === 503,
    "categories: tem envelope data": (r) => {
      try { return JSON.parse(r.body).data !== undefined; } catch { return false; }
    },
  });

  sleep(0.3);

  // 3. Listar produtos (endpoint mais crítico — medir latência separada)
  const startTime = Date.now();
  const prodRes = http.get(`${API_URL}/v1/catalog/products?pagina=1&limite=20`, {
    tags: { endpoint: "catalog_products" },
  });
  latenciaListagem.add(Date.now() - startTime);

  const prodOk = check(prodRes, {
    "products: status 200 ou 503": (r) => r.status === 200 || r.status === 503,
    "products: tem envelope data": (r) => {
      try { return JSON.parse(r.body).data !== undefined; } catch { return false; }
    },
  });
  errosTotais.add(!prodOk);

  sleep(1);

  // 4. Simular busca por termo (25% dos usuários fazem busca)
  if (Math.random() < 0.25) {
    const buscaRes = http.get(`${API_URL}/v1/catalog/products?busca=vinho&limite=20`, {
      tags: { endpoint: "catalog_search" },
    });
    check(buscaRes, {
      "busca: status 200 ou 503": (r) => r.status === 200 || r.status === 503,
    });
    sleep(0.5);
  }

  // 5. Simular filtro por categoria (40% dos usuários filtram)
  if (Math.random() < 0.4) {
    const filtroRes = http.get(`${API_URL}/v1/catalog/products?pagina=1&limite=20`, {
      tags: { endpoint: "catalog_filter" },
    });
    check(filtroRes, {
      "filtro: status 200 ou 503": (r) => r.status === 200 || r.status === 503,
    });
    sleep(0.5);
  }

  sleep(1);
}
