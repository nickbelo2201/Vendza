## O que muda

<!-- Descreva em 1-3 bullets o que esse PR faz -->

-
-

## Tipo de mudança

- [ ] `feat` — nova funcionalidade
- [ ] `fix` — correção de bug
- [ ] `refactor` — sem mudança de comportamento externo
- [ ] `chore` — dependências, config, infra
- [ ] `docs` — documentação

---

## Checklist de qualidade

### Código
- [ ] `corepack pnpm typecheck` passa com 0 erros
- [ ] Nenhum `console.log` de debug esquecido
- [ ] Nenhum `meta.stub: true` em endpoints que devem estar funcionais
- [ ] Variáveis de ambiente novas foram adicionadas no Vercel/Railway

### Banco de dados
- [ ] Migração é aditiva (nova coluna/tabela, nunca renomear/deletar)
- [ ] `corepack pnpm db:generate` foi rodado se o schema mudou
- [ ] Nenhum arquivo `.env` ou secret no commit

### Isolamento de storeId
- [ ] Toda query Prisma em rotas partner filtra por `storeId` do `partnerContext`
- [ ] `storeId` nunca vem do body da requisição

### Frontend
- [ ] Server Components não passam event handlers via props para Client Components
- [ ] Imagens com `next/image` têm `alt` e dimensões definidas
- [ ] Estados de loading/erro tratados na UI

---

## Como testar

<!-- Descreva o passo a passo para testar essa mudança na preview URL -->

1.
2.
3.

---

## Screenshots (se frontend)

<!-- Antes / Depois -->

---

> Antes de mergar: o fundador testa na preview URL da Vercel e faz o push para `main` pessoalmente.
