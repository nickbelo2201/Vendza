# Load Tests — Vendza

Scripts k6 para testar performance da API antes de campanhas promocionais.

## Instalação do k6

```bash
# macOS
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6

# Via Docker (sem instalação)
docker run --rm -i grafana/k6 run - <script.js
```

---

## Scripts disponíveis

| Script | Cenário | VUs máx. | Duração |
|--------|---------|----------|---------|
| `catalogo.js` | 100 usuários navegando o catálogo | 100 | ~4min |
| `checkout.js` | 50 usuários fazendo checkout simultâneo | 50 | ~4min |
| `status-update.js` | 20 lojistas atualizando status de pedido | 20 | ~4min |

---

## Como rodar

### Catálogo (sem autenticação)

```bash
# Contra produção
k6 run -e API_URL=https://vendza-production.up.railway.app loadtest/catalogo.js

# Contra staging/localhost
k6 run -e API_URL=http://localhost:3333 loadtest/catalogo.js
```

### Checkout (sem autenticação)

```bash
k6 run -e API_URL=https://vendza-production.up.railway.app loadtest/checkout.js
```

### Status Update (requer autenticação)

1. Faça login no web-partner (https://web-partner-three.vercel.app/login)
2. Abra o DevTools → Application → Local Storage
3. Copie o `access_token` do item `sb-<project>-auth-token`
4. Execute:

```bash
k6 run \
  -e API_URL=https://vendza-production.up.railway.app \
  -e PARTNER_TOKEN="eyJ..." \
  loadtest/status-update.js
```

---

## Thresholds de alerta

| Métrica | Threshold | Significado |
|---------|-----------|-------------|
| `http_req_duration p(95)` | < 500ms (catálogo/status) | 95% das requests abaixo de 500ms |
| `http_req_duration p(95)` | < 1000ms (checkout) | Checkout pode ter latência maior |
| `http_req_failed` | < 1% | Taxa de erro máxima aceitável |
| `latencia_listagem p(95)` | < 400ms | Endpoint de produtos é o mais crítico |
| `latencia_checkout p(95)` | < 800ms | Criação de pedido |
| `latencia_status_update p(95)` | < 400ms | Operação crítica do lojista |

---

## Baseline esperado (produção com Redis ativo)

Medido na infraestrutura Railway (free tier):

| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| `GET /v1/storefront/config` (com cache) | ~20ms | ~50ms | ~100ms |
| `GET /v1/catalog/categories` (com cache) | ~20ms | ~50ms | ~100ms |
| `GET /v1/catalog/products` (com cache) | ~25ms | ~60ms | ~120ms |
| `GET /v1/catalog/products` (sem cache) | ~80ms | ~200ms | ~400ms |
| `POST /v1/storefront/orders` | ~100ms | ~300ms | ~600ms |
| `PATCH /v1/partner/orders/:id/status` | ~80ms | ~200ms | ~400ms |

> **Importante:** valores sem Redis (REDIS_URL não configurada) serão 3-5x mais lentos
> porque cada request faz query completa no banco. Confirmar Redis ativo antes da campanha.

---

## Quando rodar

- **Antes de campanhas:** pelo menos 48h antes de Black Friday, Dia dos Pais, Natal
- **Após deploy de mudanças críticas:** qualquer alteração em rotas de checkout ou status
- **Após mudanças de infraestrutura:** escalonamento de Railway, mudança de plano

---

## Interpretando os resultados

```
✓ http_req_duration.............: avg=45ms  p(95)=180ms  p(99)=380ms
✓ http_req_failed...............: 0.00%
✓ latencia_listagem.............: avg=40ms  p(95)=160ms

scenarios: (100.00%) 1 scenario, 100 max VUs, 4m30s max duration
```

- `✓` = threshold passou
- `✗` = threshold falhou — investigar antes da campanha
- `avg` = média (pode ser enganosa se houver outliers)
- `p(95)` = 95% das requests foram mais rápidas que esse valor — use este como referência
- `p(99)` = apenas 1% das requests foram mais lentas — identifica casos extremos
