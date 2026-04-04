# Estrutura de decisão de propriedade de arquivos

Como atribuir propriedade de arquivo ao decompor recursos para desenvolvimento paralelo.

## Processo de decisão de propriedade

### Etapa 1: mapear todos os arquivos

Liste todos os arquivos que precisam ser criados ou modificados para o recurso.

### Etapa 2: Identificar Clusters Naturais

Agrupar arquivos por:

- Proximidade do diretório (arquivos no mesmo diretório)
- Relacionamento funcional (arquivos que se importam)
- Associação de camadas (todos os arquivos de UI, todos os arquivos de API)

### Etapa 3: atribuir clusters aos proprietários

Cada cluster se torna o limite de propriedade de um implementador:

- Nenhum arquivo aparece em vários clusters
- Cada cluster é internamente coeso
- As dependências entre clusters são minimizadas

### Passo 4: Definir Pontos de Interface

Onde os clusters interagem, defina:

- Definições de tipo compartilhado (de propriedade do líder ou de um implementador designado)
- Contratos de API (assinaturas de função, formas de solicitação/resposta)
- Contratos de eventos (nomes de eventos e formatos de carga útil)

## Propriedade por tipo de projeto

### Interface React/Next.js

```
implementer-1: src/components/{feature}/   (UI components)
implementer-2: src/hooks/{feature}/        (custom hooks, state)
implementer-3: src/api/{feature}/          (API client, types)
shared:        src/types/{feature}.ts      (owned by lead)
```

### Back-end expresso/rápido

```
implementer-1: src/routes/{feature}.ts, src/controllers/{feature}.ts
implementer-2: src/services/{feature}.ts, src/validators/{feature}.ts
implementer-3: src/models/{feature}.ts, src/repositories/{feature}.ts
shared:        src/types/{feature}.ts      (owned by lead)
```

### Pilha completa (Next.js)

```
implementer-1: app/{feature}/page.tsx, app/{feature}/components/
implementer-2: app/api/{feature}/route.ts, lib/{feature}/
implementer-3: tests/{feature}/
shared:        types/{feature}.ts          (owned by lead)
```

### Django Python

```
implementer-1: {app}/views.py, {app}/urls.py, {app}/forms.py
implementer-2: {app}/models.py, {app}/serializers.py, {app}/managers.py
implementer-3: {app}/tests/
shared:        {app}/types.py              (owned by lead)
```

## Resolução de Conflitos

Quando dois implementadores precisam modificar o mesmo arquivo:

1. **Preferencial: Dividir o arquivo** — Extraia a preocupação compartilhada em seu próprio arquivo
2. **Se não for possível dividir: designe um proprietário** — O outro implementador envia solicitações de mudança
3. **Último recurso: acesso sequencial** — O implementador A termina e o implementador B assume
4. **Nunca**: deixe ambos modificarem o mesmo arquivo simultaneamente
