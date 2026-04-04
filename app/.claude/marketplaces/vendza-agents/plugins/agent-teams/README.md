# Plug-in de equipes de agentes

Orquestre equipes multiagentes para revisão paralela de código, depuração baseada em hipóteses e desenvolvimento coordenado de recursos usando o recurso experimental [Equipes de agentes](h) do Claude Code.

## Configurar

### Pré-requisitos

1. Ative o recurso experimental de equipes de agentes:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

2. Configure o modo de exibição de companheiros de equipe em `~/.claude/settings.json`:

```json
{
  "teammateMode": "tmux"
}
```

Modos de exibição disponíveis:

- `"tmux"` — Cada colega de equipe é executado em um painel tmux (recomendado)
- `"iterm2"` — Cada colega de equipe recebe uma guia iTerm2 (somente macOS)
- `"in-process"` — Colegas de equipe executam no mesmo processo (padrão)

### Instalação

Primeiro, adicione o mercado (se ainda não o fez):

```
/plugin marketplace add wshobson/agents
```

Em seguida, instale o plugin:

```
/plugin install agent-teams@claude-code-workflows
```

## Características

- **Equipes predefinidas** — Crie equipes pré-configuradas para fluxos de trabalho comuns (revisão, depuração, recurso, pilha completa, pesquisa, segurança, migração)
- **Revisão de código com vários revisores** — Revisão paralela nas dimensões de segurança, desempenho, arquitetura, testes e acessibilidade
- **Depuração baseada em hipóteses** — Investigação de hipóteses concorrentes com análise de causa raiz baseada em evidências
- **Desenvolvimento de recursos paralelos** — Implementação multiagente coordenada com limites de propriedade de arquivos
- **Pesquisa Paralela** — Vários agentes do Explore investigam diferentes questões ou áreas de base de código simultaneamente
- **Auditoria de segurança** — Revisão abrangente de segurança paralela em OWASP, autenticação, dependências e configuração
- **Suporte à migração** — Migração coordenada da base de código com fluxos de implementação paralelos e verificação de correção
- **Coordenação de Tarefas** — Gerenciamento de tarefas com reconhecimento de dependência e balanceamento de carga de trabalho
- **Comunicação em equipe** — Protocolos de mensagens estruturados para colaboração eficiente dos agentes

## Comandos

| Comando | Descrição |
| ---------------- | ---------------------------------------------------------- |
| `/team-spawn` | Gere uma equipe usando predefinições ou composição personalizada |
| `/team-status` | Exibir membros da equipe, tarefas e progresso |
| `/team-shutdown` | Encerre uma equipe normalmente e libere recursos |
| `/team-review` | Revisão de código paralelo com vários revisores |
| `/team-debug` | Depuração de hipóteses concorrentes com investigação paralela |
| `/team-feature` | Desenvolvimento paralelo de recursos com propriedade de arquivo |
| `/team-delegate` | Painel de delegação de tarefas e gerenciamento de carga de trabalho |

## Agentes

| Agente | Função | Cor |
| ------------------ | --------------------------------------------------------------------------------- | ------ |
| `team-lead` | Orquestrador de equipes — decompõe o trabalho, gerencia o ciclo de vida, sintetiza resultados | Azul |
| `team-reviewer` | Revisor de código multidimensional – opera na dimensão de revisão atribuída |
| `team-debugger` | Investigador de hipóteses — reúne evidências para confirmar/falsificar a hipótese atribuída |
| `team-implementer` | Construtor paralelo — implementa dentro de limites estritos de propriedade de arquivos |

## Habilidades

| Habilidade | Descrição |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `team-composition-patterns` | Heurísticas de dimensionamento de equipes, composições predefinidas, seleção de tipo de agente |
| `task-coordination-strategies` | Decomposição de tarefas, gráficos de dependência, monitoramento de carga de trabalho |
| `parallel-debugging` | Geração de hipóteses, coleta de evidências, arbitragem de resultados |
| `multi-reviewer-patterns` | Revise a alocação de dimensões, encontre desduplicação, calibração de severidade |
| `parallel-feature-development` | Estratégias de propriedade de arquivos, prevenção de conflitos, padrões de integração |
| `team-communication-protocols` | Seleção do tipo de mensagem, fluxo de trabalho de aprovação do plano, protocolo de desligamento |

## Início rápido

### Revisão de código com vários revisores

```
/team-review src/ --reviewers security,performance,architecture
```

Gera três revisores, cada um analisando a base de código a partir da dimensão atribuída e, em seguida, consolida as descobertas em um relatório priorizado.

### Depuração baseada em hipóteses

```
/team-debug "API returns 500 on POST /users with valid payload" --hypotheses 3
```

Gera 3 hipóteses concorrentes, gera investigadores para cada uma, coleta evidências e apresenta a causa raiz mais provável com uma correção.

### Desenvolvimento de recursos paralelos

```
/team-feature "Add user authentication with OAuth2" --team-size 3 --plan-first
```

Decompõe o recurso em fluxos de trabalho com limites de propriedade de arquivo, obtém sua aprovação e, em seguida, gera implementadores para construir em paralelo.

### Pesquisa Paralela

```
/team-spawn research --name codebase-research
```

Gera três pesquisadores para investigar diferentes aspectos em paralelo - em sua base de código (Grep/Read) e na web (WebSearch/WebFetch). Cada um relata descobertas com citações.

### Auditoria de segurança

```
/team-spawn security
```

Gera 4 revisores de segurança cobrindo vulnerabilidades OWASP, controle de autenticação/acesso, cadeia de suprimentos de dependência e segredos/configuração. Produz um relatório de segurança consolidado.

### Migração de base de código

```
/team-spawn migration --name react-hooks-migration
```

Gera um lead para planejar a migração, dois implementadores para migrar o código em fluxos paralelos e um revisor para verificar a exatidão do código migrado.

### Equipe personalizada

```
/team-spawn custom --name my-team --members 4
```

Configure interativamente a composição da equipe com funções e tipos de agentes personalizados.

## Melhores Práticas

1. **Comece com predefinições** — Use `/team-spawn review`, `/team-spawn debug` ou `/team-spawn feature` antes de criar equipes personalizadas
2. **Use `--plan-first`** — Para desenvolvimento de recursos, sempre revise a decomposição antes de gerar implementadores
3. **A propriedade do arquivo é crítica** — Nunca atribua o mesmo arquivo a vários implementadores; use contratos de interface nos limites
4. **Monitore com `/team-status`** — Verifique o progresso regularmente e use `/team-delegate --rebalance` se o trabalho estiver irregular
5. **Desligamento normal** — Sempre use `/team-shutdown` em vez de encerrar processos manualmente
6. **Mantenha equipes pequenas** — 2 a 4 colegas de equipe é o ideal; equipes maiores aumentam a sobrecarga de coordenação
7. **Use Shift+Tab** — O modo de delegação integrado do Claude Code (Shift+Tab) complementa esses comandos para delegação ad-hoc

