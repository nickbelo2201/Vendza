# Definições de equipe predefinidas

Configurações de equipe predefinidas detalhadas com modelos de tarefas para fluxos de trabalho comuns.

## Revise a predefinição da equipe

**Comando**: `/team-spawn review`

### Configuração

- **Tamanho da equipe**: 3
- **Tipo de agente**: `agent-teams:team-reviewer`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Dimensão | Áreas de Foco |
| --------------------- | ------------ | ------------------------------------------------- |
| revisor de segurança | Segurança | Validação de entrada, autenticação, injeção, segredos, CVEs |
| revisor de desempenho | Desempenho | Eficiência de consulta, memória, cache, padrões assíncronos |
| revisor de arquitetura | Arquitetura | SOLID, acoplamento, padrões, tratamento de erros |

### Modelo de tarefa

```
Subject: Review {target} for {dimension} issues
Description:
  Dimension: {dimension}
  Target: {file list or diff}
  Checklist: {dimension-specific checklist}
  Output format: Structured findings with file:line, severity, evidence, fix
```

### Variações

- **Foco na segurança**: `--reviewers security,testing` (2 membros)
- **Revisão completa**: `--reviewers security,performance,architecture,testing,accessibility` (5 membros)
- **Revisão de front-end**: `--reviewers architecture,testing,accessibility` (3 membros)

## Predefinição da equipe de depuração

**Comando**: `/team-spawn debug`

### Configuração

- **Tamanho da equipe**: 3 (padrão) ou N com `--hypotheses N`
- **Tipo de agente**: `agent-teams:team-debugger`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Função |
| -------------- | ------------------------- |
| investigador-1 | Investiga a hipótese 1 |
| investigador-2 | Investiga a hipótese 2 |
| investigador-3 | Investiga a hipótese 3 |

### Modelo de tarefa

```
Subject: Investigate hypothesis: {hypothesis summary}
Description:
  Hypothesis: {full hypothesis statement}
  Scope: {files/module/project}
  Evidence criteria:
    Confirming: {what would confirm}
    Falsifying: {what would falsify}
  Report format: confidence level, evidence with file:line, causal chain
```

## Predefinição da equipe de recursos

**Comando**: `/team-spawn feature`

### Configuração

- **Tamanho da equipe**: 3 (1 líder + 2 implementadores)
- **Tipos de agentes**: `agent-teams:team-lead` + `agent-teams:team-implementer`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Função | Responsabilidade |
| ------------- | ---------------- | ---------------------------------------- |
| líder de recurso | líder de equipe | Decomposição, coordenação, integração |
| implementador-1 | implementador de equipe | Fluxo de trabalho 1 (arquivos atribuídos) |
| implementador-2 | implementador de equipe | Fluxo de trabalho 2 (arquivos atribuídos) |

### Modelo de tarefa

```
Subject: Implement {work stream name}
Description:
  Owned files: {explicit file list}
  Requirements: {specific deliverables}
  Interface contract: {shared types/APIs}
  Acceptance criteria: {verification steps}
  Blocked by: {dependency task IDs if any}
```

## Predefinição de equipe Fullstack

**Comando**: `/team-spawn fullstack`

### Configuração

- **Tamanho da equipe**: 4 (1 líder + 3 implementadores)
- **Tipos de agentes**: `agent-teams:team-lead` + 3x `agent-teams:team-implementer`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Função | Camada |
| -------------- | ---------------- | -------------------------------- |
| líder fullstack | líder de equipe | Coordenação, integração |
| frontend-dev | implementador de equipe | Componentes de UI, lógica do lado do cliente |
| backend-dev | implementador de equipe | Terminais de API, lógica de negócios |
| test-dev | implementador de equipe | Unidade, integração, testes e2e |

### Padrão de Dependência

```
frontend-dev â”€â”€â”
               â”œâ”€â”€â†’ test-dev (blocked by both)
backend-dev  â”€â”€â”˜
```

## Predefinição da equipe de pesquisa

**Comando**: `/team-spawn research`

### Configuração

- **Tamanho da equipe**: 3
- **Tipo de agente**: `general-purpose`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Função | Foco |
| ------------ | --------------- | ------------------------------------------------ |
| pesquisador-1 | uso geral | Área de pesquisa 1 (por exemplo, arquitetura de base de código) |
| pesquisador-2 | uso geral | Área de pesquisa 2 (por exemplo, documentação de biblioteca) |
| pesquisador-3 | uso geral | Área de pesquisa 3 (por exemplo, recursos da web e exemplos) |

### Ferramentas de pesquisa disponíveis

Cada pesquisador tem acesso a:

- **Codebase**: `Grep`, `Glob`, `Read` — pesquisa e lê arquivos locais
- **Web**: `WebSearch`, `WebFetch` — pesquise na web e busque o conteúdo da página
- **Exploração profunda**: `Task` com `subagent_type: Explore` — gera subexploradores para mergulhos profundos

### Modelo de tarefa

```
Subject: Research {topic or question}
Description:
  Question: {specific research question}
  Scope: {codebase files, web resources, library docs, or all}
  Tools to prioritize:
    - Codebase: Grep/Glob/Read for local code analysis
    - Web: WebSearch/WebFetch for articles, examples, best practices
  Deliverable: Summary with citations (file:line for code, URLs for web)
  Output format: Structured report with sections, evidence, and recommendations
```

### Variações

- **Somente base de código**: 3 pesquisadores explorando diferentes módulos ou padrões localmente
- **Pesquisa na Web**: três pesquisadores que usam o WebSearch para pesquisar abordagens, comparativos de mercado ou práticas recomendadas
- **Misto**: 1 pesquisador de base de código + 1 pesquisador de documentação + 1 pesquisador da web (recomendado para avaliação de novas bibliotecas)

### Exemplos de tarefas de pesquisa

```
Researcher 1 (codebase): "How does our current auth system work? Trace the flow from login to token validation."
Researcher 2 (web): "Search for comparisons between NextAuth, Clerk, and Auth0 for Next.js apps. Focus on pricing, DX, and migration effort."
Researcher 3 (docs): "Look up the latest NextAuth.js v5 API docs. How does it handle JWT and session management?"
```

## Predefinição da equipe de segurança

**Comando**: `/team-spawn security`

### Configuração

- **Tamanho da equipe**: 4
- **Tipo de agente**: `agent-teams:team-reviewer`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Dimensão | Áreas de Foco |
| --------------- | -------------- | ---------------------------------------------------- |
| revisor de vulnerabilidades | OWASP/Vulnas | Injeção, XSS, CSRF, desserialização, SSRF |
| revisor de autorização | Autenticação/Acesso | Autenticação, autorização, gerenciamento de sessões |
| revisor deps | Dependências | CVEs, cadeia de suprimentos, pacotes desatualizados, riscos de licença |
| revisor de configuração | Segredos/Configuração | Segredos codificados, env vars, endpoints de depuração, CORS |

### Modelo de tarefa

```
Subject: Security audit {target} for {dimension}
Description:
  Dimension: {security sub-dimension}
  Target: {file list, directory, or entire project}
  Checklist: {dimension-specific security checklist}
  Output format: Structured findings with file:line, CVSS-like severity, evidence, remediation
  Standards: OWASP Top 10, CWE references where applicable
```

### Variações

- **Verificação rápida**: `--reviewers owasp,secrets` (2 membros para auditoria rápida)
- **Auditoria completa**: todas as quatro dimensões (padrão)
- **Foco em CI/CD**: Adicione um quinto revisor para segurança de pipeline e configuração de implantação

## Predefinição da equipe de migração

**Comando**: `/team-spawn migration`

### Configuração

- **Tamanho da equipe**: 4 (1 líder + 2 implementadores + 1 revisor)
- **Tipos de agentes**: `agent-teams:team-lead` + 2x `agent-teams:team-implementer` + `agent-teams:team-reviewer`
- **Modo de exibição**: tmux recomendado

### Membros

| Nome | Função | Responsabilidade |
| ---------------- | ---------------- | ---------------------------------------------------------- |
| líder de migração | líder de equipe | Plano de migração, coordenação, gestão de conflitos |
| migrador-1 | implementador de equipe | Fluxo de migração 1 (arquivos/módulos atribuídos) |
| migrador-2 | implementador de equipe | Fluxo de migração 2 (arquivos/módulos atribuídos) |
| verificação de migração | revisor de equipe | Verifique a correção e os padrões do código migrado |

### Modelo de tarefa

```
Subject: Migrate {module/files} from {old} to {new}
Description:
  Owned files: {explicit file list}
  Migration rules: {specific transformation patterns}
  Old pattern: {what to change from}
  New pattern: {what to change to}
  Acceptance criteria: {tests pass, no regressions, new patterns used}
  Blocked by: {dependency task IDs if any}
```

### Padrão de Dependência

```
migration-lead (plan) â†’ migrator-1 â”€â”€â”
                      â†’ migrator-2 â”€â”€â”¼â†’ migration-verify
                                     â”˜
```

### Casos de uso

- Atualizações de estrutura (classe React -> ganchos, Vue 2 -> Vue 3, colisões de versão Angular)
- Migrações de linguagem (JavaScript → TypeScript, Python 2 → 3)
- Alterações na versão da API (REST v1 → v2, alterações no esquema GraphQL)
- Migrações de banco de dados (mudanças de ORM, reestruturação de esquema)
- Alterações no sistema de compilação (Webpack → Vite, CRA → Next.js)

