---
name: team-communication-protocols
description: Structured messaging protocols for agent team communication including message type selection, plan approval, shutdown procedures, and anti-patterns to avoid. Use this skill when establishing team communication norms, handling plan approvals, or managing team shutdown.
version: 1.0.2
---

# Protocolos de comunicação de equipe

Protocolos para comunicação eficaz entre colegas de equipe de agentes, incluindo seleção de tipo de mensagem, fluxos de trabalho de aprovação de planos, procedimentos de desligamento e antipadrões comuns a serem evitados.

## Quando usar esta habilidade

- Estabelecendo normas de comunicação para uma nova equipe
- Escolhendo entre tipos de mensagens (mensagem, transmissão, shutdown_request)
- Lidando com fluxos de trabalho de aprovação de plano
- Gerenciando o desligamento normal da equipe
- Descobrindo identidades e capacidades de colegas de equipe

## Seleção do tipo de mensagem

### `message` (mensagem direta) - escolha padrão

Envie para um único colega de equipe específico:

```json
{
  "type": "message",
  "recipient": "implementer-1",
  "content": "Your API endpoint is ready. You can now build the frontend form.",
  "summary": "API endpoint ready for frontend"
}
```

**Use para**: atualizações de tarefas, coordenação, dúvidas, notificações de integração.

### `broadcast` — Use com moderação

Envie para TODOS os colegas de equipe simultaneamente:

```json
{
  "type": "broadcast",
  "content": "Critical: shared types file has been updated. Pull latest before continuing.",
  "summary": "Shared types updated"
}
```

**Use SOMENTE para**: Bloqueadores críticos que afetam a todos, grandes mudanças nos recursos compartilhados.

**Por que com moderação?**: cada transmissão envia N mensagens separadas (uma por colega de equipe), consumindo recursos de API proporcionais ao tamanho da equipe.

### `shutdown_request` — Encerramento Gracioso

Solicite que um colega de equipe desligue:

```json
{
  "type": "shutdown_request",
  "recipient": "reviewer-1",
  "content": "Review complete, shutting down team."
}
```

O colega de equipe responde com `shutdown_response` (aprovar ou rejeitar com razão).

## Antipadrões de comunicação

| Antipadrão | Problema | Melhor abordagem |
| --------------------------------------- | ---------------------------------------- | -------------------------------------- |
| Transmitindo atualizações de rotina | Desperdício de recursos, ruído | Mensagem direta ao colega afetado |
| Enviando mensagens de status JSON | Não projetado para dados estruturados | Use TaskUpdate para atualizar o status da tarefa |
| Não comunicar nos pontos de integração | Colegas de equipe constroem em interfaces obsoletas | Mensagem quando sua interface estiver pronta |
| Microgerenciamento via mensagens | Sobrecarrega os colegas de equipe, retarda o trabalho | Faça check-in em marcos, não em todas as etapas |
| Usando UUIDs em vez de nomes | Difícil de ler, sujeito a erros | Sempre use nomes de companheiros de equipe |
| Ignorando companheiros de equipe ociosos | Capacidade desperdiçada | Atribuir novo trabalho ou encerrar |

## Fluxo de trabalho de aprovação do plano

Quando um companheiro de equipe é gerado com `plan_mode_required`:

1. Teammate cria um plano usando ferramentas de exploração somente leitura
2. O colega de equipe chama `ExitPlanMode` que envia um `plan_approval_request` ao lead
3. O lead analisa o plano
4. O lead responde com `plan_approval_response`:

**Aprovar**:

```json
{
  "type": "plan_approval_response",
  "request_id": "abc-123",
  "recipient": "implementer-1",
  "approve": true
}
```

**Rejeitar com feedback**:

```json
{
  "type": "plan_approval_response",
  "request_id": "abc-123",
  "recipient": "implementer-1",
  "approve": false,
  "content": "Please add error handling for the API calls"
}
```

## Protocolo de desligamento

### Sequência de desligamento elegante

1. **Lead envia shutdown_request** para cada colega de equipe
2. **Teammate recebe solicitação** como uma mensagem JSON com `type: "shutdown_request"`
3. **O companheiro de equipe responde** com `shutdown_response`:
   - `approve: true` — Teammate salva o estado e sai
   - `approve: false` + motivo — companheiro de equipe continua trabalhando
4. **O lead lida com as rejeições** — Espere o colega de equipe terminar e tente novamente
5. **Depois que todos os companheiros de equipe desligarem** — Chame a limpeza do `Teammate`

### Lidando com rejeições

Se um colega de equipe rejeitar o desligamento:

- Verifique o motivo (geralmente "ainda trabalhando na tarefa")
- Aguarde a conclusão da tarefa atual
- Tentar novamente a solicitação de desligamento
- Se for urgente, o usuário pode forçar o desligamento

## Descoberta de companheiros de equipe

Encontre membros da equipe lendo o arquivo de configuração:

**Local**: `~/.claude/teams/{team-name}/config.json`

**Estrutura**:

```json
{
  "members": [
    {
      "name": "security-reviewer",
      "agentId": "uuid-here",
      "agentType": "team-reviewer"
    },
    {
      "name": "perf-reviewer",
      "agentId": "uuid-here",
      "agentType": "team-reviewer"
    }
  ]
}
```

**Sempre use `name`** para mensagens e atribuição de tarefas. Nunca use `agentId` diretamente.

