---
description: "Display team members, task status, and progress for an active agent team"
argument-hint: "[team-name] [--tasks] [--members] [--json]"
---

# Status da equipe

Exiba o estado atual de uma equipe de agentes ativos, incluindo membros, tarefas e progresso.

## Fase 1: Descoberta da Equipe

1. Analise `$ARGUMENTS` para o nome da equipe e bandeiras:
   - Se o nome da equipe for fornecido, use-o diretamente
   - Se não houver nome de equipe, verifique `~/.claude/teams/` para equipes ativas
   - Se existirem várias equipes e nenhum nome for especificado, liste todas as equipes e peça ao usuário para escolher
   - `--tasks`: mostra apenas detalhes da tarefa
   - `--members`: mostra apenas detalhes dos membros
   - `--json`: gera JSON bruto em vez de tabela formatada

2. Leia a configuração da equipe em `~/.claude/teams/{team-name}/config.json` usando a ferramenta Read
3. Chame `TaskList` para obter o estado atual da tarefa

## Fase 2: Exibição de Status

### Tabela de Membros

Exiba cada membro da equipe com seu estado atual:

```
Team: {team-name}
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

Members:
  Name              Role              Status
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  security-rev      team-reviewer     working on task #2
  perf-rev          team-reviewer     idle
  arch-rev          team-reviewer     working on task #4
```

### Tabela de Tarefas

Exibir tarefas com status, responsável e dependências:

```
Tasks:
  ID   Status        Owner           Subject
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  #1   completed     security-rev    Review auth module
  #2   in_progress   security-rev    Review API endpoints
  #3   completed     perf-rev        Profile database queries
  #4   in_progress   arch-rev        Analyze module structure
  #5   pending       (unassigned)    Consolidate findings

Progress: 40% (2/5 completed)
```

### Saída JSON

Se o sinalizador `--json` estiver definido, produza a configuração bruta da equipe e a lista de tarefas como JSON.
