---
name: task-coordination-strategies
description: Decompose complex tasks, design dependency graphs, and coordinate multi-agent work with proper task descriptions and workload balancing. Use this skill when breaking down work for agent teams, managing task dependencies, or monitoring team progress.
version: 1.0.2
---

# Estratégias de coordenação de tarefas

Estratégias para decompor tarefas complexas em unidades paralelizáveis, projetar gráficos de dependência, escrever descrições de tarefas eficazes e monitorar a carga de trabalho entre equipes de agentes.

## Quando usar esta habilidade

- Dividindo uma tarefa complexa para execução paralela
- Projetando relacionamentos de dependência de tarefas (blockedBy/blocks)
- Escrever descrições de tarefas com critérios de aceitação claros
- Monitoramento e reequilíbrio da carga de trabalho entre colegas de equipe
- Identificando o caminho crítico em um fluxo de trabalho multitarefa

## Estratégias de decomposição de tarefas

### Por camada

Divida o trabalho por camada arquitetônica:

- Componentes de front-end
- Pontos de extremidade da API de back-end
- Migrações/modelos de banco de dados
- Conjuntos de testes

**Ideal para**: recursos full-stack, fatias verticais

### Por componente

Divida o trabalho por componente funcional:

- Módulo de autenticação
- Módulo de perfil de usuário
- Módulo de notificação

**Ideal para**: microsserviços, arquiteturas modulares

### Por preocupação

Dividir o trabalho por preocupação transversal:

- Revisão de segurança
- Avaliação de desempenho
- Revisão de arquitetura

**Ideal para**: revisões de código, auditorias

### Por propriedade de arquivo

Divida o trabalho por limites de arquivo/diretório:

- `src/components/` — Implementador 1
- `src/api/` — Implementador 2
- `src/utils/` — Implementador 3

**Melhor para**: implementação paralela, prevenção de conflitos

## Design gráfico de dependência

### Princípios

1. **Minimize a profundidade da cadeia** — Prefira gráficos largos e superficiais a cadeias profundas
2. **Identifique o caminho crítico** — A cadeia mais longa determina o tempo mínimo de conclusão
3. **Use bloqueadoBy com moderação** — Adicione apenas dependências que sejam realmente necessárias
4. **Evite dependências circulares** — A tarefa A bloqueia os blocos B A é um impasse

### Padrões

**Independente (melhor paralelismo)**:

```
Task A â”€â”
Task B â”€â”¼â”€â†’ Integration
Task C â”€â”˜
```

**Sequencial (dependências necessárias)**:

```
Task A â†’ Task B â†’ Task C
```

**Diamante (misto)**:

```
        â”Œâ†’ Task B â”€â”
Task A â”€â”¤          â”œâ†’ Task D
        â””â†’ Task C â”€â”˜
```

### Usando bloqueadoBy/blocks

```
TaskCreate: { subject: "Build API endpoints" }         â†’ Task #1
TaskCreate: { subject: "Build frontend components" }    â†’ Task #2
TaskCreate: { subject: "Integration testing" }          â†’ Task #3
TaskUpdate: { taskId: "3", addBlockedBy: ["1", "2"] }  â†’ #3 waits for #1 and #2
```

## Práticas recomendadas para descrição da tarefa

Cada tarefa deve incluir:

1. **Objetivo** — O que precisa ser realizado (1-2 frases)
2. **Arquivos de propriedade** — Lista explícita de arquivos/diretórios que este colega de equipe pode modificar
3. **Requisitos** — Resultados ou comportamentos específicos esperados
4. **Contratos de interface** — Como este trabalho se conecta ao trabalho de outros colegas de equipe
5. **Critérios de aceitação** — Como verificar se a tarefa foi realizada corretamente
6. **Limites do escopo** — O que está explicitamente fora do escopo

### Modelo

```
## Objective
Build the user authentication API endpoints.

## Owned Files
- src/api/auth.ts
- src/api/middleware/auth-middleware.ts
- src/types/auth.ts (shared â€” read only, do not modify)

## Requirements
- POST /api/login â€” accepts email/password, returns JWT
- POST /api/register â€” creates new user, returns JWT
- GET /api/me â€” returns current user profile (requires auth)

## Interface Contract
- Import User type from src/types/auth.ts (owned by implementer-1)
- Export AuthResponse type for frontend consumption

## Acceptance Criteria
- All endpoints return proper HTTP status codes
- JWT tokens expire after 24 hours
- Passwords are hashed with bcrypt

## Out of Scope
- OAuth/social login
- Password reset flow
- Rate limiting
```

## Monitoramento de carga de trabalho

### Indicadores de desequilíbrio

| Sinal | Significado | Ação |
| -------------------------- | ------------------- | --------------------------- |
| Colega de equipe ocioso, outros ocupados | Distribuição desigual | Reatribuir tarefas pendentes |
| Colega de equipe preso em uma tarefa | Possível bloqueador | Faça check-in, ofereça ajuda |
| Todas as tarefas bloqueadas | Questão de dependência | Resolva primeiro o caminho crítico |
| Um companheiro de equipe tem 3x outros | Sobrecarregado | Dividir tarefas ou reatribuir |

### Etapas de reequilíbrio

1. Chame `TaskList` para avaliar o estado atual
2. Identifique colegas de equipe ociosos ou sobrecarregados
3. Use `TaskUpdate` para reatribuir tarefas
4. Use `SendMessage` para notificar os colegas de equipe afetados
5. Monitore para melhorar o rendimento
