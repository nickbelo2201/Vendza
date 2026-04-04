---
description: "Develop features in parallel with multiple agents using file ownership boundaries and dependency management"
argument-hint: "<feature-description> [--team-size N] [--branch feature/name] [--plan-first]"
---

# Recurso de equipe

Orquestre o desenvolvimento paralelo de recursos com vários agentes implementadores. Decompõe recursos em fluxos de trabalho com propriedade estrita de arquivos, gerencia dependências e verifica a integração.

## Verificações pré-voo

1. Verifique se `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` está definido
2. Analise `$ARGUMENTS`:
   - `<feature-description>`: descrição do recurso a ser construído
   - `--team-size N`: número de implementadores (padrão: 2)
   - `--branch`: nome do branch git (padrão: gerado automaticamente a partir da descrição do recurso)
   - `--plan-first`: decompõe e obtém a aprovação do usuário antes de gerar

## Fase 1: Análise

1. Analise a descrição do recurso para entender o escopo
2. Explore a base de código para identificar:
   - Arquivos que precisarão de modificação
   - Padrões e convenções existentes a serem seguidos
   - Pontos de integração com código existente
   - Teste arquivos que precisam de atualizações

## Fase 2: Decomposição

1. Decomponha o recurso em fluxos de trabalho:
   - Cada stream obtém propriedade exclusiva do arquivo (sem arquivos sobrepostos)
   - Definir contratos de interface entre streams
   - Identifique dependências entre streams (blockedBy/blocks)
   - Equilibre a carga de trabalho entre fluxos

2. Se `--plan-first` estiver definido:
   - Apresente a decomposição ao usuário:

     ```
     ## Feature Decomposition: {feature}

     ### Stream 1: {name}
     Owner: implementer-1
     Files: {list}
     Dependencies: none

     ### Stream 2: {name}
     Owner: implementer-2
     Files: {list}
     Dependencies: blocked by Stream 1 (needs interface from {file})

     ### Integration Contract
     {shared types/interfaces}
     ```

   - Aguarde a aprovação do usuário antes de continuar
   - Se o usuário solicitar alterações, ajuste a decomposição

## Fase 3: surgimento da equipe

1. Se `--branch` for especificado, use Bash para criar e verificar o branch:
   ```
   git checkout -b {branch-name}
   ```
2. Use a ferramenta `Teammate` com `operation: "spawnTeam"`, nome da equipe: `feature-{timestamp}`
3. Gere um agente `team-lead` para coordenar
4. Para cada fluxo de trabalho, use a ferramenta `Task` para gerar um `team-implementer`:
   - `name`: `implementer-{n}`
   - `subagent_type`: "agent-teams:team-implementador"
   - `prompt`: Inclui arquivos próprios, contratos de interface e requisitos de implementação

## Fase 4: Criação de Tarefas

1. Use `TaskCreate` para cada fluxo de trabalho:
   - Assunto: "{nome do fluxo}"
   - Descrição: Arquivos próprios, requisitos, contratos de interface, critérios de aceitação
2. Use `TaskUpdate` para definir relacionamentos `blockedBy` para fluxos dependentes
3. Atribuir tarefas aos implementadores com `TaskUpdate` (definir `owner`)

## Fase 5: Monitorar e Coordenar

1. Monitore `TaskList` para progresso
2. À medida que os implementadores concluem as tarefas:
   - Verifique se há problemas de integração
   - Desbloquear tarefas dependentes
   - Reequilibrar se necessário
3. Lidar com a coordenação do ponto de integração:
   - Quando um implementador conclui uma interface, notifique os implementadores dependentes

## Fase 6: Verificação de Integração

Após a conclusão de todas as tarefas:

1. Use Bash para verificar se o código é compilado/construído: execute o comando de construção apropriado
2. Use Bash para executar testes: execute o comando de teste apropriado
3. Se forem encontrados problemas, crie tarefas de correção e atribua aos implementadores apropriados
4. Relatar o status da integração ao usuário

## Fase 7: Limpeza

1. Apresentar resumo do recurso:

   ```
   ## Feature Complete: {feature}

   Files modified: {count}
   Streams completed: {count}/{total}
   Tests: {pass/fail}

   Changes are on branch: {branch-name}
   ```

2. Envie `shutdown_request` para todos os colegas de equipe
3. Chame a limpeza de `Teammate`

