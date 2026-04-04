---
name: multi-reviewer-patterns
description: Coordinate parallel code reviews across multiple quality dimensions with finding deduplication, severity calibration, and consolidated reporting. Use this skill when organizing multi-reviewer code reviews, calibrating finding severity, or consolidating review results.
version: 1.0.2
---

# Padrões de múltiplos revisores

Padrões para coordenar revisões de código paralelas em diversas dimensões de qualidade, desduplicar descobertas, calibrar a gravidade e produzir relatórios consolidados.

## Quando usar esta habilidade

- Organizando uma revisão de código multidimensional
- Decidir quais dimensões de revisão atribuir
- Desduplicando descobertas de vários revisores
- Calibrando classificações de gravidade de forma consistente
- Produzindo um relatório de revisão consolidado

## Revise a alocação de dimensões

### Dimensões disponíveis

| Dimensão | Foco | Quando incluir |
| ----------------- | --------------------------------------- | ------------------------------------------- |
| **Segurança** | Vulnerabilidades, autenticação, validação de entrada | Sempre para manipulação de código de entrada ou autenticação do usuário |
| **Desempenho** | Eficiência de consulta, memória, cache | Ao alterar o acesso a dados ou caminhos ativos |
| **Arquitetura** | SÓLIDO, acoplamento, padrões | Para alterações estruturais ou novos módulos |
| **Testes** | Cobertura, qualidade, casos extremos | Ao adicionar novas funcionalidades |
| **Acessibilidade** | WCAG, ARIA, navegação por teclado | Para alterações de UI/frontend |

### Combinações recomendadas

| Cenário | Dimensões |
| ---------------------- | -------------------------------------------- |
| Alterações no endpoint da API | Segurança, Desempenho, Arquitetura |
| Componente front-end | Arquitetura, Testes, Acessibilidade |
| Migração de banco de dados | Desempenho, Arquitetura |
| Alterações de autenticação | Segurança, testes |
| Revisão completa dos recursos | Segurança, Desempenho, Arquitetura, Testes |

## Encontrando a desduplicação

Quando vários revisores relatam problemas no mesmo local:

### Regras de mesclagem

1. **Mesmo arquivo:linha, mesmo problema** — Mesclar em uma única descoberta, dar crédito a todos os revisores
2. **Mesmo arquivo:linha, problemas diferentes** — Mantenha como descobertas separadas
3. **Mesmo problema, locais diferentes** — Mantenha separado, mas com referências cruzadas
4. **Gravidade conflitante** — Use a classificação de gravidade mais alta
5. **Recomendações conflitantes** — Incluir ambas com atribuição do revisor

### Processo de desduplicação

```
For each finding in all reviewer reports:
  1. Check if another finding references the same file:line
  2. If yes, check if they describe the same issue
  3. If same issue: merge, keeping the more detailed description
  4. If different issue: keep both, tag as "co-located"
  5. Use highest severity among merged findings
```

## Calibração de Severidade

### Critérios de gravidade

| Gravidade | Impacto | Probabilidade | Exemplos |
| ------------ | ------------------------------------------------------------ | ---------------------- | -------------------------------------------- |
| **Crítico** | Perda de dados, violação de segurança, falha completa | Certo ou muito provável | Injeção de SQL, desvio de autenticação, corrupção de dados |
| **Alto** | Impacto significativo na funcionalidade, degradação | Provavelmente | Vazamento de memória, validação ausente, fluxo quebrado |
| **Médio** | Impacto parcial, existe solução alternativa | Possível | Consulta N+1, caso extremo ausente, erro pouco claro |
| **Baixo** | Impacto mínimo, cosmético | Improvável | Problema de estilo, pequena otimização, nomenclatura |

### Regras de calibração

- Vulnerabilidades de segurança exploráveis ​​por usuários externos: sempre Críticas ou Altas
- Problemas de desempenho em caminhos quentes: pelo menos Médio
- Testes ausentes para caminhos críticos: pelo menos Médio
- Violações de acessibilidade para funcionalidades principais: pelo menos Médio
- Problemas de estilo de código sem impacto funcional: Baixo

## Modelo de relatório consolidado

```markdown
## Code Review Report

**Target**: {files/PR/directory}
**Reviewers**: {dimension-1}, {dimension-2}, {dimension-3}
**Date**: {date}
**Files Reviewed**: {count}

### Critical Findings ({count})

#### [CR-001] {Title}

**Location**: `{file}:{line}`
**Dimension**: {Security/Performance/etc.}
**Description**: {what was found}
**Impact**: {what could happen}
**Fix**: {recommended remediation}

### High Findings ({count})

...

### Medium Findings ({count})

...

### Low Findings ({count})

...

### Summary

| Dimension    | Critical | High  | Medium | Low   | Total  |
| ------------ | -------- | ----- | ------ | ----- | ------ |
| Security     | 1        | 2     | 3      | 0     | 6      |
| Performance  | 0        | 1     | 4      | 2     | 7      |
| Architecture | 0        | 0     | 2      | 3     | 5      |
| **Total**    | **1**    | **3** | **9**  | **5** | **18** |

### Recommendation

{Overall assessment and prioritized action items}
```
