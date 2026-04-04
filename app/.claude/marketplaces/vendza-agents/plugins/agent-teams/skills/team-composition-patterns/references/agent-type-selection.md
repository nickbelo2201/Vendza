# Guia de seleção de tipo de agente

Matriz de decisão para escolher o `subagent_type` correto ao gerar companheiros de equipe.

## Matriz de Decisão

```
Does the teammate need to modify files?
â”œâ”€â”€ YES â†’ Does it need a specialized role?
â”‚         â”œâ”€â”€ YES â†’ Which role?
â”‚         â”‚         â”œâ”€â”€ Code review â†’ agent-teams:team-reviewer
â”‚         â”‚         â”œâ”€â”€ Bug investigation â†’ agent-teams:team-debugger
â”‚         â”‚         â”œâ”€â”€ Feature building â†’ agent-teams:team-implementer
â”‚         â”‚         â””â”€â”€ Team coordination â†’ agent-teams:team-lead
â”‚         â””â”€â”€ NO â†’ general-purpose
â””â”€â”€ NO â†’ Does it need deep codebase exploration?
          â”œâ”€â”€ YES â†’ Explore
          â””â”€â”€ NO â†’ Plan (for architecture/design tasks)
```

## Comparação de tipos de agentes

| Tipo de agente | Pode ler | Pode escrever | Pode editar | Pode bater | Especializado |
| ---------------------------- | -------- | --------- | -------- | -------- | ------------------ |
| uso geral | Sim | Sim | Sim | Sim | Não |
| Explorar | Sim | Não | Não | Não | Pesquisar/explorar |
| Plano | Sim | Não | Não | Não | Arquitetura |
| equipes de agentes:líder de equipe | Sim | Sim | Sim | Sim | Orquestração de equipe |
| equipes de agentes: revisor de equipe | Sim | Sim | Sim | Sim | Revisão de código |
| equipes de agentes:depurador de equipe | Sim | Sim | Sim | Sim | Investigação de bugs |
| equipes de agentes:implementador de equipe | Sim | Sim | Sim | Sim | Construção de recursos |

## Erros Comuns

| Erro | Por que falha | Escolha Correta |
| ------------------------------------- | ------------------------------ | --------------------------------------- |
| Usando `Explore` para implementação | Não é possível gravar/editar arquivos | `general-purpose` ou `team-implementer` |
| Usando `Plan` para tarefas de codificação | Não é possível gravar/editar arquivos | `general-purpose` ou `team-implementer` |
| Usando `general-purpose` para revisões | Sem estrutura de revisão/listas de verificação | `team-reviewer` |
| Usando `team-implementer` para pesquisa | Tem ferramentas, mas foco errado | `Explore` ou `Plan` |

## Quando usar cada um

### uso geral

- Tarefas pontuais que não cabem em funções especializadas
- Tarefas que exigem combinações exclusivas de ferramentas
- Scripting ou automação ad-hoc

### Explorar

- Pesquisa e análise de base de código
- Localizando arquivos, padrões ou dependências
- Entendendo a arquitetura antes de planejar

### Plano

- Projetando abordagens de implementação
- Criando decomposições de tarefas
- Revisão de arquitetura (somente leitura)

### líder de equipe

- Coordenando vários companheiros de equipe
- Decompondo o trabalho e gerenciando tarefas
- Sintetizando resultados de trabalho paralelo

### revisor da equipe

- Revisão de código focada em uma dimensão específica
- Produzindo descobertas estruturadas com classificações de gravidade
- Seguindo listas de verificação específicas de dimensão

### depurador de equipe

- Investigando uma hipótese específica sobre um bug
- Coletando evidências com citações de arquivo:linha
- Relatando níveis de confiança e cadeias causais

### implementador de equipe

- Construindo código dentro dos limites de propriedade de arquivo
- Seguindo contratos de interface
- Coordenação em pontos de integração

