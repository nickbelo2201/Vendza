# Automações — Índice

Documento canônico:
- [`docs/19-automacoes-whatsapp-n8n.md`](./docs/19-automacoes-whatsapp-n8n.md) — estratégia completa do agente WhatsApp "Carlos" (n8n + IA) para a Adega Ideal: arquitetura, persona, endpoints, anti-bloqueio, custos, roadmap.

## Resumo de 1 minuto

| Item | Valor |
|---|---|
| Plataforma WhatsApp | **Meta Cloud API oficial** (Z-API só como fallback) |
| Setup one-time | R$ 9.729 (12x R$ 810) |
| Custo operacional Vendza | R$ 458/mês (3 primeiros meses com Z-API fallback) → R$ 304/mês (após) |
| Cobrança Vendza ao cliente | R$ 597/mês (margem 23% → 49% após mês 4) |
| Economia vs 1 CLT | R$ 2.396/mês (-80%) |
| Payback | 4,1 meses |
| Custo por conversa | R$ 0,20 (humano: R$ 3,00) |
| Risco bloqueio número | **Baixíssimo** (Meta oficial; quality rating reversível) |

## Componentes

1. **n8n self-host (Railway)** — workflow principal (29 nodes), status reativo (9 nodes), cupons (10 nodes)
2. **Meta Cloud API** desde o dia 1 (oficial, tier free 1.000 conv/mês, R$ 0,26/conv serviço acima)
3. **Z-API** mantido configurado como fallback de emergência (chaveio em <30min via env var)
4. **OpenRouter Gemini 2.0 Flash** — AI Agent Carlos com 5 tools
5. **Vendza API** — 7 endpoints novos em `/v1/integrations/*` + 3 webhooks outbound
6. **Persona Carlos** — atendente humano, breve, educado, max 1 emoji/msg
7. **Templates HSM** — 8 templates aprovados pela Meta para mensagens ativas (status, cupom, opt-out)

## Status

- [ ] Aprovação do dono da Adega Ideal (custo R$ 597/mês + setup R$ 9.729)
- [ ] Coleta das informações pendentes (§13 do doc principal)
- [ ] Fase 0 — setup Meta Business Manager + verificação número (5-7 dias úteis, em paralelo)
- [ ] Fase 1 — implementação MVP (semana de 2026-05-04)

Para detalhes técnicos, copy do Carlos, roadmap completo e relatório financeiro, veja o [doc 19](./docs/19-automacoes-whatsapp-n8n.md).
