# Security Report — Vendza
> Gerado em: 2026-04-16 | Agente: Nicholas Orchestrator (Security)

---

## Segurança #1 — SOF-53

**Título:** [SEC] Implementar HttpOnly cookies para autenticação
**Link:** https://linear.app/venza-project/issue/SOF-53/sec-implementar-httponly-cookies-para-autenticacao
**Prioridade:** alta
**Complexidade:** média
**Status:** pendente

### Descrição
A issue aponta que o Bearer token do Supabase estaria em `localStorage`, vulnerável a XSS. A análise do codebase revela que o projeto **já usa `@supabase/ssr`** com `createServerClient` (cookies server-side) e `createBrowserClient` (cookies client-side via Supabase SSR). O middleware (`updateSession`) renova a sessão via cookies a cada request.

**Risco real confirmado:** Os cookies setados pelo `createBrowserClient` (lado do browser, via JavaScript) não têm o atributo `HttpOnly` — porque JavaScript só consegue setar cookies acessíveis pelo próprio JS. Apenas o servidor pode setar cookies `HttpOnly`. Isso significa que os tokens da sessão de um client component ainda são acessíveis via `document.cookie` em um ataque XSS.

A validação deve:
1. Confirmar que não há nenhum uso de `localStorage` para tokens de auth
2. Verificar os atributos dos cookies de sessão (`HttpOnly`, `Secure`, `SameSite`)
3. Confirmar que o `updateSession` no middleware está atualizando os cookies corretamente
4. Validar que a rota de `/v1/partner/*` na API rejeita requisições sem token (401)

### Escopo de validação

**Frontend (web-partner):**
- `apps/web-partner/src/utils/supabase/client.ts` — `createBrowserClient` (cookies client-side)
- `apps/web-partner/src/utils/supabase/server.ts` — `createServerClient` (cookies server-side)
- `apps/web-partner/src/utils/supabase/middleware.ts` — `updateSession` (renovação de sessão)
- `apps/web-partner/src/middleware.ts` — entry point do middleware Next.js
- `apps/web-partner/src/lib/api.ts` — `getAccessToken()` → Bearer header para a API

**Backend/API:**
- `apps/api/src/plugins/supabase.js` — plugin de validação de Bearer token (ARQUIVO NÃO ENCONTRADO — confirmar localização)
- Rota `GET /v1/partner/*` — deve retornar 401 sem token

**Estado/Store:**
- Nenhum estado global de auth — o Supabase SSR gerencia via cookies automaticamente

### Pacotes necessários
- Nenhum novo pacote — Playwright já disponível (`@playwright/test ^1.59.1`)

### Dependências
- Nenhuma (issue autossuficiente)

### Arquivos afetados
```
apps/web-partner/src/utils/supabase/client.ts
apps/web-partner/src/utils/supabase/server.ts
apps/web-partner/src/utils/supabase/middleware.ts
apps/web-partner/src/middleware.ts
apps/web-partner/src/lib/api.ts
apps/api/src/plugins/supabase.js (localizar)
```

### Plano de validação

1. **Localizar o plugin de auth da API** — buscar o arquivo de validação do Bearer token no Fastify (pode estar em outro caminho) e confirmar que valida o token via Supabase Admin ou JWT
2. **Verificar ausência de localStorage para auth** — grep em todo web-partner por `localStorage` e `sessionStorage` relacionados a `supabase`, `token`, `access_token`, `session`
3. **Verificar atributos dos cookies do Supabase SSR** — `createBrowserClient` do `@supabase/ssr` seta cookies via JS — confirmar se os cookies `sb-*` têm `HttpOnly` ou não; documentar o achado
4. **Validar o middleware `updateSession`** — confirmar que os cookies são renovados corretamente a cada request e que o redirect para `/login` funciona sem sessão
5. **Escrever teste Vitest** em `apps/web-partner/src/test/` verificando que `getAccessToken()` em `api.ts` retorna `null` quando não há sessão (mock de `createClient`)
6. **Escrever teste Playwright** em `apps/e2e/tests/web-partner/` verificando que rota protegida redireciona para `/login` quando não há cookie de sessão
7. **Verificar no e2e de API** (`apps/e2e/tests/api/health.spec.ts`) se os testes de auth (401) já cobrem rotas partner — completar se necessário

### Critérios de aceite
- [ ] Confirmado: nenhum token de auth é salvo em `localStorage` em web-partner
- [ ] Documentado: atributos reais dos cookies `sb-*` setados pelo Supabase SSR (HttpOnly ou não)
- [ ] Validado: rota `GET /v1/partner/` sem Bearer retorna 401
- [ ] Validado: acesso a rota protegida sem cookie de sessão redireciona para `/login`
- [ ] Teste Vitest passando: `getAccessToken()` retorna `null` sem sessão
- [ ] Build e typecheck passam sem erros

---

## Segurança #2 — SOF-54

**Título:** [SEC] Criptografar dados do cliente salvos no localStorage
**Link:** https://linear.app/venza-project/issue/SOF-54/sec-criptografar-dados-do-cliente-salvos-no-localstorage
**Prioridade:** alta
**Complexidade:** média
**Status:** pendente

### Descrição
Nome, telefone, email e endereços completos do cliente final são salvos no `localStorage` do web-client em texto puro. Em um dispositivo compartilhado ou roubado, qualquer pessoa com acesso ao DevTools pode ver esses dados — relevante para conformidade com LGPD.

**Estado atual confirmado no codebase:**
- `apps/web-client/src/hooks/useEnderecos.ts`:
  - `vendza-enderecos` → array de `Endereco` (id, label, logradouro, numero, bairro, cep, complemento) em JSON puro
  - `vendza-perfil` → `PerfilCliente` (nome, telefone, email) em JSON puro
- `apps/web-client/src/context/CarrinhoContext.tsx`:
  - `vendza_carrinho` → array de `CarrinhoItem` (productId, name, imagemUrl, unitPriceCents, quantity) — não é PII, mas está exposto

**Opção sugerida pela issue:** Web Crypto API (`crypto.subtle`) para criptografia, ou migração para `sessionStorage`.

### Escopo de validação

**Frontend (web-client):**
- `apps/web-client/src/hooks/useEnderecos.ts` — `lerDoStorage` / `salvarNoStorage` — PII (nome, telefone, email, endereços)
- `apps/web-client/src/context/CarrinhoContext.tsx` — carrinho em localStorage (não-PII, mas exposto)
- `apps/web-client/src/app/perfil/page.tsx` — UI que usa os hooks acima

**Backend/API:** Não envolvido — os dados são exclusivamente client-side.

**Estado/Store:** `useEnderecos`, `usePerfil`, `CarrinhoProvider` — todos usam localStorage diretamente.

### Pacotes necessários
- Nenhum — `crypto.subtle` é nativo no browser moderno (disponível via `window.crypto.subtle`)

### Dependências
- Nenhuma (issue autossuficiente)

### Arquivos afetados
```
apps/web-client/src/hooks/useEnderecos.ts
apps/web-client/src/context/CarrinhoContext.tsx
apps/web-client/src/app/perfil/page.tsx (apenas verificar — não modifica se OK)
```

### Plano de validação

1. **Confirmar o escopo exato** — verificar se há outros arquivos no web-client usando `localStorage` com dados PII além dos listados acima (grep por `localStorage.setItem` e `localStorage.getItem`)
2. **Verificar se `sessionStorage` já não atende** — a issue diz "alternativa mais simples: mover para sessionStorage". Avaliar impacto: sessionStorage limpa ao fechar o browser, o que pode degradar UX (usuário perde carrinho/endereços). Documentar o trade-off.
3. **Confirmar que a Web Crypto API está disponível** — verificar se o `tsconfig.json` do web-client inclui `lib: ["es2020", "dom"]` para `crypto.subtle`
4. **Validar implementação existente ou ausência de proteção** — confirmar que os dados estão realmente em texto puro no localStorage (não há criptografia oculta)
5. **Escrever teste Playwright** em `apps/web-client/tests/e2e/` verificando o comportamento do perfil/endereços — já existe `checkout.spec.ts` que usa `page.addInitScript(() => localStorage.setItem(...))` como padrão
6. **Verificar que o carrinho (`vendza_carrinho`)** não contém PII — confirmar se `CarrinhoItem` inclui algum dado pessoal além de product info. Se não, pode permanecer em localStorage sem criptografia.
7. **Documentar conclusão**: se a issue pede implementação (criptografar) ou apenas verificação (confirmar o risco)

### Critérios de aceite
- [ ] Confirmado: `vendza-perfil` e `vendza-enderecos` são armazenados sem proteção em texto puro
- [ ] Documentado: `vendza_carrinho` não contém PII (apenas product data)
- [ ] Avaliado: trade-off entre Web Crypto API vs sessionStorage com recomendação clara
- [ ] Validado: se a issue pede implementação, dados PII protegidos (criptografados ou em sessionStorage)
- [ ] Validado: funcionalidade de perfil e endereços permanece funcional após qualquer mudança
- [ ] Build e typecheck passam sem erros

---

## Resumo de Execução

| # | Issue | Prioridade | Complexidade | Dependências | Status |
|---|-------|-----------|-------------|-------------|--------|
| 1 | SOF-53 — HttpOnly cookies | Alta | Média | Nenhuma | pendente |
| 2 | SOF-54 — Criptografia localStorage | Alta | Média | Nenhuma | pendente |

**Ordem sugerida:** SOF-53 → SOF-54

**Justificativa:** SOF-53 envolve autenticação (risco de comprometimento de conta), que tem severidade maior. SOF-54 é LGPD/privacidade (risco de exposição de PII em dispositivos compartilhados), igualmente importante mas com menor janela de exploração imediata.

**Nenhuma issue precisa de esclarecimento** — ambas têm descrição clara e o codebase foi analisado com profundidade.
