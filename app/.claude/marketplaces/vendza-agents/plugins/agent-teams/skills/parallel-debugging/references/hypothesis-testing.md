# Referência de teste de hipóteses

Modelos de tarefas, formatos de evidências e árvores de decisão de arbitragem para depuração paralela.

## Modelo de tarefa de hipótese

```markdown
## Hypothesis Investigation: {Hypothesis Title}

### Hypothesis Statement

{Clear, falsifiable statement about the root cause}

### Failure Mode Category

{Logic Error | Data Issue | State Problem | Integration Failure | Resource Issue | Environment}

### Investigation Scope

- Files to examine: {file list or directory}
- Related tests: {test files}
- Git history: {relevant date range or commits}

### Evidence Criteria

**Confirming evidence** (if I find these, hypothesis is supported):

1. {Observable condition 1}
2. {Observable condition 2}

**Falsifying evidence** (if I find these, hypothesis is wrong):

1. {Observable condition 1}
2. {Observable condition 2}

### Report Format

- Confidence: High/Medium/Low
- Evidence: list with file:line citations
- Causal chain: step-by-step from cause to symptom
- Recommended fix: if confirmed
```

## Modelo de relatório de evidências

```markdown
## Investigation Report: {Hypothesis Title}

### Verdict: {Confirmed | Falsified | Inconclusive}

### Confidence: {High (>80%) | Medium (50-80%) | Low (<50%)}

### Confirming Evidence

1. `src/api/users.ts:47` â€” {description of what was found}
2. `src/middleware/auth.ts:23` â€” {description}

### Contradicting Evidence

1. `tests/api/users.test.ts:112` â€” {description of what contradicts}

### Causal Chain (if confirmed)

1. {First cause} â†’
2. {Intermediate effect} â†’
3. {Observable symptom}

### Recommended Fix

{Specific code change with location}

### Additional Notes

{Anything discovered that may be relevant to other hypotheses}
```

## Árvore de decisão de arbitragem

```
All investigators reported?
â”œâ”€â”€ NO â†’ Wait for remaining reports
â””â”€â”€ YES â†’ Count confirmed hypotheses
          â”œâ”€â”€ 0 confirmed
          â”‚   â”œâ”€â”€ Any medium confidence? â†’ Investigate further
          â”‚   â””â”€â”€ All low/falsified? â†’ Generate new hypotheses
          â”œâ”€â”€ 1 confirmed
          â”‚   â””â”€â”€ High confidence?
          â”‚       â”œâ”€â”€ YES â†’ Declare root cause, propose fix
          â”‚       â””â”€â”€ NO â†’ Flag as likely cause, recommend verification
          â””â”€â”€ 2+ confirmed
              â””â”€â”€ Are they related?
                  â”œâ”€â”€ YES â†’ Compound issue (multiple contributing causes)
                  â””â”€â”€ NO â†’ Rank by confidence, declare highest as primary
```

## Padrões de hipóteses comuns por tipo de erro

### "500 Erro interno do servidor"

1. Exceção não tratada no manipulador de solicitação (erro lógico)
2. Falha na conexão do banco de dados (problema de recursos)
3. Variável de ambiente ausente (ambiente)

### "Condição de corrida/falha intermitente"

1. Mutação de estado compartilhado sem bloqueio (problema de estado)
2. Suposição de ordenação de operação assíncrona (erro lógico)
3. Janela de inatividade do cache (problema de estado)

### "Funciona localmente, falha na produção"

1. Incompatibilidade de variáveis ​​de ambiente (Ambiente)
2. Versão de dependência diferente (ambiente)
3. Limites de recursos (memória, conexões) (problema de recursos)

### "Regressão após implantação"

1. Bug introduzido no novo código (erro lógico)
2. Alteração de configuração (falha de integração)
3. Problema de migração de banco de dados (problema de dados)
