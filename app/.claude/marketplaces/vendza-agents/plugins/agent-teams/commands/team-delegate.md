---
description: "Task delegation dashboard for managing team workload, assignments, and rebalancing"
argument-hint: "[team-name] [--assign task-id=member-name] [--message member-name 'content'] [--rebalance]"
---

# Delegado da equipe

Gerencie atribuições de tarefas e carga de trabalho da equipe. Fornece um painel de delegação mostrando tarefas não atribuídas, cargas de trabalho de membros, tarefas bloqueadas e sugestões de reequilíbrio.

## Verificações pré-voo

1. Analise `$ARGUMENTS` para o nome da equipe e sinalizadores de ação:
   - `--assign task-id=member-name`: atribui uma tarefa específica a um membro
   - `--message member-name 'content'`: envia uma mensagem para um membro específico
   - `--rebalance`: analisa e reequilibra a distribuição da carga de trabalho

2. Leia a configuração da equipe em `~/.claude/teams/{team-name}/config.json` usando a ferramenta Read
3. Chame `TaskList` para obter o estado atual

## Ação: Atribuir Tarefa

Se o sinalizador `--assign` for fornecido:

1. Analisar o ID da tarefa e o nome do membro no formato `task-id=member-name`
2. Use `TaskUpdate` para definir o proprietário da tarefa
3. Use `SendMessage` com `type: "message"` para notificar o membro:
   - destinatário: nome do membro
   - content: "Você recebeu a tarefa #{id}: {subject}. {task description}"
4. Confirme: "Tarefa #{id} atribuída a {member-name}"

## Ação: Enviar mensagem

Se o sinalizador `--message` for fornecido:

1. Analisar o nome do membro e o conteúdo da mensagem
2. Use `SendMessage` com `type: "message"`:
   - destinatário: nome do membro
   - conteúdo: o conteúdo da mensagem
3. Confirme: "Mensagem enviada para {member-name}"

## Ação: Reequilíbrio

Se o sinalizador `--rebalance` for fornecido:

1. Analise a distribuição atual da carga de trabalho:
   - Contar tarefas por membro (em andamento + atribuídas pendentes)
   - Identificar membros com 0 tarefas (ocioso)
   - Identifique membros com mais de 3 tarefas (sobrecarregados)
   - Verifique se há tarefas bloqueadas que podem ser desbloqueadas

2. Gere sugestões de reequilíbrio:

   ```
   ## Workload Analysis

   Member          Tasks    Status
   â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   implementer-1   3        overloaded
   implementer-2   1        balanced
   implementer-3   0        idle

   Suggestions:
   1. Move task #5 from implementer-1 to implementer-3
   2. Assign unassigned task #7 to implementer-3
   ```

3. Peça confirmação ao usuário antes de executar o rebalanceamento
4. Execute movimentos aprovados com `TaskUpdate` e `SendMessage`

## Padrão: Painel de delegação

Se nenhum sinalizador de ação for fornecido, exiba o painel de delegação completo:

```
## Delegation Dashboard: {team-name}

### Unassigned Tasks
  #5  Review error handling patterns
  #7  Add integration tests

### Member Workloads
  implementer-1   3 tasks (1 in_progress, 2 pending)
  implementer-2   1 task  (1 in_progress)
  implementer-3   0 tasks (idle)

### Blocked Tasks
  #6  Blocked by #4 (in_progress, owner: implementer-1)

### Suggestions
  - Assign #5 to implementer-3 (idle)
  - Assign #7 to implementer-2 (low workload)
```

**Dica**: Use Shift+Tab para entrar no modo de delegação integrado do Claude Code para delegação de tarefas ad hoc.

