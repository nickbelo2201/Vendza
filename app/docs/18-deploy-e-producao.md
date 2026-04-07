# 18 — Deploy, Produção e Boas Práticas

> Documento vivo. Atualizar sempre que houver mudança em infraestrutura ou workflow.
> Última atualização: 2026-04-07

---

## Ambientes

| Serviço | URL | Branch | Plataforma |
|---|---|---|---|
| API (backend) | `https://vendza-production.up.railway.app` | `master` | Railway |
| Painel parceiro | `https://web-partner-three.vercel.app` | `main` | Vercel |
| Vitrine cliente | _(deploy pendente)_ | `main` | Vercel |

---

## Estratégia de Branches

```
master  ← branch de trabalho principal (Railway deploya daqui)
main    ← branch de produção Vercel (sincronizado com master via push)
```

**Regra:** todo desenvolvimento acontece em `master`. Quando quiser publicar no Vercel, faça push de `master` para `main`:

```bash
git push origin master          # atualiza Railway
git push origin master:main     # atualiza Vercel
```

> **Nunca trabalhe diretamente no `main`.** O `main` é somente destino de push.

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

### Após commitar

```bash
git push origin master           # sempre
git push origin master:main      # quando quiser publicar no Vercel
```

---

## Configuração do Vercel (web-partner)

| Campo | Valor |
|---|---|
| Framework Preset | **Next.js** |
| Root Directory | `app/apps/web-partner` |
| Build Command | `cd ../.. && pnpm --filter @vendza/web-partner build` |
| Install Command | `cd ../.. && npm install -g pnpm@10.0.0 && pnpm install --frozen-lockfile` |
| Output Directory | _(Next.js default — não sobrescrever)_ |
| Vercel Authentication | **Disabled** |

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
| Branch | `master` |
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
**Solução aplicada:** removida do `next.config.ts` do web-partner.

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

Antes de fazer `git push origin master:main`:

- [ ] `corepack pnpm typecheck` passa sem erros
- [ ] Nenhum `meta.stub: true` em endpoints que deveriam estar funcionais
- [ ] Variáveis de ambiente novas foram adicionadas no Vercel/Railway
- [ ] Migrações de banco executadas (`corepack pnpm db:migrate` ou `db:push`)
- [ ] Não há arquivos `.env` ou secrets no commit

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
```
