# 18 — Deploy, Produção e Boas Práticas

> Documento vivo. Atualizar sempre que houver mudança em infraestrutura ou workflow.
> Última atualização: 2026-04-29

---

## Ambientes

| Serviço | URL | Branch | Plataforma |
|---|---|---|---|
| API (backend) | `https://vendza-production.up.railway.app` | `main` | Railway |
| Painel parceiro | `https://web-partner-three.vercel.app` | `main` | Vercel |
| Vitrine cliente | _(URL a confirmar após primeiro deploy)_ | `main` | Vercel |

---

## Estratégia de Branches

```
main    ← produção. Ninguém faz push direto aqui.
feat/*  ← todo desenvolvimento acontece aqui.
```

**Regra fundamental:** nenhum push vai direto para `main`. Todo código novo passa por uma feature branch, gera uma preview URL automática no Vercel, é testada pelo fundador e só então é mergeada.

**O fundador é o único responsável pelo merge e push para `main`.** Agentes autônomos e colaboradores externos nunca fazem push direto para `main`.

### Fluxo padrão de desenvolvimento

```bash
# 1. Criar branch para a mudança
git checkout -b feat/nome-da-mudanca

# 2. Desenvolver, commitar normalmente
git add <arquivos>
git commit -m "feat(escopo): descrição"

# 3. Subir a branch — Vercel gera preview URL automaticamente
git push origin feat/nome-da-mudanca
# → URL de preview: https://web-partner-git-feat-nome-da-mudanca-nick.vercel.app

# 4. Fundador testa na preview URL

# 5. Fundador cria PR no GitHub (nickbelo2201/Vendza)
# → PR template é aplicado automaticamente

# 6. Após aprovação, fundador faz o merge e push para main
git checkout main
git merge feat/nome-da-mudanca
git push origin main
# → Deploy automático no Railway e Vercel (produção)
```

---

## Pre-push Hook — Proteção do Main

O repositório possui um hook Git em `.git/hooks/pre-push` que **bloqueia qualquer push direto para `main`**.

Se alguém tentar:
```bash
git push origin main   # ← este comando é bloqueado pelo hook
```

O hook aborta o push e exibe uma mensagem de erro. Isso garante que nenhuma mudança vá para produção sem passar pelo fluxo de review.

**O fundador é o único que faz push para main**, e faz isso somente após merge do PR que foi testado na preview.

### Como o hook funciona

O arquivo `.git/hooks/pre-push` verifica o branch de destino e rejeita o push se for `main`. Ele não impede o desenvolvimento normal em feature branches.

---

## Pull Request Template

O arquivo `.github/pull_request_template.md` é aplicado automaticamente ao abrir um PR no GitHub. Ele orienta o autor a descrever:

- O que foi feito
- Como testar na preview URL
- Checklist antes do merge

Preencher o template corretamente é obrigatório para que o fundador possa testar e aprovar com segurança.

---

## Workflow de Commit

### Antes de commitar

1. Garanta que as mudanças não têm erro de TypeScript:
   ```bash
   cd app && corepack pnpm typecheck
   ```
2. Verifique quais arquivos estão modificados:
   ```bash
   git status
   git diff --name-only HEAD
   ```
3. Nunca commite arquivos `.env`, `.env.local`, ou qualquer arquivo com secrets.

### Formato do commit (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta>

[corpo opcional]
```

Tipos:

| Tipo | Quando usar |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `chore` | manutenção, dependências, configs |
| `refactor` | refatoração sem mudança de comportamento |
| `docs` | documentação |
| `ci` | pipeline, deploy, infra |

Exemplos:
```bash
git commit -m "feat(web-partner): adicionar filtro de status no painel de pedidos"
git commit -m "fix(api): corrigir cálculo de frete em zonas sobrepostas"
git commit -m "chore: atualizar pnpm-lock.yaml após adicionar socket.io-client"
```

### Commits atômicos

Sempre commitar TODOS os arquivos relacionados à mudança juntos. Arquivos modificados mas não commitados ficam fora do deploy e causam inconsistências em produção.

---

## Configuração do Vercel (web-partner)

| Campo | Valor |
|---|---|
| Framework Preset | **Next.js** |
| Root Directory | `app/apps/web-partner` |
| Build Command | `cd ../.. && pnpm --filter @vendza/web-partner build` |
| Install Command | `cd ../.. && npm install -g pnpm@10.0.0 && pnpm install --frozen-lockfile` |
| Output Directory | _(Next.js default — não sobrescrever)_ |
| Production Branch | `main` |
| Vercel Authentication | **Disabled** |

### Preview Deployments

O Vercel gera automaticamente uma URL de preview para qualquer branch que não seja `main`. Use isso para validar mudanças antes de ir para produção:

```bash
git push origin feat/novo-layout
# Vercel notifica com URL: https://web-partner-git-feat-novo-layout-nick.vercel.app
```

A preview URL é o ambiente de homologação do projeto. O fundador testa aqui antes de autorizar o merge.

### Variáveis de ambiente (Vercel)

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://vendza-production.up.railway.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lpjjpvwlwvzlmjyedkfd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | _(chave pública do Supabase)_ |

---

## Configuração do Railway (API)

| Campo | Valor |
|---|---|
| Branch | `main` |
| Root Directory | `app` |
| Build Command | _(definido no railway.toml)_ |
| Start Command | _(definido no railway.toml)_ |

O arquivo `app/railway.toml` contém toda a configuração de build da API. Nunca alterar sem testar localmente.

---

## Problemas conhecidos e soluções

### `Cannot find module 'next/dist/compiled/next-server/server.runtime.prod.js'`
**Causa:** pnpm usa virtual store com symlinks; o runtime do Vercel não resolve esses links.
**Solução aplicada:** `app/.npmrc` com `shamefully-hoist=true` (pnpm instala direto em `node_modules/` como npm).

### `outputFileTracingRoot` quebra o deploy no Vercel
**Causa:** essa config é exclusiva para `output: 'standalone'`. Sem ela, confunde o file tracing do Vercel e o `next` não é incluído no bundle de runtime.
**Solução aplicada:** removida do `next.config.ts` do web-partner. Regra: nunca adicionar `outputFileTracingRoot` sem `output: 'standalone'`.

### `No Output Directory named "public" found`
**Causa:** Framework Preset configurado como "Other" no Vercel (espera `public/`) em vez de "Next.js" (espera `.next/`).
**Solução:** sempre usar Framework Preset = **Next.js** nos projetos Next.js.

### `ERR_PNPM_NO_PKG_MANIFEST No package.json found in /`
**Causa:** Install command usando `corepack enable && corepack pnpm` — o `corepack` falha no ambiente Railway/Vercel.
**Solução:** substituir por `npm install -g pnpm@10.0.0` diretamente.

### TypeScript build fail no Vercel por mudanças não commitadas
**Causa:** arquivos modificados localmente mas não commitados ficam fora do deploy.
**Solução:** sempre commitar e fazer push de TODOS os arquivos relevantes antes de publicar.

---

## Checklist de publicação

Antes de abrir o PR e solicitar merge para `main`:

- [ ] Feature branch criada a partir do `main` atualizado
- [ ] `corepack pnpm typecheck` passa sem erros
- [ ] Nenhum `meta.stub: true` em endpoints que deveriam estar funcionais
- [ ] Variáveis de ambiente novas foram adicionadas no Vercel/Railway
- [ ] Migrações de banco executadas (`corepack pnpm db:migrate`)
- [ ] Não há arquivos `.env` ou secrets no commit
- [ ] Todos os arquivos relacionados à mudança estão commitados
- [ ] Preview URL testada pelo fundador
- [ ] PR preenchido com o template do repositório

---

## Estrutura de arquivos de configuração de infra

```
app/
├── .npmrc                    # shamefully-hoist=true (resolve pnpm + Vercel)
├── railway.toml              # configuração de build/start da API no Railway
├── apps/
│   ├── web-partner/
│   │   └── next.config.ts    # transpilePackages, sem outputFileTracingRoot
│   └── web-client/
│       └── next.config.ts    # transpilePackages, sem outputFileTracingRoot
└── packages/
    └── database/
        └── prisma/
            └── schema.prisma

.github/
└── pull_request_template.md  # template obrigatório para PRs

.git/hooks/
└── pre-push                  # bloqueia push direto para main
```
