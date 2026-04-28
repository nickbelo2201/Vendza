# Todo Report — Issues em Todo no Linear

> Gerado em: 2026-04-22

---

## todo #1 — SOF-95
Título: P3-03: GitHub Actions CI — typecheck + build em todo PR
Link: https://linear.app/venza-project/issue/SOF-95
Prioridade: Alta
Complexidade: pequena
Descrição: Criar pipeline de CI que bloqueia merge se typecheck ou build falhar. Cria `.github/workflows/ci.yml` com triggers em push/PR para main, instala deps, roda typecheck e build, bloqueia merge se falhar, adiciona badge no README.
Escopo de validação:
  Frontend: N/A
  Backend/API: N/A
  Estado/Store: N/A
  Infra: .github/workflows/ci.yml + README.md
Pacotes necessários: nenhum
Dependências: nenhuma
Arquivos afetados:
  - .github/workflows/ci.yml (novo)
  - README.md (badge)
Status: pendente
Plano de validação:
  1. Criar .github/workflows/ci.yml com triggers corretos
  2. Configurar steps: pnpm install, typecheck, build com env dummies
  3. Adicionar badge de CI no README
  4. Verificar que typecheck passa localmente antes de commitar
Critérios de aceite:
  - CI rodando no GitHub Actions
  - PRs bloqueados se typecheck ou build falhar
  - Badge de status no README

---

## todo #2 — SOF-96
Título: P4-01: Testes Playwright — fluxo completo do cliente
Link: https://linear.app/venza-project/issue/SOF-96
Prioridade: Alta
Complexidade: grande
Descrição: Cobertura e2e do fluxo principal do cliente: age gate → catálogo → filtro → busca → produto → carrinho → checkout → tracking page.
Escopo de validação:
  Frontend: web-client — todas as páginas do fluxo de compra
  Backend/API: rotas de pedido, tracking
  Estado/Store: carrinho, checkout state
Pacotes necessários: @playwright/test (se não instalado)
Dependências: nenhuma (mas deve rodar em staging)
Arquivos afetados:
  - apps/web-client/e2e/ (novo diretório)
  - playwright.config.ts (novo ou existente)
Status: pendente
Plano de validação:
  1. Verificar se Playwright já está configurado no monorepo
  2. Criar spec e2e cobrindo os 8 passos do fluxo
  3. Rodar localmente contra staging/local
  4. Garantir que CI executa os testes
Critérios de aceite:
  - Todos os 8 passos cobertos
  - Teste rodando no CI
  - Nenhum passo falhando em staging

---

## todo #3 — SOF-97
Título: P4-02: Testes Playwright — fluxo completo do parceiro
Link: https://linear.app/venza-project/issue/SOF-97
Prioridade: Alta
Complexidade: grande
Descrição: Cobertura e2e do fluxo do lojista: login → dashboard → pedidos → catálogo → clientes → configurações → logout.
Escopo de validação:
  Frontend: web-partner — todas as páginas do painel
  Backend/API: auth, pedidos, catálogo, clientes, configurações
  Estado/Store: auth session, stores do painel
Pacotes necessários: @playwright/test (compartilhado com SOF-96)
Dependências: nenhuma (mas deve rodar em staging)
Arquivos afetados:
  - apps/web-partner/e2e/ (novo diretório)
  - playwright.config.ts (compartilhado)
Status: pendente
Plano de validação:
  1. Criar spec e2e cobrindo os 7 passos do fluxo do lojista
  2. Configurar credenciais de teste via env vars
  3. Rodar localmente
  4. Integrar no CI
Critérios de aceite:
  - Todos os 7 passos cobertos
  - Teste rodando no CI
  - Nenhum passo falhando em staging

---

## todo #4 — SOF-98
Título: P4-03: Validação mobile e responsividade
Link: https://linear.app/venza-project/issue/SOF-98
Prioridade: Alta
Complexidade: média
Descrição: Garantir usabilidade do web-client em 390px e 768px, e do web-partner em 1024px. Sem overflow horizontal, formulários preenchíveis sem zoom.
Escopo de validação:
  Frontend: web-client (Header, grid, CartSheet, checkout, tracking) + web-partner (sidebar)
  Backend/API: N/A
  Estado/Store: N/A
Pacotes necessários: nenhum
Dependências: nenhuma
Arquivos afetados:
  - apps/web-client/src/ (vários componentes de layout)
  - apps/web-partner/src/ (sidebar, layout)
Status: pendente
Plano de validação:
  1. Auditar cada página do web-client em 390px e 768px
  2. Identificar e corrigir overflows, layouts quebrados
  3. Auditar web-partner em 1024px
  4. Corrigir sidebar e navegação tablet
Critérios de aceite:
  - Testado nos viewports 390px, 768px, 1024px
  - Sem overflow horizontal
  - Formulários preenchíveis sem zoom

---

## todo #5 — SOF-99
Título: P5-01: Logo oficial no painel parceiro e storefront
Link: https://linear.app/venza-project/issue/SOF-99
Prioridade: Alta
Complexidade: pequena
Descrição: Substituir logo placeholder pela logo oficial em web-partner e web-client. Atualizar favicon.
Escopo de validação:
  Frontend: web-partner (Topbar/Sidebar) + web-client (Header)
  Backend/API: N/A
  Estado/Store: N/A
Pacotes necessários: nenhum
Dependências: BLOQUEADA — precisa do arquivo de logo oficial (SVG/PNG) do cliente
Arquivos afetados:
  - apps/web-partner/public/logo.*
  - apps/web-client/public/logo.*
  - apps/web-partner/public/favicon.ico
  - apps/web-client/public/favicon.ico
  - componentes de Header/Sidebar em ambos os apps
Status: bloqueada — aguardando asset da logo do cliente
Plano de validação:
  1. Receber logo oficial em SVG ou PNG
  2. Adicionar em /public/ de ambos os apps
  3. Substituir referências nos componentes
  4. Atualizar favicons
Critérios de aceite:
  - Logo oficial visível em ambos os apps
  - Favicon atualizado
  - Sem logo placeholder restante

---

## todo #6 — SOF-100
Título: P5-02: Revisão final de design — og:image, tipografia e espaçamentos
Link: https://linear.app/venza-project/issue/SOF-100
Prioridade: Média
Complexidade: média
Descrição: Polish visual final: og:image real, favicon correto, fontes e espaçamentos consistentes, cores de badges conferem com Brand Bible, hover states corretos.
Escopo de validação:
  Frontend: ambos os apps — metatags, tipografia, espaçamentos, badges, hover
  Backend/API: N/A
  Estado/Store: N/A
Pacotes necessários: nenhum
Dependências: depende de SOF-98 (P4-03) — rodar após validação mobile
Arquivos afetados:
  - apps/web-client/src/app/layout.tsx (metatags og:image)
  - apps/web-client/public/ (og:image)
  - vários componentes de UI
Status: pendente
Plano de validação:
  1. Configurar og:image real nas metatags do web-client
  2. Revisar tamanhos de fonte em todas as páginas
  3. Revisar espaçamentos inconsistentes
  4. Conferir cores de badges vs Brand Bible
  5. Verificar hover states
Critérios de aceite:
  - Preview correto no WhatsApp/iMessage
  - Nenhuma inconsistência visual grave
  - Aprovado pelo Nicholas

---

## todo #7 — SOF-101
Título: P2-08: Storefront — perfil do cliente salvo em localStorage
Link: https://linear.app/venza-project/issue/SOF-101
Prioridade: Média
Complexidade: média
Descrição: Ícone de perfil no Header → página/sheet /perfil → formulário (nome, telefone, email) → salvo em localStorage (chave vendza-perfil) → checkout pré-preenchido automaticamente.
Escopo de validação:
  Frontend: web-client — Header, página /perfil, checkout form
  Backend/API: N/A (tudo client-side)
  Estado/Store: localStorage vendza-perfil
Pacotes necessários: nenhum
Dependências: nenhuma
Arquivos afetados:
  - apps/web-client/src/app/layout.tsx ou Header component
  - apps/web-client/src/app/perfil/ (nova página ou sheet)
  - apps/web-client/src/app/checkout/ (pré-preenchimento)
Status: pendente
Plano de validação:
  1. Adicionar ícone de perfil no Header
  2. Criar página/sheet /perfil com formulário
  3. Persistir dados em localStorage (vendza-perfil)
  4. Pré-preencher checkout com dados salvos
Critérios de aceite:
  - Cliente preenche perfil → dados no localStorage
  - Checkout pré-preenchido automaticamente
  - Funciona offline

---

## todo #8 — SOF-102
Título: P2-09: Storefront — endereços favoritos para checkout rápido
Link: https://linear.app/venza-project/issue/SOF-102
Prioridade: Média
Complexidade: média
Descrição: Salvar até 3 endereços em localStorage (vendza-enderecos). No checkout, listar endereços salvos com botão de seleção rápida. Opção de salvar endereço após pedido confirmado.
Escopo de validação:
  Frontend: web-client — checkout form, confirmação de pedido
  Backend/API: N/A (tudo client-side)
  Estado/Store: localStorage vendza-enderecos
Pacotes necessários: nenhum
Dependências: depende de SOF-101 (P2-08 — perfil do cliente) — complemento natural
Arquivos afetados:
  - apps/web-client/src/app/checkout/ (lista de endereços salvos)
  - apps/web-client/src/app/pedido/[id]/ ou confirmação (salvar endereço)
Status: pendente
Plano de validação:
  1. Criar hook/util para gerenciar endereços no localStorage
  2. No checkout, exibir lista de endereços salvos
  3. Seleção preenche campos automaticamente
  4. Após pedido confirmado, oferecer salvar endereço
  5. Respeitar limite de 3 endereços (mais recente primeiro)
Critérios de aceite:
  - Salva endereço após pedido
  - Na próxima compra, endereços aparecem no checkout
  - Seleção preenche automaticamente
  - Limite de 3 respeitado

---

## Progresso

| Issue | Título | Status | Commit |
|-------|--------|--------|--------|
| SOF-95 | GitHub Actions CI | aprovado | 1eb194a |
| SOF-96 | Playwright — fluxo cliente | aprovado | 9e6de89 |
| SOF-97 | Playwright — fluxo parceiro | aprovado | 9e6de89 |
| SOF-98 | Validação mobile | aprovado | 9efc827 |
| SOF-99 | Logo oficial | bloqueada | — |
| SOF-100 | Revisão design | aprovado | 4a5cba6 |
| SOF-101 | Perfil localStorage | aprovado | f12a4a9 |
| SOF-102 | Endereços favoritos | aprovado | 1d274f4 |

> Push realizado em 2026-04-22. Branch: main. 7/8 issues entregues. SOF-99 bloqueada aguardando logo do cliente.
