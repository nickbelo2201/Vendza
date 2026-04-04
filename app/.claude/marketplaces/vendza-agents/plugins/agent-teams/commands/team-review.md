---
description: "Launch a multi-reviewer parallel code review with specialized review dimensions"
argument-hint: "<target> [--reviewers security,performance,architecture,testing,accessibility] [--base-branch main]"
---

# Revisão da equipe

Orquestre uma revisão de código paralela com vários revisores, onde cada revisor se concentra em uma dimensão de qualidade específica. Produz um relatório consolidado e desduplicado, organizado por gravidade.

## Verificações pré-voo

1. Verifique se `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` está definido
2. Analise `$ARGUMENTS`:
   - `<target>`: caminho do arquivo, diretório, intervalo de diferenças do git (por exemplo, `main...HEAD`) ou número PR (por exemplo, `#123`)
   - `--reviewers`: dimensões separadas por vírgula (padrão: `security,performance,architecture`)
   - `--base-branch`: branch base para comparação de diferenças (padrão: `main`)

## Fase 1: Resolução Alvo

1. Determine o tipo de destino:
   - **Arquivo/Diretório**: use como está para o escopo da revisão
   - **Git diff range**: Use o Bash para executar `git diff {range} --name-only` para obter os arquivos alterados
   - **Número PR**: Use Bash para executar `gh pr diff {number} --name-only` para obter arquivos alterados
2. Colete o conteúdo diff completo para distribuição aos revisores
3. Exibir escopo de revisão para o usuário: "{N} arquivos para revisão em {M} dimensões"

## Fase 2: surgimento da equipe

1. Use a ferramenta `Teammate` com `operation: "spawnTeam"`, nome da equipe: `review-{timestamp}`
2. Para cada dimensão solicitada, use a ferramenta `Task` para gerar um companheiro de equipe:
   - `name`: `{dimension}-reviewer` (por exemplo, "revisor de segurança")
   - `subagent_type`: "agent-teams:team-reviewer"
   - `prompt`: Inclui a atribuição de dimensão, arquivos de destino e conteúdo diff
3. Use `TaskCreate` para cada tarefa do revisor:
   - Assunto: "Analise {target} para problemas de {dimension}"
   - Descrição: Inclui lista de arquivos, conteúdo de comparação e lista de verificação específica de dimensão

## Fase 3: Monitorar e Coletar

1. Aguarde a conclusão de todas as tarefas de revisão (verifique `TaskList` periodicamente)
2. À medida que cada revisor conclui, colete suas descobertas estruturadas
3. Acompanhe o progresso: "{completed}/{total} revisões concluídas"

## Fase 4: Consolidação

1. **Desduplicar**: Mesclar descobertas que fazem referência ao mesmo local de arquivo:linha
2. **Resolver conflitos**: se os revisores discordarem quanto à gravidade, use a classificação mais alta
3. **Organizar por gravidade**: Agrupe as descobertas como Críticas, Altas, Médias, Baixas
4. **Referência cruzada**: observe as descobertas que aparecem em diversas dimensões

## Fase 5: Relatório e Limpeza

1. Apresentar relatório consolidado:

   ```
   ## Code Review Report: {target}

   Reviewed by: {dimensions}
   Files reviewed: {count}

   ### Critical ({count})
   [findings...]

   ### High ({count})
   [findings...]

   ### Medium ({count})
   [findings...]

   ### Low ({count})
   [findings...]

   ### Summary
   Total findings: {count} (Critical: N, High: N, Medium: N, Low: N)
   ```

2. Envie `shutdown_request` para todos os revisores
3. Chame a limpeza `Teammate` para remover recursos da equipe

