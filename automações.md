# Catálogo de Automações — Vendza
> Result as a Service: R$3.000 implementação · R$1.000/mês recorrência

**Data:** 2026-04-16  
**Versão:** 1.0  
**Gerado por:** Time de Automação (Backend Architect + CPO + Especialista em Varejo Local)

---

## Por que automações justificam o preço

O software sozinho é commodity. O que justifica R$1.000/mês é o resultado que as automações entregam. Estimativa conservadora de impacto mensal:

| Automação | Resultado Mensurável |
|---|---|
| Reativação de clientes inativos | +R$600–1.200 em receita recuperada |
| Redução de perda por vencimento | +R$300 em margem protegida |
| Happy hour automático | +R$400–800 em horário morto |
| Zero ruptura de estoque | +R$200 em vendas salvas |
| Onboarding de novos clientes | +15–25% de taxa de segunda compra |

**ROI mínimo conservador: R$1.500–2.500/mês de impacto para o dono.**  
O cliente paga R$1.000 e ganha R$1.500–2.500. Isso é Result as a Service.

---

## Infraestrutura técnica disponível

O sistema já possui a fundação para todas as automações:
- **BullMQ + Redis** — filas de jobs e workers já configurados (workers com TODOs prontos para implementar)
- **Eventos disponíveis** — `order.placed` e `order.status_changed` já disparam nas filas
- **Dados de cliente** — `lastOrderAt`, `birthDate`, `totalSpentCents`, `CustomerTag`, histórico completo de pedidos
- **Gatilhos de estoque** — `safetyStock`, `currentStock`, `InventoryMovement` imutável
- **WhatsApp pronto** — `Store.whatsappPhone` e `Customer.phone` armazenados, workers aguardam implementação
- **Provider recomendado** — Evolution API ou Z-API (ecossistema brasileiro, sem burocracia da Meta)

---

## Classificação por Prioridade

```
TIER 1 — Implementar primeiro    ROI > 300%  · Complexidade baixa/média
TIER 2 — Implementar na sequência  ROI 150–300% · Complexidade média
TIER 3 — Implementar após V2      ROI 100–150% · Complexidade alta
```

---

# TIER 1 — Automações de Alto Impacto Imediato

> Estas 8 automações sozinhas justificam R$1.000/mês. Implementar primeiro.

---

## 1. Confirmação Inteligente de Pedido

**Função:** Notificar o cliente automaticamente a cada mudança de status do pedido, eliminando ligações de "cadê meu pedido?".

**Fluxo:**
1. Cliente finaliza pedido no app → WhatsApp imediato: *"Pedido #123 recebido! Estamos preparando tudo para você. Total: R$47,90."*
2. Parceiro muda status para "em preparo" → mensagem: *"Seu pedido está sendo separado com carinho."*
3. Status "saiu para entrega" → mensagem com nome do entregador + previsão de chegada
4. Status "entregue" → mensagem: *"Entregue! Obrigado pela preferência. Como foi tudo?"*
5. Se status não mudar em 15min após confirmação → alerta interno para o dono

**ROI:** Reduz 40% das ligações de confirmação. Aumenta percepção de profissionalismo (NPS +10–15%).  
**Complexidade:** 2/5 — workers BullMQ já existem com TODOs prontos  
**Gatilho técnico:** `order.placed` e `order.status_changed` (já nas filas)

---

## 2. Reativação de Clientes Inativos

**Função:** Identificar clientes que compravam regularmente mas desapareceram, e disparar mensagem personalizada para trazê-los de volta.

**Fluxo:**
1. Job diário analisa todos os clientes com `lastOrderAt` entre 21 e 60 dias atrás
2. Classifica por valor histórico: VIP (ticket médio > R$80), Regular (R$30–80), Ocasional (< R$30)
3. Dispara mensagem segmentada:
   - VIP: *"Saudade, João! Seu Malbec favorito está esperando — entrega grátis hoje."*
   - Regular: *"Faz tempo que você não aparece. 10% de desconto no próximo pedido. Use: VOLTA10"*
   - Ocasional: *"Temos novidades que você vai gostar. Confira o cardápio atualizado."*
4. Se cliente responde → sistema notifica atendente para assumir a conversa
5. Se não responde em 7 dias → segunda tentativa com abordagem diferente (única repetição)

**ROI:** Recupera 20–30% dos inativos. Com 200 clientes/mês, recupera ~12 clientes = R$600–1.200 extras sem custo de aquisição.  
**Complexidade:** 3/5 — cron job diário + segmentação por ticket  
**Gatilho técnico:** `Customer.lastOrderAt` (dado disponível no schema)

---

## 3. Alerta de Estoque Crítico

**Função:** Notificar o dono imediatamente quando um produto campeão de vendas está prestes a acabar, evitando venda perdida.

**Fluxo:**
1. A cada venda processada, sistema verifica: `currentStock <= safetyStock` configurado no produto
2. Se cruzar o limite → WhatsApp imediato para o dono: *"ALERTA: Skol Latão com apenas 3 unidades. Você vende 10/dia."*
3. Se estoque chegar a zero → produto oculto automaticamente no app do cliente
4. Ao dono registrar reposição → produto reativado automaticamente + confirmação enviada

**ROI:** Elimina ruptura de estoque dos produtos A (top 20% de receita). Cada ruptura = venda perdida + risco de churn.  
**Complexidade:** 2/5 — `safetyStock` já existe no schema, falta apenas o job  
**Gatilho técnico:** `InventoryMovement.type = 'sale'` → verifica `currentStock`

---

## 4. Follow-up Pós-Entrega + Coleta de NPS

**Função:** Coletar satisfação automaticamente após cada entrega e agir imediatamente em caso de cliente insatisfeito.

**Fluxo:**
1. Pedido marcado como entregue → aguarda 30 minutos → mensagem: *"Tudo certo com seu pedido #123? De 1 a 5, como foi a experiência?"*
2. Resposta 1–2 → alerta imediato para o dono + mensagem de retorno: *"Sinto muito pelo transtorno. Me conta o que aconteceu, quero resolver."*
3. Resposta 3 → agradecimento simples + pergunta sobre o que melhorar
4. Resposta 4–5 → *"Que ótimo! Indica nossa loja para um amigo? Você ganha R$10 de crédito quando ele fizer o primeiro pedido."*
5. Dashboard exibe NPS consolidado por semana/mês

**ROI:** Cliente que reclama e é atendido tem 70% de chance de voltar. Identifica problemas antes de virar churn silencioso.  
**Complexidade:** 2/5 — extensão do worker `order.status_changed`  
**Gatilho técnico:** `Order.status = 'delivered'`

---

## 5. Happy Hour Automático

**Função:** Disparar promoção nos horários de menor movimento para equilibrar a operação e aumentar faturamento total.

**Fluxo:**
1. Dono configura no painel: horário, desconto e produtos elegíveis (ex: "cervejas, seg-qui, 14h–17h, 15% OFF")
2. No horário configurado → mensagem para clientes ativos nos últimos 30 dias: *"Happy Hour na Adega! Cervejas com 15% OFF das 14h às 17h. Pedido mínimo R$30."*
3. Ao fazer pedido no período → desconto aplicado automaticamente no checkout
4. Ao fim do período → relatório automático: "Happy hour gerou X pedidos e R$Y de faturamento"

**ROI:** Aumenta 40% o volume de vendas no horário morto. Distribui melhor a operação e reduz custo de entrega por pedido.  
**Complexidade:** 3/5 — cron no horário + filtragem por segmento de cliente  
**Gatilho técnico:** Cron BullMQ com `repeat: { cron: configurável pelo dono }`

---

## 6. Relatório de Giro de Produtos (Semanal)

**Função:** Enviar toda segunda-feira um resumo automático de quais produtos vendem bem e quais estão encalhados, sem o dono precisar analisar nada.

**Fluxo:**
1. Todo domingo às 23h → sistema consolida dados de vendas da semana
2. Segunda às 8h → envia WhatsApp para o dono com:
   - Top 5 produtos mais vendidos (volume + receita)
   - Bottom 5 com pior giro (risco de encalhe ou falta)
   - Produtos abaixo do estoque mínimo
   - Sugestão de reposição baseada no ritmo atual
3. Comparativo com a semana anterior ("Heineken +23% vs. semana passada")
4. Destaque automático: *"Seu produto estrela esta semana foi o Eisenbahn Weiss."*

**ROI:** Dono reduz 30% o tempo de decisão de compra. Evita capital preso em produto que não gira.  
**Complexidade:** 2/5 — dados já disponíveis via `GET /v1/partner/estoque` e `reports`  
**Gatilho técnico:** Cron BullMQ todo domingo 23h

---

## 7. Alerta de Produto Próximo ao Vencimento

**Função:** Identificar produtos com validade próxima e acionar promoção automática antes que virem perda.

**Fluxo:**
1. 30 dias antes do vencimento → lista semanal para o dono: "Produtos em risco de vencimento esta semana"
2. 15 dias antes → alerta ativo: *"[Produto] vence em 15 dias. Temos 12 unidades. Criar promoção automática?"*
3. Dono confirma com um toque → sistema cria promoção relâmpago e dispara para clientes que já compraram a categoria
4. 7 dias antes → última tentativa: promoção mais agressiva + disparo para toda a base ativa
5. Produto vendido completamente → alerta de encerramento + quanto evitou de perda

**ROI:** Reduz perda por validade em 50–70%. Se evita R$200/mês em perda, paga 20% da mensalidade sozinha.  
**Complexidade:** 3/5 — requer campo de validade por lote no cadastro de estoque  
**Gatilho técnico:** Cron diário verificando `InventoryItem.expiresAt` (campo a adicionar)

---

## 8. Campanha de Onboarding (Novos Clientes)

**Função:** Garantir que o cliente que comprou pela primeira vez faça uma segunda compra, aumentando a taxa de retenção inicial.

**Fluxo:**
1. Cliente faz primeira compra → tag `novo` aplicada automaticamente
2. D+1 → mensagem de boas-vindas: *"Obrigado por nos escolher, Maria! Como foi tudo? Esperamos que tenha gostado."*
3. D+3 → oferta de segunda compra: *"Sua segunda compra tem 5% de desconto especial. Use: SEGUNDA5 — válido por 7 dias."*
4. D+7 (se não comprou) → lembrete: *"Seu desconto de boas-vindas expira amanhã. Aproveite!"*
5. Se fizer segunda compra → entra no fluxo de cliente ativo

**ROI:** Aumenta taxa de segunda compra de 35% para 55–60%. A segunda compra é o indicador mais importante de retenção de longo prazo.  
**Complexidade:** 2/5 — gatilho no `order.placed` verificando se é o primeiro pedido do cliente  
**Gatilho técnico:** `Order.count({ where: { customerId } }) === 1`

---

# TIER 2 — Automações de Crescimento Sustentável

> Implementar após o Tier 1 estar estável. ROI excelente, complexidade um pouco maior.

---

## 9. Programa de Fidelidade Automático

**Função:** Acumular pontos por compra e comunicar saldo automaticamente, incentivando frequência sem o dono gerenciar nada.

**Fluxo:**
1. A cada R$1 gasto → 1 ponto acumulado (configurável pelo dono)
2. Após cada compra → mensagem automática: *"Você ganhou 47 pontos! Seu saldo agora é 312. Faltam 188 pontos para R$10 de desconto."*
3. Ao atingir a meta → cupom gerado e enviado automaticamente
4. Pontos expiram em 90 dias sem compra → alerta 7 dias antes: *"Seus 312 pontos vencem em 7 dias. Faça um pedido para não perdê-los!"*
5. Dashboard do dono mostra engajamento do programa por mês

**ROI:** Aumenta frequência de compra em 20–35%. Custo de desconto compensado pelo aumento de LTV.  
**Complexidade:** 4/5 — nova tabela `LoyaltyAccount` + lógica de acúmulo

---

## 10. Promoção Automática de Produto Encalhado

**Função:** Identificar produtos parados há muitos dias e criar promoção segmentada automaticamente, sem o dono precisar agir.

**Fluxo:**
1. Sistema detecta produto sem venda há 14+ dias com estoque acima do dobro do mínimo
2. Calcula desconto mínimo para girar sem prejuízo
3. Cria oferta e dispara para clientes que já compraram a categoria: *"Promoção relâmpago! [Produto] hoje por R$X — só enquanto durar."*
4. Se esgotar em menos de 6h → dispara confirmação de encerramento: *"Acabou! Mas tem [produto similar] disponível."*
5. Se não girar em 48h → sugere desconto maior ou descontinuação

**ROI:** Reduz perda por encalhe em 30–50%. Se evita R$300/mês em encalhe, paga 30% da mensalidade.  
**Complexidade:** 3/5 — dados disponíveis em `GET /v1/partner/promocoes`  
**Gatilho técnico:** `promocoes-service.ts` já calcula produtos parados 14 dias

---

## 11. Score de Risco de Churn

**Função:** Pontuar cada cliente com probabilidade de abandonar a loja antes que isso aconteça, para ação preventiva.

**Fluxo:**
1. Algoritmo semanal analisa para cada cliente: dias desde última compra vs. frequência histórica, redução gradual do ticket, ausência de resposta a promoções
2. Classifica: baixo risco / médio / alto risco de abandono
3. Dono recebe lista semanal: *"5 clientes com risco alto esta semana — acionar campanha de reativação?"*
4. Aprovação com um toque → fluxo de reativação disparado automaticamente
5. Dashboard mostra evolução do score ao longo do tempo

**ROI:** Ação preventiva custa 10x menos que recuperar cliente churn. Recupera 20–30% dos clientes em risco.  
**Complexidade:** 3/5 — calculável com dados existentes de `Order.placedAt` + frequência histórica

---

## 12. Campanha de Aniversário do Cliente

**Função:** Enviar oferta exclusiva e personalizada no dia do aniversário do cliente, criando vínculo emocional.

**Fluxo:**
1. Dia do aniversário → mensagem às 9h: *"Feliz aniversário, Carlos! Hoje você ganha 20% de desconto em qualquer pedido — válido só hoje."*
2. Cupom gerado automaticamente e vinculado ao telefone do cliente
3. Se não comprar até 18h → lembrete: *"Seu desconto de aniversário expira à meia-noite!"*
4. Após a compra → nota interna no pedido para o entregador: "Cliente aniversariante hoje — pode adicionar bilhetinho"
5. D+1 → mensagem de agradecimento

**ROI:** Taxa de conversão de 35–45% (vs. 2–5% de promoção genérica). Gera vínculo emocional difícil de precificar.  
**Complexidade:** 2/5 — `Customer.birthDate` já no schema, falta apenas o cron  
**Gatilho técnico:** Cron diário verificando `birthDate` com dia/mês igual ao atual

---

## 13. Segmentação Automática de Clientes (RFM)

**Função:** Classificar todos os clientes automaticamente em grupos por comportamento, base para toda comunicação personalizada.

**Fluxo:**
1. Job semanal roda análise RFM (Recência, Frequência, Monetário) em toda a base
2. Classifica: Novo (1 compra), Ativo (2–5 compras), VIP (6+ compras, ticket alto), Em risco (30+ dias sem comprar), Perdido (60+ dias)
3. Atualiza tags `CustomerTag` automaticamente
4. Dono vê no dashboard: distribuição da base por segmento + evolução ao longo dos meses
5. Cada campanha pode ser direcionada a um segmento específico

**ROI:** Base para todas as automações de CRM. Comunicação segmentada tem 3–5x mais conversão que comunicação em massa.  
**Complexidade:** 2/5 — dados disponíveis, falta apenas cron de segmentação + atualização de tags

---

## 14. Pedido Recorrente Sugerido

**Função:** Detectar padrão de compra recorrente e sugerir o pedido antes mesmo do cliente pensar nisso.

**Fluxo:**
1. Sistema detecta que cliente compra Heineken 600ml toda sexta há 3 semanas consecutivas
2. Quinta-feira às 14h → mensagem: *"Seu Heineken de sempre para o fim de semana? Confirme com 1 para receber amanhã."*
3. Cliente responde "1" → pedido criado automaticamente com endereço e forma de pagamento padrão
4. Se não confirmar até 18h → descarta silenciosamente (sem spam)

**ROI:** Taxa de conversão ~60%. Aumenta previsibilidade de demanda e LTV do cliente recorrente.  
**Complexidade:** 4/5 — análise de padrão temporal por cliente

---

## 15. DRE Simplificado Semanal

**Função:** Gerar resumo financeiro toda segunda-feira sem o dono precisar calcular nada, com comparativos e destaques automáticos.

**Fluxo:**
1. Toda segunda-feira às 8h → consolida semana anterior
2. Envia WhatsApp com resumo: Faturamento bruto | Ticket médio | Pedidos por canal (app/balcão/delivery) | Top categoria | Comparativo semana anterior
3. Destaque automático do produto mais vendido: *"Seu campeão desta semana foi o Eisenbahn Weiss — vendeu 23% mais que na semana passada."*
4. Sugestão de ação quando detecta queda: *"Ticket médio caiu 8%. Considere adicionar combo ou frete grátis acima de R$50."*

**ROI:** Dono tem visão financeira sem planilha ou contador. Identifica tendências antes de virarem problema.  
**Complexidade:** 2/5 — dados já disponíveis via `reports` e `financeiro`

---

# TIER 3 — Automações Avançadas (Pós-V2)

> Complexidade alta, mas diferenciadoras no mercado. Implementar quando Tier 1 e 2 estiverem rodando.

---

## 16. Indicação com Recompensa (Referral)

**Função:** Transformar clientes satisfeitos em canal de aquisição, com rastreamento automático e recompensa para ambos.

**Fluxo:**
1. Após terceira compra → mensagem: *"Indica um amigo e ganhe R$10 de crédito quando ele fizer o primeiro pedido."*
2. Cliente recebe link/código único de indicação
3. Amigo usa o código → ambos ganham crédito automaticamente
4. Indicador recebe notificação: *"Seu amigo Pedro fez o primeiro pedido! R$10 já estão na sua conta."*
5. Dashboard do dono: ranking de indicadores + custo de aquisição por canal

**ROI:** CAC orgânico R$15–20 vs. R$50–80 em mídia paga. 3 novos clientes/mês = ROI de 300%.  
**Complexidade:** 4/5 — tabela de referral + rastreamento + crédito

---

## 17. Clube de Assinatura Mensal

**Função:** Oferecer pacotes recorrentes para clientes frequentes, garantindo receita previsível e LTV maior.

**Fluxo:**
1. Cliente recebe oferta no quinto pedido: *"Pack Cerveja Mensal: 24 latas/mês por R$89 (12% OFF). Entrega automática toda semana."*
2. Cliente assina → pedido criado automaticamente todo mês na data configurada
3. D-3 da renovação → notificação para confirmar ou pausar
4. Cancelamento: um clique, sem burocracia
5. Dashboard mostra MRR de assinantes separado do faturamento transacional

**ROI:** Churn de assinante é 50% menor que cliente transacional. Receita previsível reduz ansiedade do dono.  
**Complexidade:** 4/5 — assinatura recorrente + pagamento automático (requer Mercado Pago V3)

---

## 18. Promoção Baseada em Clima

**Função:** Integrar com API de temperatura e disparar promoção automaticamente em dias quentes ou chuvosos.

**Fluxo:**
1. API de clima consultada a cada 2h (ex: Open-Meteo, gratuita)
2. Temperatura acima de 30°C → dispara às 12h: *"Tá calor! Cerveja gelada com 15% OFF até 18h."*
3. Chuva prevista → dispara: *"Dia de chuva é dia de ficar em casa. Entregamos sem você sair."*
4. Cada disparo registrado no histórico para análise de performance

**ROI:** Aumenta conversão em 20–30% em dias quentes. Venda oportunista de alto impacto.  
**Complexidade:** 3/5 — integração simples via API pública de clima

---

## 19. Calendário de Campanhas Sazonais Automático

**Função:** Preparar e disparar campanhas em datas comemorativas sem o dono precisar lembrar de nada.

**Datas e campanhas pré-configuradas:**

| Data | Campanha Automática |
|---|---|
| Carnaval (5 dias antes) | "Kit Carnaval: cerveja + carvão + salgadinho com 12% OFF" |
| Páscoa | Destaque em vinhos, chocolate e bacalhau |
| Dia das Mães | "Presenteie com um kit especial — montamos do jeito dela" |
| Festa Junina | Cachaça, quentão, milho — campanha temática |
| Dia do Trabalhador | "Você merece! Churrasco completo entregue na porta" |
| Natal (dezembro todo) | Kits presente, espumante, panetone |
| Réveillon | "Espumante para a virada — pedido até 22h, entregamos até meia-noite" |
| Dia do Cliente (15/set) | Desconto especial para toda a base ativa |
| Pós-pagamento (dia 5 e 20) | "Chegou o salário? Reabasteça a geladeira. Frete grátis hoje." |
| Fim de semana (toda sexta) | Produto em destaque com condição especial sex/sáb |

**Fluxo:** 3 dias antes da data → dono recebe preview da campanha para aprovar ou ajustar → disparo automático no horário configurado.

**ROI:** Marketing constante sem esforço manual. Captura todos os momentos de alta demanda do ano.  
**Complexidade:** 3/5 — calendário fixo + sistema de aprovação do dono

---

## 20. Resposta Automática com IA (FAQ no WhatsApp)

**Função:** Responder automaticamente as perguntas mais frequentes dos clientes no WhatsApp, sem intervenção humana.

**Fluxo:**
1. Cliente manda mensagem fora do horário ou em pico de atendimento
2. IA identifica intenção: horário de funcionamento, zona de entrega, status de pedido, cardápio
3. Responde automaticamente com informação atualizada do cadastro da loja
4. Se não souber responder → encaminha para fila humana com contexto da conversa
5. Histórico de perguntas não respondidas exibido no dashboard para o dono treinar o bot

**ROI:** Reduz 40–50% das mensagens repetitivas. Economiza 5–8h/semana de atendimento manual.  
**Complexidade:** 4/5 — integração com LLM + contexto da loja

---

## 21. Despacho Inteligente de Entregadores

**Função:** Agrupar pedidos por região e sugerir rota otimizada para o entregador, reduzindo custo por entrega.

**Fluxo:**
1. Ao acumular 3+ pedidos pendentes ou após 10 minutos → sistema agrupa por bairro/região
2. Notifica entregador: lista de endereços na sequência sugerida por proximidade
3. Entregador confirma cada entrega via app ou WhatsApp bot
4. Cliente recebe notificação quando entregador sai com seu pedido
5. Histórico de tempo de entrega por entregador/rota no dashboard

**ROI:** Reduz custo por entrega, aumenta número de entregas por hora, melhora previsibilidade para o cliente.  
**Complexidade:** 4/5 — agrupamento geográfico + integração com entregador

---

## 22. Recuperação de Carrinho Abandonado

**Função:** Detectar cliente que adicionou itens mas não finalizou o pedido e reengajar automaticamente.

**Fluxo:**
1. Cliente abre app, adiciona itens mas não finaliza em 20 minutos
2. Mensagem automática: *"Esqueceu alguma coisa? Seu carrinho ainda está aqui: [lista dos itens]. Finalizar agora?"*
3. Se não finalizar em mais 2h → mensagem com urgência: *"Estamos reservando seus produtos. Frete grátis se finalizar até hoje."*
4. Se não finalizar → carrinho liberado silenciosamente

**ROI:** Recupera 20–35% dos carrinhos abandonados. Mercado geral recupera 5–8% — a diferença é o WhatsApp.  
**Complexidade:** 3/5 — estado de carrinho em Redis + timeout com job BullMQ

---

# Roadmap de Implementação Sugerido

## Fase 1 — Sprint 1 e 2 (30 dias)
Tier 1 completo: confirmação de pedido, reativação de inativos, alerta de estoque, follow-up pós-entrega, relatório semanal, alerta de vencimento, campanha de onboarding.

**Entregável:** Cliente já sente resultado nos primeiros 30 dias da implementação.

## Fase 2 — Sprint 3 e 4 (60 dias)
Tier 2: programa de fidelidade, promoção de encalhados, score de churn, aniversário, segmentação RFM, DRE semanal.

**Entregável:** Sistema de CRM completamente automatizado rodando sem intervenção.

## Fase 3 — Sprint 5 e 6 (90 dias)
Tier 3 selecionado: indicação com recompensa, calendário sazonal, recuperação de carrinho.

**Entregável:** Motor de crescimento orgânico ativo — clientes novos chegando via indicação, promoções sazonais sem esforço manual.

---

# Dependências Técnicas para Implementação

| O que precisa ser feito | Prioridade | Esforço |
|---|---|---|
| Implementar workers BullMQ (WhatsApp via Evolution API/Z-API) | IMEDIATO | 2–3 dias |
| Adicionar `initScheduledJobs()` ao bootstrap da API | IMEDIATO | 1 dia |
| Adicionar campo `expiresAt` no `InventoryItem` | IMEDIATO | 2h |
| Criar cron de segmentação de clientes + atualização de tags | Sprint 1 | 1 dia |
| Tabela `LoyaltyAccount` + lógica de pontos | Sprint 2 | 2 dias |
| Integração com API de clima (Open-Meteo, gratuita) | Sprint 3 | 4h |
| Sistema de referral com código único | Sprint 3 | 2 dias |
| Clube de assinatura + pagamento recorrente (Mercado Pago) | V3 | — |

---

*Gerado pelo time de automação Vendza — Backend Architect + CPO + Especialista em Varejo Local*
