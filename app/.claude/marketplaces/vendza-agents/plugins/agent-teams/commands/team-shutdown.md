---
description: "Gracefully shut down an agent team, collect final results, and clean up resources"
argument-hint: "[team-name] [--force] [--keep-tasks]"
---

# Desligamento da equipe

Encerre normalmente uma equipe de agentes ativos enviando solicitações de desligamento a todos os colegas de equipe, coletando resultados finais e limpando os recursos da equipe.

## Fase 1: Pré-Desligamento

1. Analise `$ARGUMENTS` para o nome da equipe e bandeiras:
   - Se não houver nome de equipe, verifique se há equipes ativas (mesma descoberta do status da equipe)
   - `--force`: ignora a espera por respostas de desligamento normal
   - `--keep-tasks`: preserva a lista de tarefas após a limpeza

2. Leia a configuração da equipe em `~/.claude/teams/{team-name}/config.json` usando a ferramenta Read
3. Chame `TaskList` para verificar tarefas em andamento

4. Se houver tarefas em andamento e `--force` não estiver definido:
   - Exibir aviso: "Aviso: {N} tarefas ainda estão em andamento"
   - Liste as tarefas em andamento
   - Pergunte ao usuário: "Continuar com o desligamento? O trabalho em andamento pode ser perdido."

## Fase 2: Desligamento Gracioso

Para cada companheiro de equipe:

1. Use `SendMessage` com `type: "shutdown_request"` para solicitar o desligamento normal
   - Incluir conteúdo: "Encerramento da equipe solicitado. Conclua o trabalho atual e salve o estado."
2. Aguarde respostas de desligamento
   - Se o colega de equipe aprovar: marque como encerrado
   - Se o colega de equipe rejeitar: informe ao usuário o motivo
   - Se `--force`: não espere por respostas

## Fase 3: Limpeza

1. Exibir resumo de desligamento:

   ```
   Team "{team-name}" shutdown complete.

   Members shut down: {N}/{total}
   Tasks completed: {completed}/{total}
   Tasks remaining: {remaining}
   ```

2. A menos que `--keep-tasks` esteja definido, chame a ferramenta `Teammate` com `operation: "cleanup"` para remover diretórios de equipes e tarefas

3. Se `--keep-tasks` estiver definido, informe ao usuário: "Lista de tarefas preservada em ~/.claude/tasks/{team-name}/"
