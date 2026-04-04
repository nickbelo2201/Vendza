# Modelos de padrão de mensagens

Modelos de mensagens prontos para uso para cenários comuns de comunicação em equipe.

## Atribuição de Tarefas

```
You've been assigned task #{id}: {subject}.

Owned files:
- {file1}
- {file2}

Key requirements:
- {requirement1}
- {requirement2}

Interface contract:
- Import {types} from {shared-file}
- Export {types} for {other-teammate}

Let me know if you have questions or blockers.
```

## Notificação de Ponto de Integração

```
My side of the {interface-name} interface is complete.

Exported from {file}:
- {function/type 1}
- {function/type 2}

You can now import these in your owned files. The contract matches what we agreed on.
```

## Relatório de bloqueador

```
I'm blocked on task #{id}: {subject}.

Blocker: {description of what's preventing progress}
Impact: {what can't be completed until this is resolved}

Options:
1. {option 1}
2. {option 2}

Waiting for your guidance.
```

## Relatório de conclusão de tarefa

```
Task #{id} complete: {subject}

Changes made:
- {file1}: {what changed}
- {file2}: {what changed}

Integration notes:
- {any interface changes or considerations for other teammates}

Ready for next assignment.
```

## Revise o resumo da descoberta

```
Review complete for {target} ({dimension} dimension).

Summary:
- Critical: {count}
- High: {count}
- Medium: {count}
- Low: {count}

Top finding: {brief description of most important finding}

Full findings attached to task #{id}.
```

## Resumo do relatório de investigação

```
Investigation complete for hypothesis: {hypothesis summary}

Verdict: {Confirmed | Falsified | Inconclusive}
Confidence: {High | Medium | Low}

Key evidence:
- {file:line}: {what was found}
- {file:line}: {what was found}

{If confirmed}: Recommended fix: {brief fix description}
{If falsified}: Contradicting evidence: {brief description}

Full report attached to task #{id}.
```

## Reconhecimento de desligamento

Ao receber uma solicitação de desligamento, responda com a ferramenta shutdown_response. Mas você também pode enviar uma mensagem de status final:

```
Wrapping up. Current status:
- Task #{id}: {completed/in-progress}
- Files modified: {list}
- Pending work: {none or description}

Ready for shutdown.
```
