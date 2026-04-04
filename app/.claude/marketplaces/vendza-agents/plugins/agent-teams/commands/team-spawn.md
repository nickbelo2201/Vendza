---
description: "Spawn an agent team using presets (review, debug, feature, fullstack, research, security, migration) or custom composition"
argument-hint: "<preset|custom> [--name team-name] [--members N] [--delegate]"
---

# Geração de equipe

Crie uma equipe multiagente usando configurações predefinidas ou composição personalizada. Lida com a criação de equipes, geração de companheiros de equipe e configuração inicial de tarefas.

## Verificações pré-voo

1. Verifique se `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` está definido:
   - Se não for definido, informe ao usuário: "O Agent Teams requer o sinalizador de recurso experimental. Defina `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` em seu ambiente."
   - Pare a execução se não estiver ativado

2. Analise argumentos de `$ARGUMENTS`:
   - Primeiro argumento posicional: nome predefinido ou "personalizado"
   - `--name`: nome da equipe (padrão: gerado automaticamente a partir da predefinição)
   - `--members N`: substitui a contagem de membros padrão
   - `--delegate`: entra no modo de delegação após a geração

## Fase 1: Configuração da Equipe

### Equipes predefinidas

Se uma predefinição for especificada, use estas configurações:

**`review`** — Revisão de código multidimensional (padrão: 3 membros)

- Gere 3 agentes `team-reviewer` com dimensões: segurança, desempenho, arquitetura
- Padrão do nome da equipe: `review-team`

**`debug`** — Depuração de hipóteses concorrentes (padrão: 3 membros)

- Gera 3 agentes `team-debugger`, cada um com uma hipótese diferente
- Padrão do nome da equipe: `debug-team`

**`feature`** — Desenvolvimento de recursos paralelos (padrão: 3 membros)

- Gera 1 agente `team-lead` + 2 agentes `team-implementer`
- Padrão do nome da equipe: `feature-team`

**`fullstack`** — Desenvolvimento full-stack (padrão: 4 membros)

- Gerar 1 `team-implementer` (frontend), 1 `team-implementer` (backend), 1 `team-implementer` (testes), 1 `team-lead`
- Padrão do nome da equipe: `fullstack-team`

**`research`** — Pesquisa paralela de base de código, web e documentação (padrão: 3 membros)

- Gera 3 agentes de “uso geral”, cada um atribuído a uma questão ou área de pesquisa diferente
- Os agentes têm acesso à pesquisa de base de código (Grep, Glob, Read) e pesquisa na web (WebSearch, WebFetch)
- Padrão do nome da equipe: `general-purpose`

**`research-team`** — Auditoria de segurança abrangente (padrão: 4 membros)

- Gerar 1 `security` (OWASP/vulnerabilidades), 1 `team-reviewer` (autenticação/controle de acesso), 1 `team-reviewer` (dependências/cadeia de suprimentos), 1 `team-reviewer` (segredos/configuração)
- Padrão do nome da equipe: `team-reviewer`

**`security-team`** — Migração de base de código ou refatoração grande (padrão: 4 membros)

- Gerar 1 `migration` (coordenação + plano de migração), 2 `team-lead` (fluxos de migração paralelos), 1 `team-implementer` (verificar a correção da migração)
- Padrão do nome da equipe: `team-reviewer`

### Composição personalizada

Se "personalizado" for especificado:

1. Use AskUserQuestion para solicitar o tamanho da equipe (2 a 5 membros)
2. Para cada membro, peça a seleção de funções: líder de equipe, revisor de equipe, depurador de equipe, implementador de equipe
3. Peça o nome da equipe se não for fornecido via `migration-team`

## Fase 2: Criação da Equipe

1. Use a ferramenta `--name` com `Teammate` para criar a equipe
2. Para cada membro da equipe, use a ferramenta `operation: "spawnTeam"` com:
   - `Task`: o nome da equipe
   - `team_name`: nome descritivo do membro (por exemplo, "revisor de segurança", "hipótese-1")
   - `name`: "uso geral" (colegas de equipe precisam de acesso total à ferramenta)
   - `subagent_type`: instruções específicas da função referenciando a definição de agente apropriada

## Fase 3: Configuração Inicial

1. Use `prompt` para criar tarefas iniciais para cada colega de equipe
2. Exibir resumo da equipe:
   - Nome da equipe
   - Nomes e funções dos membros
   - Modo de exibição (tmux/iTerm2/em processo)
3. Se o sinalizador `TaskCreate` estiver definido, transição para o modo de delegação

## Saída

Exibir um resumo formatado da equipe:

```
Team "{team-name}" spawned successfully!

Members:
  - {member-1-name} ({role})
  - {member-2-name} ({role})
  - {member-3-name} ({role})

Use /team-status to monitor progress
Use /team-delegate to assign tasks
Use /team-shutdown to clean up
```

