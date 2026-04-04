# Global Executable Orchestrator

Entrada canonica para o `orq-delegacao-geral`.

Use: `orq-delegacao-geral`

## Entrada

`$ARGUMENTS`

## Comportamento obrigatorio

Encaminhe a demanda para `plugins/agent-orchestration/agents/orq-delegacao-geral.md` e siga o loop executavel completo:

1. estruturar a demanda;
2. selecionar os mega-times necessarios;
3. selecionar agentes reais com ownership;
4. emitir spawns;
5. coordenar execucao e tratar falhas;
6. consolidar e validar a entrega final.

## Saida obrigatoria

```text
DEMANDA ESTRUTURADA
...

MEGA-TIMES SELECIONADOS
...

AGENTES SELECIONADOS
...

SPAWNS
...

PLANO DE EXECUCAO
...

STATUS
...

VALIDACAO DOS ENTREGAVEIS
...

ENTREGA FINAL CONSOLIDADA
...
```

Nunca responda apenas com roteamento ou recomendacao de time. O comando deve acionar o orquestrador executavel e fechar o loop.
