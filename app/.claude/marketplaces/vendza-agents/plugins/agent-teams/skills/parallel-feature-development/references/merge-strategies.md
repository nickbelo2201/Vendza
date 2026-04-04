# Estratégias de integração e mesclagem

Padrões para integração de fluxos de trabalho paralelos e resolução de conflitos.

## Padrões de Integração

### Padrão 1: Integração Direta

Todos os implementadores se comprometem com o mesmo ramo; a integração acontece naturalmente.

```
feature/auth â† implementer-1 commits
             â† implementer-2 commits
             â† implementer-3 commits
```

**Quando usar**: Equipes pequenas (2-3), propriedade estrita de arquivos (não são esperados conflitos).

### Padrão 2: Integração de Subfiliais

Cada implementador trabalha em uma sub-ramificação; lead os mescla sequencialmente.

```
feature/auth
  â”œâ”€â”€ feature/auth-login     â† implementer-1
  â”œâ”€â”€ feature/auth-register  â† implementer-2
  â””â”€â”€ feature/auth-tests     â† implementer-3
```

Ordem de mesclagem: siga o gráfico de dependência (fundação → dependente → integração).

**Quando usar**: equipes maiores (4+), preocupações sobrepostas, necessidade de portas de revisão.

### Padrão 3: baseado em tronco com sinalizadores de recursos

Todos os implementadores se comprometem com o branch principal por trás de um sinalizador de recurso.

```
main â† all implementers commit
     â† feature flag gates new code
```

**Quando usar**: ambientes CI/CD, recursos de curta duração, implantação contínua.

## Lista de verificação de verificação de integração

Após a conclusão de todos os implementadores:

1. **Verificação de compilação**: o código é compilado/empacotado sem erros?
2. **Verificação de tipo**: as anotações de TypeScript/tipo são aprovadas?
3. **Verificação de Lint**: o código passa nas regras de linting?
4. **Testes de unidade**: todos os testes de unidade são aprovados?
5. **Testes de integração**: os testes entre componentes são aprovados?
6. **Verificação de interface**: todos os contratos de interface correspondem às suas implementações?

## Resolução de Conflitos

### Prevenção (melhor)

- A propriedade estrita de arquivos elimina a maioria dos conflitos
- Contratos de interface definem limites antes da implementação
- Arquivos de tipo compartilhado pertencem ao lead e são modificados sequencialmente

### Detecção

- A mesclagem do Git reportará conflitos se eles ocorrerem
- Erros TypeScript/lint indicam incompatibilidades de interface
- Falhas nos testes indicam conflitos comportamentais

### Estratégias de Resolução

1. **Contrato ganho**: se o código não corresponder ao contrato de interface, o código está errado
2. **O líder arbitra**: o líder da equipe decide qual implementação manter
3. **Os testes decidem**: a implementação que passa nos testes está correta
4. **Mesclar manualmente**: para conflitos complexos, o lead é mesclado manualmente
