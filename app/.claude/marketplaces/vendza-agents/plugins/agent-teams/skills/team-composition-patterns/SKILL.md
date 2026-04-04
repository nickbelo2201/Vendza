---
name: team-composition-patterns
description: Design optimal agent team compositions with sizing heuristics, preset configurations, and agent type selection. Use this skill when deciding team size, selecting agent types, or configuring team presets for multi-agent workflows.
version: 1.0.2
---

# Padrões de composição de equipe

Melhores práticas para compor equipes multiagentes, selecionar tamanhos de equipes, escolher tipos de agentes e configurar modos de exibição para o recurso Equipes de Agentes do Claude Code.

## Quando usar esta habilidade

- Decidir quantos companheiros de equipe gerar para uma tarefa
- Escolhendo entre configurações de equipe predefinidas
- Selecionando o tipo de agente correto (subagent_type) para cada função
- Configurando modos de exibição de colegas de equipe (tmux, iTerm2, em processo)
- Criação de composições de equipe personalizadas para fluxos de trabalho fora do padrão

## Heurísticas de dimensionamento de equipe

| Complexidade | Tamanho da equipe | Quando usar |
| ------------ | --------- | ----------------------------------------------------------- |
| Simples | 1-2 | Revisão unidimensional, bug isolado, pequeno recurso |
| Moderado | 2-3 | Alterações em vários arquivos, 2-3 preocupações, recursos médios |
| Complexo | 3-4 | Preocupações transversais, grandes recursos, depuração profunda |
| Muito Complexo | 4-5 | Recursos full-stack, análises abrangentes, problemas sistêmicos |

**Regra prática**: comece com a menor equipe que cubra todas as dimensões necessárias. Adicionar companheiros de equipe aumenta a sobrecarga de coordenação.

## Composições de equipe predefinidas

### Equipe de revisão

- **Tamanho**: 3 revisores
- **Agentes**: 3x `team-reviewer`
- **Dimensões padrão**: segurança, desempenho, arquitetura
- **Use quando**: alterações de código precisam de avaliação de qualidade multidimensional

### Equipe de depuração

- **Tamanho**: 3 investigadores
- **Agentes**: 3x `team-debugger`
- **Hipóteses padrão**: 3 hipóteses concorrentes
- **Use quando**: Bug tem múltiplas causas raiz plausíveis

### Equipe de recursos

- **Tamanho**: 3 (1 líder + 2 implementadores)
- **Agentes**: 1x `team-lead` + 2x `team-implementer`
- **Usar quando**: o recurso pode ser decomposto em fluxos de trabalho paralelos

### Equipe Fullstack

- **Tamanho**: 4 (1 líder + 3 implementadores)
- **Agentes**: 1x `team-lead` + 1x frontend `team-implementer` + 1x backend `team-implementer` + 1x teste `team-implementer`
- **Use quando**: o recurso abrange camadas de front-end, back-end e teste

### Equipe de Pesquisa

- **Tamanho**: 3 pesquisadores
- **Agentes**: 3x `general-purpose`
- **Áreas padrão**: cada uma recebe uma pergunta, módulo ou tópico de pesquisa diferente
- **Capacidades**: Pesquisa de base de código (Grep, Glob, Read), pesquisa na web (WebSearch, WebFetch)
- **Use quando**: precisa entender uma base de código, pesquisar bibliotecas, comparar abordagens ou coletar informações de código e fontes da web em paralelo

### Equipe de segurança

- **Tamanho**: 4 revisores
- **Agentes**: 4x `team-reviewer`
- **Dimensões padrão**: OWASP/vulnerabilidades, autenticação/controle de acesso, dependências/cadeia de suprimentos, segredos/configuração
- **Use quando**: auditoria de segurança abrangente cobrindo diversas superfícies de ataque

### Equipe de Migração

- **Tamanho**: 4 (1 líder + 2 implementadores + 1 revisor)
- **Agentes**: 1x `team-lead` + 2x `team-implementer` + 1x `team-reviewer`
- **Usar quando**: Grande migração de base de código (atualização de estrutura, porta de idioma, aumento de versão de API) que exige trabalho paralelo com verificação de correção

## Seleção do tipo de agente

Ao gerar companheiros de equipe com a ferramenta Tarefa, escolha `subagent_type` com base nas ferramentas que o companheiro de equipe precisa:

| Tipo de Agente | Ferramentas disponíveis | Usar para |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------- |
| `general-purpose` | Todas as ferramentas (leitura, gravação, edição, Bash, etc.) | Implementação, depuração, qualquer tarefa que exija alterações de arquivo |
| `Explore` | Ferramentas somente leitura (Read, Grep, Glob) | Pesquisa, exploração de código, análise |
| `Plan` | Ferramentas somente leitura | Planejamento de arquitetura, decomposição de tarefas |
| `agent-teams:team-reviewer` | Todas as ferramentas | Revisão de código com descobertas estruturadas |
| `agent-teams:team-debugger` | Todas as ferramentas | Investigação baseada em hipóteses |
| `agent-teams:team-implementer` | Todas as ferramentas | Construindo recursos dentro dos limites de propriedade de arquivos |
| `agent-teams:team-lead` | Todas as ferramentas | Orquestração e coordenação de equipes |

**Principal distinção**: Agentes somente leitura (Explorar, Planejar) não podem modificar arquivos. Nunca atribua tarefas de implementação a agentes somente leitura.

## Configuração do modo de exibição

Configure em `~/.claude/settings.json`:

```json
{
  "teammateMode": "tmux"
}
```

| Modo | Comportamento | Melhor para |
| -------------- | ------------------------------ | ------------------------------------------------- |
| `"tmux"` | Cada companheiro de equipe em um painel tmux | Fluxos de trabalho de desenvolvimento, monitoramento de múltiplos agentes |
| `"iterm2"` | Cada colega de equipe em uma guia iTerm2 | Usuários do macOS que preferem o iTerm2 |
| `"in-process"` | Todos os colegas de equipe no mesmo processo | Tarefas simples, ambientes CI/CD |

## Diretrizes de equipe personalizadas

Ao construir equipes personalizadas:

1. **Toda equipe precisa de um coordenador** — Designe um `team-lead` ou peça ao usuário que coordene diretamente
2. **Corresponder funções aos tipos de agentes** — Use agentes especializados (revisor, depurador, implementador) quando disponíveis
3. **Evite funções duplicadas** — Dois agentes fazendo a mesma coisa desperdiçam recursos
4. **Defina limites antecipadamente** — Cada colega de equipe precisa ter uma propriedade clara de arquivos ou responsabilidades
5. **Mantenha o número pequeno** — 2 a 4 companheiros de equipe é o ponto ideal; 5+ requer uma sobrecarga significativa de coordenação

