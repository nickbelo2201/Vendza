---
name: parallel-debugging
description: Debug complex issues using competing hypotheses with parallel investigation, evidence collection, and root cause arbitration. Use this skill when debugging bugs with multiple potential causes, performing root cause analysis, or organizing parallel investigation workflows.
version: 1.0.2
---

# Depuração paralela

Framework para depuração de questões complexas utilizando a metodologia de Análise de Hipóteses Concorrentes (ACH) com investigação paralela de agentes.

## Quando usar esta habilidade

- Bug tem múltiplas causas plausíveis
- As tentativas iniciais de depuração não identificaram o problema
- O problema abrange vários módulos ou componentes
- Precisa de uma análise sistemática da causa raiz com evidências
- Quer evitar viés de confirmação na depuração

## Estrutura de geração de hipóteses

Gere hipóteses em 6 categorias de modo de falha:

### 1. Erro lógico

- Lógica condicional incorreta (operador errado, caso ausente)
- Erros ocasionais em loops ou acesso ao array
- Tratamento de casos extremos ausente
- Implementação incorreta do algoritmo

### 2. Problema de dados

- Dados de entrada inválidos ou inesperados
- Erro de incompatibilidade de tipo ou coerção
- Nulo/indefinido/Nenhum onde valor esperado
- Problema de codificação ou serialização
- Truncamento ou estouro de dados

### 3. Problema de estado

- Condição de corrida entre operações simultâneas
- Cache obsoleto retornando dados desatualizados
- Inicialização incorreta ou valores padrão
- Mutação não intencional de estado compartilhado
- Erro de transição da máquina de estado

### 4. Falha na integração

- Violação do contrato da API (incompatibilidade de solicitação/resposta)
- Incompatibilidade de versão entre componentes
- Incompatibilidade de configuração entre ambientes
- Variáveis ​​de ambiente ausentes ou incorretas
- Tempo limite de rede ou falha de conexão

### 5. Problema de recursos

- Vazamento de memória causando degradação gradual
- Esgotamento do pool de conexão
- Descritor de arquivo ou identificador de vazamento
- Espaço em disco ou cota excedida
- Saturação da CPU devido ao processamento ineficiente

### 6. Meio Ambiente

- Dependência de tempo de execução ausente
- Versão errada da biblioteca ou estrutura
- Diferença de comportamento específico da plataforma
- Problema de permissão ou controle de acesso
- Comportamento relacionado ao fuso horário ou localidade

## Padrões de coleta de evidências

### O que constitui evidência

| Tipo de evidência | Força | Exemplo |
| ----------------- | -------- | -------------------------------------------------------------------------- |
| **Direto** | Forte | O código em `file.ts:42` mostra que `if (x > 0)` deve ser `if (x >= 0)` |
| **Correlacional** | Médio | A taxa de erros aumentou após o commit `abc123` |
| **Depoimento** | Fraco | "Funciona na minha máquina" |
| **Ausência** | Variável | Nenhuma verificação nula encontrada no caminho do código |

### Formato de citação

Sempre cite evidências com referências file:line:

```
**Evidence**: The validation function at `src/validators/user.ts:87`
does not check for empty strings, only null/undefined. This allows
empty email addresses to pass validation.
```

### Níveis de confiança

| Nível | Critérios |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| **Alto (>80%)** | Múltiplas evidências diretas, cadeia causal clara, sem evidências contraditórias |
| **Médio (50-80%)** | Algumas evidências diretas, cadeia causal plausível, pequenas ambiguidades |
| **Baixo (<50%)** | Principalmente evidências correlacionais, cadeia causal incompleta, algumas evidências contraditórias |

## Protocolo de Arbitragem de Resultados

Depois que todos os investigadores relatam:

### Etapa 1: categorizar os resultados

- **Confirmado**: Alta confiança, evidências fortes, cadeia causal clara
- **Plausível**: Confiança média, alguma evidência, cadeia causal razoável
- **Falsificado**: as evidências contradizem a hipótese
- **Inconclusivo**: Evidências insuficientes para confirmar ou falsificar

### Etapa 2: compare as hipóteses confirmadas

Se múltiplas hipóteses forem confirmadas, classifique por:

1. Nível de confiança
2. Número de peças de evidência de apoio
3. Força da cadeia causal
4. Ausência de evidências contraditórias

### Etapa 3: determinar a causa raiz

- Se uma hipótese dominar claramente: declare como causa raiz
- Se múltiplas hipóteses forem igualmente prováveis: pode ser um problema composto (múltiplas causas contribuintes)
- Se nenhuma hipótese for confirmada: gerar novas hipóteses com base nas evidências coletadas

### Etapa 4: validar a correção

Antes de declarar o bug corrigido:

- [] A correção aborda a causa raiz identificada
- [] A correção não introduz novos problemas
- [] O caso de reprodução original não falha mais
- [] Casos extremos relacionados são cobertos
- [] Testes relevantes são adicionados ou atualizados
