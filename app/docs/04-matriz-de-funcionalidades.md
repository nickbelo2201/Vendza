# Matriz de Funcionalidades

> Atualizado em 2026-04-07. Mercado Pago promovido para P0 crítico, alinhado ao modelo de negócio premium.

## Legenda

- `V1` / `V2`: completo (ver prd.json)
- `P3–P5`: deploy, QA, polish — em progresso
- `Onda2`: WhatsApp automação (tier R$ 1.500/mês)
- `Onda3`: IA e escala (tier R$ 2.500–3.000/mês)

---

## Cliente e Descoberta

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| Cliente | Gate de maioridade | V1 | ✅ | Segmento de bebida exige isso |
| Cliente | Endereço manual e validação de cobertura | V1 | ✅ | Sem isso não existe checkout confiável |
| Cliente | Geolocalização assistida | V1.1 | ✅ | Melhora onboarding do cliente |
| Cliente | Home com categorias e destaques | V1 | ✅ | Base de conversão |
| Cliente | Busca simples | V1 | ✅ | Descoberta rápida |
| Cliente | Repetir pedido | V1 | ✅ | Recorrência fácil |
| Cliente | Favoritos | Onda2 | — | Conveniência |

---

## Catálogo e Merchandising

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| Catálogo | CRUD de produtos | V1 | ✅ | Básico operacional |
| Catálogo | Categorias | V2 | ✅ | Organização comercial |
| Catálogo | Fotos e descrições | V2 | ✅ | Conversão |
| Catálogo | Upload de imagem (Supabase Storage) | V2 | ✅ | Catálogo visual |
| Catálogo | Preço promocional | V1 | ✅ | Giro e oferta |
| Catálogo | Destaque de produto | V1 | ✅ | Impulso visual |
| Catálogo | Variantes | Onda2 | — | Tamanho, pack, litragem |
| Catálogo | Relacionados / cross-sell | Onda3 | — | IA-assisted |

---

## Carrinho e Checkout

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| Checkout | Carrinho editável | V1 | ✅ | Fluxo central |
| Checkout | Taxa e total claros | V1 | ✅ | Evita abandono |
| Checkout | Observação do pedido | V1 | ✅ | Operação prática |
| Checkout | Dinheiro | V1 | ✅ | Necessário para loja local |
| Checkout | Cartão na entrega | V1 | ✅ | Cobertura de operação |
| **Checkout** | **Pix automático via Mercado Pago** | **P0** | **🔴 CRÍTICO** | **Core de receita — deve ir antes do piloto** |
| **Checkout** | **Cartão online via Mercado Pago** | **P0** | **🔴 CRÍTICO** | **Não perder venda** |
| Checkout | Webhook de pagamento confirmado | P0 | 🔴 CRÍTICO | Fecha o loop automaticamente |
| Checkout | Cupom | Onda2 | — | Growth simples |
| Checkout | Agendamento | Onda2 | — | Pedido para mais tarde |

---

## Tracking e Atendimento

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| Tracking | Timeline de status | V1 | ✅ | Transparência para cliente |
| Tracking | Atualização em tempo real (Socket.io) | V2 | ✅ | Diferencial de UX |
| Atendimento | Link WhatsApp contextual | V1 | ✅ | Canal nativo do negócio |
| Atendimento | Pedido assistido via operador | V2 | ✅ | Canal real de adega |
| Atendimento | WhatsApp automação de status | Onda2 | — | Tier R$ 1.500/mês |
| Atendimento | Chat automatizado com IA | Onda3 | — | Tier R$ 2.500/mês |

---

## Cockpit Operacional

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| Pedidos | Board em tempo real | V2 | ✅ | Melhor que lista pesada da Neemo |
| Pedidos | Filtros e busca | V2 | ✅ | Velocidade de operação |
| Pedidos | Detalhe completo do pedido | V2 | ✅ | Sem regressão frente ao mercado |
| Pedidos | Mudança de status | V2 | ✅ | Operação central |
| Pedidos | Notificação sonora | V2 | ✅ | Operação responsiva |
| Pedidos | Criação manual pelo parceiro | V2 | ✅ | Pedidos via WhatsApp/telefone |
| Pedidos | Exportação CSV | V2 | ✅ | Backoffice |
| Pedidos | Impressão | Onda2 | — | Pode entrar rápido |

---

## Loja, Entrega e Governança

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| Loja | Branding básico | V1 | ✅ | White-label de verdade |
| Loja | Horários por dia e turno (UI visual) | V2 | ✅ | Operação de madrugada |
| Loja | Toggle aberta/fechada | V2 | ✅ | Controle operacional |
| Loja | Retirada | V1 | ✅ | Canal recorrente |
| Entrega | Área por bairro | V1 | ✅ | Implementação simples e útil |
| Entrega | Área por raio | V1 | ✅ | Cobertura melhor |
| Entrega | Pedido mínimo | V1 | ✅ | Regra comercial básica |
| Entrega | Frete grátis por valor | V1 | ✅ | Conversão |
| Loja | Usuários e papéis | V1 | ✅ | Dono e operador coexistem |
| Loja | Multi-loja | Onda3 | — | Escala, não piloto |

---

## CRM, Growth e Analytics

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| CRM | Perfil do cliente | V1 | ✅ | Base de memória de compra |
| CRM | Histórico de pedidos | V1 | ✅ | Valor imediato |
| CRM | Total gasto + ticket médio | V2 | ✅ | Prioridade comercial |
| CRM | Última compra | V1 | ✅ | Reativação |
| CRM | Flag de inatividade | V1 | ✅ | Diferencial real |
| CRM | Tags e notas | V1 | ✅ | Operação humana |
| CRM | Drawer de detalhe do cliente | V2 | ✅ | Visão completa |
| CRM | Segmentação RFM | Onda2 | — | Inteligência acionável |
| CRM | Campanhas por evento | Onda2 | — | Vencer a Neemo |
| Growth | Fidelidade | Onda2 | — | Recorrência |
| Growth | Programa de indicação | Onda2 | — | CAC zero |
| Analytics | Dashboard operacional | V2 | ✅ | Gestão diária |
| Analytics | Relatórios por período | V2 | ✅ | Leitura de negócio |
| Analytics | Insights automáticos (IA) | Onda3 | — | Tier premium |

---

## Integrações e Plataforma

| Domínio | Funcionalidade | Versão | Status | Motivo |
|---------|---------------|--------|--------|--------|
| **Integração** | **Mercado Pago (Pix + cartão)** | **P0** | **🔴 CRÍTICO** | **Core de receita — antecipar** |
| Integração | Supabase Storage (imagens) | V2 | ✅ | Catálogo e banners |
| Integração | Socket.io (realtime) | V2 | ✅ | Board de pedidos |
| Integração | WhatsApp oficial (Baileys/WAHA) | Onda2 | — | Tier R$ 1.500/mês |
| Integração | NFe | Onda3 | — | Maturidade operacional |
| Plataforma | Multi-tenant self-service | Onda2 | — | Onboarding sem o fundador |
| Plataforma | Mobile app (React Native) | Onda3 | — | Após validação |
| Plataforma | IA por agentes de domínio | Onda3 | — | Tier R$ 2.500/mês |

---

## Deploy e Infraestrutura

| Domínio | Funcionalidade | Story | Status | Motivo |
|---------|---------------|-------|--------|--------|
| Deploy | web-client + web-partner na Vercel | P3-01 | 🔄 Pendente | Produção |
| Deploy | API na Railway | P3-02 | 🔄 Pendente | Produção |
| CI | GitHub Actions (typecheck + build) | P3-03 | 🔄 Pendente | Qualidade |
| QA | Playwright — fluxo cliente | P4-01 | 🔄 Pendente | Confiabilidade |
| QA | Playwright — fluxo parceiro | P4-02 | 🔄 Pendente | Confiabilidade |
