---
description: "Debug issues using competing hypotheses with parallel investigation by multiple agents"
argument-hint: "<error-description-or-file> [--hypotheses N] [--scope files|module|project]"
---

# Depuração de equipe

Depure problemas complexos usando a metodologia de Análise de Hipóteses Concorrentes (ACH). Vários agentes depuradores investigam diferentes hipóteses em paralelo, reunindo evidências para confirmar ou falsificar cada uma delas.

## Verificações pré-voo

1. Verifique se `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` está definido
2. Analise `$ARGUMENTS`:
   - `<error-description-or-file>`: descrição do bug, mensagem de erro ou caminho para um arquivo que exibe o problema
   - `--hypotheses N`: número de hipóteses a serem geradas (padrão: 3)
   - `--scope`: escopo de investigação — `files` (arquivos específicos), `module` (módulo/pacote), `project` (projeto inteiro)

## Fase 1: Triagem Inicial

1. Analise a descrição ou arquivo do erro:
   - Se o caminho do arquivo: leia o arquivo, procure por problemas óbvios, colete o contexto do erro
   - Se a descrição do erro: pesquise na base de código o código relacionado, mensagens de erro, rastreamentos de pilha
2. Identifique claramente o sintoma: o que está falhando, quando e como
3. Reúna o contexto inicial: alterações recentes do git, testes relacionados, configuração

## Fase 2: Geração de Hipóteses

Gere N hipóteses sobre a causa raiz, cobrindo diferentes categorias de modo de falha:

1. **Erro de lógica** — Algoritmo incorreto, condição errada, erro por um, caso extremo ausente
2. **Problema de dados** — Entrada inválida, incompatibilidade de tipo, nulo/indefinido, problema de codificação
3. **Problema de estado** — Condição de corrida, cache obsoleto, inicialização incorreta, bug de mutação
4. **Falha na integração** — violação do contrato da API, incompatibilidade de versão, erro de configuração
5. **Problema de recursos** — Vazamento de memória, esgotamento da conexão, tempo limite, espaço em disco
6. **Ambiente** — Dependência ausente, versão errada, comportamento específico da plataforma

Apresentar hipóteses ao usuário: "Geradas {N} hipóteses. Gerando investigadores..."

## Fase 3: Investigação

1. Use a ferramenta `Teammate` com `operation: "spawnTeam"`, nome da equipe: `debug-{timestamp}`
2. Para cada hipótese, use a ferramenta `Task` para gerar um companheiro de equipe:
   - `name`: `investigator-{n}` (por exemplo, "investigador-1")
   - `subagent_type`: "agent-teams:team-debugger"
   - `prompt`: Inclui a hipótese, o escopo da investigação e o contexto relevante
3. Use `TaskCreate` para a tarefa de cada investigador:
   - Assunto: "Investigar hipótese: {resumo da hipótese}"
   - Descrição: Declaração completa da hipótese, limites do escopo, critérios de evidência

## Fase 4: Coleta de Evidências

1. Monitore TaskList para conclusão
2. À medida que os investigadores concluem, colete seus relatórios de evidências
3. Acompanhar: "{completed}/{total} investigações concluídas"

## Fase 5: Arbitragem

1. Compare as descobertas de todos os investigadores:
   - Quais hipóteses foram confirmadas (alta confiança)?
   - Quais foram falsificadas (evidências contraditórias)?
   - Quais são inconclusivas (evidências insuficientes)?

2. Classifique as hipóteses confirmadas por:
   - Nível de confiança (Alto > Médio > Baixo)
   - Força da cadeia causal
   - Quantidade de evidências de apoio
   - Ausência de evidências contraditórias

3. Apresentar análise de causa raiz:

   ```
   ## Debug Report: {error description}

   ### Root Cause (Most Likely)
   **Hypothesis**: {description}
   **Confidence**: {High/Medium/Low}
   **Evidence**: {summary with file:line citations}
   **Causal Chain**: {step-by-step from cause to symptom}

   ### Recommended Fix
   {specific fix with code changes}

   ### Other Hypotheses
   - {hypothesis 2}: {status} â€” {brief evidence summary}
   - {hypothesis 3}: {status} â€” {brief evidence summary}
   ```

## Fase 6: Limpeza

1. Envie `shutdown_request` para todos os investigadores
2. Chame a limpeza `Teammate` para remover recursos da equipe

