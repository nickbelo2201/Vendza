# AUDITORIA COMPLETA DA JORNADA DO USUÁRIO — VENDZA

**Data da Auditoria:** 14 de abril de 2026  
**Demo Prevista:** 15 de abril de 2026  
**Status Geral:** ⚠️ PRONTA COM RESSALVAS — Vários pontos de fricção P0 identificados

---

## 1. MAPA DE TELAS

### Web-Client (Vitrine — Porta 3000)

| Rota | Função | Status | Notas |
|------|--------|--------|-------|
| `/` | Homepage — catálogo de produtos | ✅ FUNCIONAL | Carrega categorias e produtos via API; filtro por categoria |
| `/produto/[slug]` | Detalhe do produto | ✅ FUNCIONAL | Mostra descrição, preço, imagem; botão "Adicionar ao carrinho" |
| `/checkout` | Checkout e criação de pedido | ⚠️ FUNCIONAL c/ bugs | Tela branca ao carregar; sem feedback de erro no frete |
| `/pedidos/[publicId]` | Rastreamento de pedido | ⚠️ FUNCIONAL c/ bug | Timeline estática; não atualiza em tempo real |
| `/minha-conta` | Histórico de pedidos | ✅ FUNCIONAL | Busca por telefone; paginação; "pedir de novo" |
| `/perfil` | Gerenciamento de perfil e endereços | ✅ FUNCIONAL | localStorage; até 3 endereços |
| `/loading.tsx` | Fallback de carregamento | ⚠️ BÁSICO | Texto simples sem skeleton |
| `/error.tsx` | Tratamento de erro | ⚠️ BÁSICO | Mensagem genérica |

### Web-Partner (Dashboard Lojista — Porta 3001)

| Rota | Função | Status | Notas |
|------|--------|--------|-------|
| `/(auth)/login` | Login do parceiro | ✅ FUNCIONAL | Integrado com Supabase; sem rate-limiting |
| `/(auth)/cadastro` | Registro de novo lojista | ✅ FUNCIONAL | Wizard de onboarding |
| `/(dashboard)/` | Dashboard principal | ⚠️ FUNCIONAL c/ bug | Cartas vazias se API falha; sem skeleton |
| `/(dashboard)/pedidos` | Listagem de pedidos | ✅ FUNCIONAL | Filtro por status; exportar CSV; drawer de detalhes |
| `/(dashboard)/catalogo` | Gerenciamento de produtos | ✅ FUNCIONAL | CRUD completo; importar CSV |
| `/(dashboard)/estoque` | Controle de inventário | ✅ FUNCIONAL | Movimentações; alertas de baixo estoque |
| `/(dashboard)/clientes` | CRM de clientes | ✅ FUNCIONAL | Busca; detalhes; notas; tags |
| `/(dashboard)/configuracoes` | Configurações da loja | ✅ FUNCIONAL | Dados bancários; horários; zonas de entrega |
| `/(dashboard)/relatorios` | Relatórios e KPIs | ✅ FUNCIONAL | Gráficos; drill-down |
| `/(dashboard)/caixa` | PDV — Ponto de venda | ✅ FUNCIONAL | Abertura/fechamento de caixa |
| `/(dashboard)/financeiro` | Extrato financeiro | ✅ FUNCIONAL | KPIs; gráfico de pagamentos |
| `/(dashboard)/promocoes` | Gerenciamento de promoções | ✅ FUNCIONAL | CRUD de promoções |
| `/(dashboard)/pdv` | Interface PDV alternativa | ✅ FUNCIONAL | Pedidos manuais |
| `/onboarding` | Wizard de onboarding | ✅ FUNCIONAL | Guia passo-a-passo |

---

## 2. PONTOS DE FRICÇÃO

### 🔴 CRÍTICOS (Impacto Alto na Demo)

#### C1. Tela Branca no Checkout
- **Arquivo:** `apps/web-client/src/app/checkout/page.tsx` (~linha 202-204)
- **Problema:** Quando `carrinhoCarregando=true`, retorna `null` — tela fica em branco por até 3s
- **Impacto:** Cliente clica em checkout e vê tela branca — parece quebrado
- **Fix:** Mostrar skeleton/spinner em vez de `null`

#### C2. Sem Feedback de Erro no Cálculo de Frete
- **Arquivo:** `apps/web-client/src/app/checkout/page.tsx` (~linha 85-101)
- **Problema:** Se API falha, `setFreteInfo(null)` silenciosamente — usuário não sabe o que aconteceu
- **Impacto:** Usuário preenche CEP, nada acontece, não sabe se é erro dele ou da loja
- **Fix:** Mostrar mensagem de erro em caso de falha

#### C3. Dashboard sem Proteção de Middleware
- **Arquivo:** `apps/web-partner/src/app/(dashboard)/layout.tsx` (~linha 10-35)
- **Problema:** Verificação de acesso acontece DEPOIS de renderizar; URL acessível sem auth antes do redirect
- **Impacto:** Flash de conteúdo não autorizado; UX confusa
- **Fix:** Middleware Supabase bloqueando ANTES de renderizar

#### C4. ProductImage sem next/image
- **Arquivo:** `apps/web-client/src/components/ProductImage.tsx` (~linha 70-82)
- **Problema:** Usa `<img>` sem otimização; sem lazy-loading; sem fallback consistente
- **Impacto:** Performance ruim; experiência visual inconsistente
- **Fix:** Migrar para `next/image` com placeholder blur

#### C5. Sem Sanitização de Input no Checkout
- **Arquivo:** `apps/web-client/src/app/checkout/page.tsx` (~linha 224-263)
- **Problema:** Campos enviados diretamente sem validação frontend
- **Impacto:** Risco de XSS; erros de validação só no backend sem mensagem clara
- **Fix:** Implementar validação com Zod antes do POST

---

### 🟡 MÉDIOS

#### M1. Empty State Ausente no Dashboard
- **Arquivo:** `apps/web-partner/src/app/(dashboard)/page.tsx`
- **Problema:** Se `summary` é null (API falhou), metric cards ficam vazios
- **Fix:** Skeleton placeholders enquanto carrega

#### M2. Sem Suspense em Rotas Pesadas
- **Arquivo:** `apps/web-partner/src/app/(dashboard)/pedidos/page.tsx`
- **Problema:** `getPedidos()` é await síncrono; API lenta = página congelada
- **Fix:** Usar `Suspense` para carregar pedidos progressivamente

#### M3. Imagens sem next/image no Header
- **Arquivo:** `apps/web-client/src/components/Header.tsx` (~linha 139-143)
- **Problema:** Logo usa `<img>` sem otimização
- **Fix:** `next/image` com `priority`

#### M4. Mensagens de Erro Genéricas
- **Arquivo:** `apps/web-client/src/app/checkout/page.tsx` (~linha 194-195)
- **Problema:** Erro de pedido mostra mensagem genérica sem contexto
- **Fix:** Mapear códigos de erro para mensagens amigáveis

#### M5. OrderTracker Status Estático
- **Arquivo:** `apps/web-client/src/app/pedidos/[publicId]/page.tsx`
- **Problema:** Timeline não atualiza em tempo real; cliente precisa recarregar
- **Fix:** Polling a cada 5-10s no Client Component

---

### 🟢 BAIXOS

#### B1. loading.tsx Muito Genérico — texto sem skeleton
#### B2. Sem confirmação antes de mudar status de pedido
#### B3. Sem máscara de telefone no checkout
#### B4. Sem validação de email como campo obrigatório

---

## 3. PROBLEMAS DE PERFORMANCE

| # | Problema | Arquivo | Impacto | Fix |
|---|---------|---------|---------|-----|
| P1 | Duas chamadas HTTP separadas na homepage (config + catalog) | `lib/api.ts` | +1 RTT na homepage | Combinar em `/bootstrap` |
| P2 | ProductImage sem lazy-loading | `ProductImage.tsx` | Carrega imagens off-screen | `next/image` com `fill` |
| P3 | `Promise.all()` nas configurações — falha de 1 bloqueia toda página | `configuracoes/page.tsx` | Página inteira falha se um endpoint falha | Suspense independente por seção |

---

## 4. VULNERABILIDADES DE SEGURANÇA

### 🔴 Críticas

| # | Vulnerabilidade | Localização | Ação |
|---|-----------------|-------------|------|
| S1 | Bearer token em localStorage (XSS risk) | `web-partner/lib/api.ts` | HttpOnly cookies (requer backend) |
| S2 | Sem sanitização de input no checkout | `checkout/page.tsx` | Validação Zod frontend + backend |
| S3 | CORS não verificado | API config | Confirmar `Access-Control-Allow-Origin` restrito |

### 🟡 Médias

| # | Vulnerabilidade | Localização | Ação |
|---|-----------------|-------------|------|
| S4 | Sem rate-limiting no login | `login/page.tsx` | Desabilitar botão após 3 falhas |
| S5 | Dados de cliente em localStorage sem encriptação | `perfil/page.tsx` | Encriptar ou usar session storage |
| S6 | Sem Helmet.js na API | `api/app.ts` | Registrar `@fastify/helmet` |

---

## 5. GAPS NA JORNADA DO USUÁRIO

### Cliente Final (Web-Client)

| Etapa | Status | Gap |
|-------|--------|-----|
| Acessar vitrine | ✅ | loading.tsx sem skeleton |
| Navegar categorias | ✅ | Sem breadcrumb entre categorias |
| Ver produto | ✅ | Sem recomendações relacionadas |
| Adicionar ao carrinho | ✅ | Sem toast de confirmação |
| Ir para checkout | ⚠️ | **TELA BRANCA** ao carregar |
| Preencher dados | ⚠️ | Sem máscara de telefone; sem erros inline |
| Calcular frete | ⚠️ | **SEM FEEDBACK** de erro |
| Criar pedido | ✅ | Sem proteção contra duplicação |
| Rastrear pedido | ⚠️ | **STATUS ESTÁTICO** — não atualiza |

### Lojista (Web-Partner)

| Etapa | Status | Gap |
|-------|--------|-----|
| Login | ✅ | Sem 2FA; sem rate-limiting |
| Ver dashboard | ⚠️ | **CARTAS VAZIAS** se API falha |
| Filtrar pedidos | ✅ | Sem busca por cliente; sem filtro por data |
| Mudar status | ✅ | Sem confirmação antes de mudar |
| Gerenciar catálogo | ✅ | Sem ordenação; sem bulk edit |
| Configurar loja | ✅ | Sem mapa visual para zonas de entrega |

---

## 6. RECOMENDAÇÕES PRIORITÁRIAS

### P0 — Fazer ANTES da Demo (estimativa: ~2h)

1. **[C1] Fixar tela branca no checkout** — skeleton/spinner quando `carrinhoCarregando=true`
2. **[C2] Feedback de erro no frete** — mensagem visível quando cálculo falha
3. **[M1] Skeleton no dashboard** — evitar cartas vazias se API falha
4. **[C5] Validação básica no checkout** — pelo menos nome, telefone obrigatórios
5. **[M5] Polling no OrderTracker** — atualizar status a cada 10s

### P1 — Fazer HOJE se houver tempo (~3h)

6. **[M2] Suspense em rotas pesadas** — pedidos, configurações
7. **[S4] Rate-limiting no login** — desabilitar botão após 3 falhas
8. **[C4] next/image em ProductImage** — lazy-loading e otimização
9. **[M4] Mensagens de erro amigáveis** — mapear códigos de API

### P2 — Para próximo sprint

10. **[S1]** HttpOnly cookies para Bearer token
11. **[P1]** Combinar endpoints de homepage em `/bootstrap`
12. **[S6]** Registrar @fastify/helmet na API
13. **[B1]** Skeleton no loading.tsx

---

## 7. RESUMO EXECUTIVO

### O que funciona bem ✅
- Fluxo completo de compra (home → produto → carrinho → checkout → rastreamento)
- Dashboard lojista com Kanban, métricas, estoque, relatórios
- Autenticação com Supabase
- API bem estruturada com envelope padrão
- Design visual consistente

### O que pode quebrar na demo ⚠️
- **Checkout** carrega com tela branca por 1-3s
- **Frete** falha sem mensagem de erro (parece congelado)
- **Dashboard** pode ficar vazio se API responde lentamente
- **Status de pedido** não atualiza sem recarregar a página

### Recomendação
**Corrigir os 5 itens P0 antes da demo.** Com essas correções, a plataforma estará apta para demonstração sem quebras visíveis. Os itens P1 e P2 não são bloqueadores para demo.
