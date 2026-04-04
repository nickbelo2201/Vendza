# Padrões de gráfico de dependência

Padrões visuais para design de dependência de tarefas com compensações.

## Padrão 1: Totalmente Independente (Paralelismo Máximo)

```
Task A â”€â”
Task B â”€â”¼â”€â†’ Final Integration
Task C â”€â”˜
```

- **Paralelismo**: Máximo — todas as tarefas são executadas simultaneamente
- **Risco**: A integração pode revelar incompatibilidades tardiamente
- **Usar quando**: as tarefas operam em arquivos/módulos completamente separados
- **TaskCreate**: Nenhum relacionamento bloqueadoBy; tarefa de integração bloqueada por todos

## Padrão 2: Cadeia Sequencial (Sem Paralelismo)

```
Task A â†’ Task B â†’ Task C â†’ Task D
```

- **Paralelismo**: Nenhum — cada tarefa aguarda a anterior
- **Risco**: Gargalo em cada etapa; cascatas de um atraso
- **Use quando**: Cada tarefa depende do resultado da anterior (evite se possível)
- **TaskCreate**: cada tarefa bloqueada pela anterior

## Padrão 3: Diamante (Fundação Compartilhada)

```
           â”Œâ†’ Task B â”€â”
Task A â”€â”€â†’ â”¤          â”œâ†’ Task D
           â””â†’ Task C â”€â”˜
```

- **Paralelismo**: B e C são executados em paralelo após a conclusão de A
- **Risco**: A é um gargalo; D deve esperar por B e C
- **Use quando**: B e C precisam de saída de A (por exemplo, tipos compartilhados)
- **TaskCreate**: B e C bloqueados por A; D bloqueadoPor B e C

## Padrão 4: Fork-Join (paralelismo em fases)

```
Phase 1:  A1, A2, A3  (parallel)
          â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Phase 2:  B1, B2      (parallel, after phase 1)
          â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Phase 3:  C1          (after phase 2)
```

- **Paralelismo**: dentro de cada fase, as tarefas são paralelas
- **Risco**: limites de fase adicionam atrasos de sincronização
- **Usar quando**: Fases naturais com dependências (construção → teste → implantação)
- **TaskCreate**: tarefas da Fase 2 bloqueadas por todas as tarefas da Fase 1

## Padrão 5: Pipeline (Streaming)

```
Task A â”€â”€â†’ Task B â”€â”€â†’ Task C
  â””â”€â”€â†’ Task D â”€â”€â†’ Task E
```

- **Paralelismo**: Duas cadeias paralelas
- **Risco**: As cadeias podem divergir na abordagem
- **Usar quando**: duas ramificações de recursos independentes de um ponto de partida comum
- **TaskCreate**: B bloqueado por A; D bloqueado por A; C bloqueado por B; E bloqueadoPor D

## Antipadrões

### Dependência Circular (Impasse)

```
Task A â†’ Task B â†’ Task C â†’ Task A  âœ— DEADLOCK
```

**Correção**: extraia a dependência compartilhada em uma tarefa separada da qual todos os três dependem.

### Dependências desnecessárias

```
Task A â†’ Task B â†’ Task C
(where B doesn't actually need A's output)
```

**Correção**: Remova o relacionamento bloqueadoBy; deixe B correr de forma independente.

### Padrão de estrela (gargalo único)

```
     â”Œâ†’ B
A â†’  â”œâ†’ C  â†’ F
     â”œâ†’ D
     â””â†’ E
```

**Correção**: se A for lento, todas as tarefas posteriores serão atrasadas. Tente paralelizar o trabalho de A.
